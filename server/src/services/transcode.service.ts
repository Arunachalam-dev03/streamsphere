import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { StorageService } from './storage.service';

interface TranscodeResult {
  hlsUrl: string;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
}

const RESOLUTIONS = [
  { name: '360p', width: 640, height: 360, bitrate: '800k' },
  { name: '720p', width: 1280, height: 720, bitrate: '2500k' },
  { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' },
  { name: '2160p', width: 3840, height: 2160, bitrate: '14000k' },
];

// Vertical (9:16) resolution profiles for Shorts
const VERTICAL_RESOLUTIONS = [
  { name: '360p', width: 360, height: 640, bitrate: '800k' },
  { name: '720p', width: 720, height: 1280, bitrate: '2500k' },
  { name: '1080p', width: 1080, height: 1920, bitrate: '5000k' },
];

export class TranscodeService {
  static async getVideoDuration(inputPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) return reject(err);
        resolve(Math.floor(metadata.format.duration || 0));
      });
    });
  }

  static async generateThumbnail(
    inputPath: string,
    videoId: string
  ): Promise<string> {
    const outputDir = path.join(process.cwd(), 'uploads', 'temp', videoId);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const thumbnailFile = 'thumbnail.jpg';
    const thumbnailPath = path.join(outputDir, thumbnailFile);

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: ['10%'],
          filename: thumbnailFile,
          folder: outputDir,
          size: '?x720',
        })
        .on('end', async () => {
          try {
            const url = await StorageService.uploadFile(
              thumbnailPath,
              `videos/${videoId}/thumbnail.jpg`,
              'image/jpeg'
            );
            StorageService.cleanupTempFile(thumbnailPath);
            resolve(url);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  static async transcodeToHLS(
    inputPath: string,
    videoId: string
  ): Promise<string> {
    const outputDir = path.join(process.cwd(), 'uploads', 'temp', videoId, 'hls');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get video info to determine available resolutions
    const metadata = await new Promise<any>((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
    const sourceWidth = videoStream?.width || 1280;
    const sourceHeight = videoStream?.height || 720;
    const isVertical = sourceHeight > sourceWidth;

    // Pick resolution table based on orientation
    const resolutionTable = isVertical ? VERTICAL_RESOLUTIONS : RESOLUTIONS;
    const sourceMax = isVertical ? sourceHeight : sourceHeight; // compare by height

    // Only transcode to resolutions <= source resolution
    const targetResolutions = resolutionTable.filter(r => r.height <= sourceMax);
    if (targetResolutions.length === 0) {
      targetResolutions.push(resolutionTable[0]); // At least lowest quality
    }

    // Transcode each resolution
    const variantPlaylists: string[] = [];

    for (const res of targetResolutions) {
      const resDir = path.join(outputDir, res.name);
      if (!fs.existsSync(resDir)) {
        fs.mkdirSync(resDir, { recursive: true });
      }

      await new Promise<void>((resolve, reject) => {
        const scaleFilter = isVertical
          ? `-vf scale=${res.width}:${res.height}:force_original_aspect_ratio=decrease,pad=${res.width}:${res.height}:(ow-iw)/2:(oh-ih)/2:black`
          : `-vf scale=${res.width}:${res.height}:force_original_aspect_ratio=decrease,pad=${res.width}:${res.height}:(ow-iw)/2:(oh-ih)/2`;

        ffmpeg(inputPath)
          .outputOptions([
            scaleFilter,
            `-preset ultrafast`,
            `-c:v libx264`,
            `-b:v ${res.bitrate}`,
            `-c:a aac`,
            `-b:a 128k`,
            `-hls_time 6`,
            `-hls_list_size 0`,
            `-hls_segment_filename ${path.join(resDir, 'segment_%03d.ts')}`,
            `-f hls`,
          ])
          .output(path.join(resDir, 'playlist.m3u8'))
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });

      variantPlaylists.push(res.name);
    }

    // Create master playlist
    let masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:3\n';
    for (const res of targetResolutions) {
      const bandwidth = parseInt(res.bitrate) * 1000;
      masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${res.width}x${res.height}\n`;
      masterPlaylist += `${res.name}/playlist.m3u8\n`;
    }

    const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
    fs.writeFileSync(masterPlaylistPath, masterPlaylist);

    // Upload all HLS files to storage
    const remotePrefix = `videos/${videoId}/hls`;

    // Upload master playlist
    await StorageService.uploadFile(
      masterPlaylistPath,
      `${remotePrefix}/master.m3u8`,
      'application/vnd.apple.mpegurl'
    );

    // Upload each resolution's files
    for (const res of targetResolutions) {
      const resDir = path.join(outputDir, res.name);
      await StorageService.uploadDirectory(resDir, `${remotePrefix}/${res.name}`);
    }

    // Cleanup temp directory
    fs.rmSync(path.join(process.cwd(), 'uploads', 'temp', videoId), { recursive: true, force: true });

    const publicBase = process.env.CORS_ORIGIN || 'https://streamsphere.arunai.pro';
    const hlsUrl = `${publicBase}/${process.env.MINIO_BUCKET || 'streamsphere'}/${remotePrefix}/master.m3u8`;
    return hlsUrl;
  }

  static async processVideo(
    inputPath: string,
    videoId: string
  ): Promise<TranscodeResult> {
    console.log(`🎬 Starting video processing for: ${videoId}`);

    // Get duration and dimensions
    const metadata = await new Promise<any>((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    const duration = Math.floor(metadata.format.duration || 0);
    const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
    const width = videoStream?.width || 0;
    const height = videoStream?.height || 0;

    console.log(`⏱️ Duration: ${duration}s | 📐 Resolution: ${width}x${height} ${height > width ? '(vertical/short)' : height === width ? '(square/short)' : '(horizontal)'}`);

    // Generate thumbnail
    const thumbnailUrl = await this.generateThumbnail(inputPath, videoId);
    console.log(`🖼️ Thumbnail generated`);

    // Transcode to HLS
    const hlsUrl = await this.transcodeToHLS(inputPath, videoId);
    console.log(`📺 HLS transcoding complete`);

    // Upload original video
    await StorageService.uploadFile(
      inputPath,
      `videos/${videoId}/original${path.extname(inputPath)}`,
      'video/mp4'
    );

    // Clean up original temp file
    StorageService.cleanupTempFile(inputPath);

    console.log(`✅ Video processing complete for: ${videoId}`);
    return { hlsUrl, thumbnailUrl, duration, width, height };
  }
}
