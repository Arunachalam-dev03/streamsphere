import NodeMediaServer from 'node-media-server';
import { env } from '../config/env';
import { LiveService } from './live.service';
import path from 'path';
import fs from 'fs';

let nms: any = null;

/**
 * Initialize and start the RTMP media server.
 * Converts incoming RTMP streams to HLS for browser playback.
 */
export function startMediaServer() {
  const mediaRoot = path.resolve(env.LIVE_HLS_PATH);

  // Ensure media directory exists
  if (!fs.existsSync(mediaRoot)) {
    fs.mkdirSync(mediaRoot, { recursive: true });
  }

  const config = {
    rtmp: {
      port: env.RTMP_PORT,
      chunk_size: 60000,
      gop_cache: true,
      ping: 30,
      ping_timeout: 60,
    },
    http: {
      port: 8888, // Internal HTTP port for HLS segments
      mediaroot: mediaRoot,
      allow_origin: '*',
    },
    trans: {
      ffmpeg: process.env.FFMPEG_PATH || '/usr/bin/ffmpeg',
      tasks: [
        {
          app: 'live',
          hls: true,
          hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
          hlsKeep: false,
          dash: false,
        },
      ],
    },
  };

  nms = new NodeMediaServer(config);

  // ─── Auth: Validate stream key on publish ───────────────────────
  nms.on('prePublish', async (id: string, streamPath: string, _args: any) => {
    console.log(`📡 RTMP: prePublish - ${streamPath}`);

    // streamPath format: /live/{streamKey}
    const parts = streamPath.split('/');
    const streamKey = parts[parts.length - 1];

    if (!streamKey) {
      console.log('❌ RTMP: No stream key provided, rejecting');
      const session = nms.getSession(id);
      if (session) session.reject();
      return;
    }

    try {
      const isValid = await LiveService.validateStreamKey(streamKey);
      if (!isValid) {
        console.log(`❌ RTMP: Invalid stream key: ${streamKey}`);
        const session = nms.getSession(id);
        if (session) session.reject();
        return;
      }

      // Mark stream as LIVE
      await LiveService.startStream(streamKey);
      console.log(`✅ RTMP: Stream authenticated and started: ${streamKey}`);
    } catch (error: any) {
      console.error('❌ RTMP: Auth error:', error.message);
      const session = nms.getSession(id);
      if (session) session.reject();
    }
  });

  // ─── Cleanup: Mark stream as ended on disconnect ────────────────
  nms.on('donePublish', async (_id: string, streamPath: string, _args: any) => {
    console.log(`📡 RTMP: donePublish - ${streamPath}`);

    const parts = streamPath.split('/');
    const streamKey = parts[parts.length - 1];

    if (streamKey) {
      try {
        await LiveService.endStream(streamKey);
        console.log(`✅ RTMP: Stream ended: ${streamKey}`);
      } catch (error: any) {
        console.error('⚠️ RTMP: Error ending stream:', error.message);
      }
    }
  });

  nms.on('prePlay', (_id: string, streamPath: string, _args: any) => {
    console.log(`👁️ RTMP: Viewer connected - ${streamPath}`);
  });

  nms.on('donePlay', (_id: string, streamPath: string, _args: any) => {
    console.log(`👁️ RTMP: Viewer disconnected - ${streamPath}`);
  });

  nms.run();

  console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║     📡  RTMP Media Server                    ║
║     🔴  RTMP Port: ${String(env.RTMP_PORT).padEnd(25)}║
║     📂  HLS Path: ${mediaRoot.substring(0, 24).padEnd(26)}║
║                                              ║
╚══════════════════════════════════════════════╝
  `);

  return nms;
}

export function getMediaServer() {
  return nms;
}
