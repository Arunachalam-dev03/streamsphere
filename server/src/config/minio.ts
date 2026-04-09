import { Client } from 'minio';
import { env } from './env';

export const minioClient = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

export async function ensureBucket(): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(env.MINIO_BUCKET);
    if (!exists) {
      await minioClient.makeBucket(env.MINIO_BUCKET, 'us-east-1');
      // Set public read policy for video streaming
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${env.MINIO_BUCKET}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(env.MINIO_BUCKET, JSON.stringify(policy));
      console.log(`✅ MinIO bucket "${env.MINIO_BUCKET}" created with public read policy`);
    } else {
      console.log(`✅ MinIO bucket "${env.MINIO_BUCKET}" exists`);
    }
  } catch (error) {
    console.error('❌ MinIO error:', error);
  }
}

export default minioClient;
