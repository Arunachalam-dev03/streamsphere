import fs from 'fs';
import path from 'path';
import { minioClient } from '../config/minio';
import { env } from '../config/env';

export class StorageService {
  // Upload file to MinIO
  static async uploadFile(
    filePath: string,
    objectName: string,
    contentType: string
  ): Promise<string> {
    const fileStream = fs.createReadStream(filePath);
    const stat = fs.statSync(filePath);

    await minioClient.putObject(
      env.MINIO_BUCKET,
      objectName,
      fileStream,
      stat.size,
      { 'Content-Type': contentType }
    );

    const publicBase = process.env.CORS_ORIGIN || 'https://streamsphere.arunai.pro';
    return `${publicBase}/${env.MINIO_BUCKET}/${objectName}`;
  }

  // Upload buffer to MinIO
  static async uploadBuffer(
    buffer: Buffer,
    objectName: string,
    contentType: string
  ): Promise<string> {
    await minioClient.putObject(
      env.MINIO_BUCKET,
      objectName,
      buffer,
      buffer.length,
      { 'Content-Type': contentType }
    );

    return `http://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${env.MINIO_BUCKET}/${objectName}`;
  }

  // Upload a directory (for HLS output)
  static async uploadDirectory(
    localDir: string,
    remotePrefix: string
  ): Promise<void> {
    const files = fs.readdirSync(localDir);
    for (const file of files) {
      const filePath = path.join(localDir, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const contentType = file.endsWith('.m3u8')
          ? 'application/vnd.apple.mpegurl'
          : file.endsWith('.ts')
            ? 'video/mp2t'
            : 'application/octet-stream';
        await this.uploadFile(filePath, `${remotePrefix}/${file}`, contentType);
      }
    }
  }

  // Get presigned URL for download
  static async getPresignedUrl(objectName: string, expiry: number = 3600): Promise<string> {
    return await minioClient.presignedGetObject(env.MINIO_BUCKET, objectName, expiry);
  }

  // Delete object
  static async deleteObject(objectName: string): Promise<void> {
    await minioClient.removeObject(env.MINIO_BUCKET, objectName);
  }

  // Delete directory (all objects with prefix)
  static async deleteDirectory(prefix: string): Promise<void> {
    const objectsList: string[] = [];
    const stream = minioClient.listObjects(env.MINIO_BUCKET, prefix, true);

    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name) objectsList.push(obj.name);
      });
      stream.on('error', reject);
      stream.on('end', async () => {
        if (objectsList.length > 0) {
          await minioClient.removeObjects(env.MINIO_BUCKET, objectsList);
        }
        resolve();
      });
    });
  }

  // Clean up temporary file
  static cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  }
}
