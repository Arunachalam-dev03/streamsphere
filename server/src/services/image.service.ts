import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

interface ImageVariant {
  suffix: string;
  width: number;
  height: number;
  quality: number;
}

const AVATAR_VARIANTS: ImageVariant[] = [
  { suffix: '_sm', width: 88, height: 88, quality: 85 },    // Navbar, comments, video card
  { suffix: '_md', width: 176, height: 176, quality: 85 },  // 2x for retina
  { suffix: '_lg', width: 256, height: 256, quality: 80 },  // Channel page, settings
];

const BANNER_VARIANTS: ImageVariant[] = [
  { suffix: '_sm', width: 1060, height: 175, quality: 80 },  // Mobile
  { suffix: '_md', width: 1546, height: 256, quality: 80 },  // Tablet
  { suffix: '_lg', width: 2560, height: 424, quality: 75 },  // Desktop
];

export class ImageService {

  /**
   * Process an avatar image: crop to a perfect circle-friendly square,
   * resize to multiple variants, and output as WebP for performance.
   */
  static async processAvatar(inputPath: string, outputDir: string, baseName: string): Promise<string[]> {
    const outputPaths: string[] = [];

    // Read source image metadata
    const metadata = await sharp(inputPath).metadata();
    const width = metadata.width || 256;
    const height = metadata.height || 256;

    // Center-crop to a square
    const size = Math.min(width, height);
    const left = Math.round((width - size) / 2);
    const top = Math.round((height - size) / 2);

    for (const variant of AVATAR_VARIANTS) {
      const outputPath = path.join(outputDir, `${baseName}${variant.suffix}.webp`);

      await sharp(inputPath)
        .extract({ left, top, width: size, height: size })
        .resize(variant.width, variant.height, {
          fit: 'cover',
          kernel: sharp.kernel.lanczos3,
        })
        .webp({ quality: variant.quality })
        .toFile(outputPath);

      outputPaths.push(outputPath);
    }

    return outputPaths;
  }

  /**
   * Process a banner image: crop to the YouTube banner aspect ratio,
   * resize to multiple variants, and output as WebP.
   */
  static async processBanner(inputPath: string, outputDir: string, baseName: string): Promise<string[]> {
    const outputPaths: string[] = [];

    for (const variant of BANNER_VARIANTS) {
      const outputPath = path.join(outputDir, `${baseName}${variant.suffix}.webp`);

      await sharp(inputPath)
        .resize(variant.width, variant.height, {
          fit: 'cover',
          position: 'centre',
          kernel: sharp.kernel.lanczos3,
        })
        .webp({ quality: variant.quality })
        .toFile(outputPath);

      outputPaths.push(outputPath);
    }

    return outputPaths;
  }

  /**
   * Quick-process a single image (crop to square & resize).
   * Returns the path to the processed file.
   */
  static async processAndReplace(inputPath: string, size: number = 256): Promise<string> {
    const ext = path.extname(inputPath);
    const outputPath = inputPath.replace(ext, '.webp');

    const metadata = await sharp(inputPath).metadata();
    const w = metadata.width || size;
    const h = metadata.height || size;
    const cropSize = Math.min(w, h);
    const left = Math.round((w - cropSize) / 2);
    const top = Math.round((h - cropSize) / 2);

    await sharp(inputPath)
      .extract({ left, top, width: cropSize, height: cropSize })
      .resize(size, size, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
      .webp({ quality: 95, effort: 6 }) // Maximize quality and encoding effort
      .toFile(outputPath);

    // Cleanup original if different
    if (outputPath !== inputPath) {
      try { fs.unlinkSync(inputPath); } catch {}
    }

    return outputPath;
  }
}
