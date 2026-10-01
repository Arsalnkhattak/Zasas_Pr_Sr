import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';
import { logger } from '../utils/logger';

export interface StorageProvider {
  uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string>;
  getFile(key: string): Promise<Buffer>;
  getPresignedUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<string>;
  getPresignedViewUrl(key: string, expiresIn?: number): Promise<string>;
  deleteFile(key: string): Promise<void>;
}

class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), env.LOCAL_STORAGE_DIR);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    return path.join(this.baseDir, key);
  }

  async uploadFile(key: string, buffer: Buffer, _contentType: string): Promise<string> {
    const fullPath = this.getFilePath(key);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, buffer);
    return `/api/v1/documents/file/${key}`;
  }

  async getFile(key: string): Promise<Buffer> {
    const fullPath = this.getFilePath(key);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${key}`);
    }
    return fs.readFileSync(fullPath);
  }

  async getPresignedUploadUrl(key: string, _contentType: string): Promise<string> {
    return `/api/v1/documents/upload-direct/${key}`;
  }

  async getPresignedViewUrl(key: string): Promise<string> {
    return `/api/v1/documents/file/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    const fullPath = this.getFilePath(key);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}

class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = env.S3_BUCKET;
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY || '',
        secretAccessKey: env.S3_SECRET_KEY || '',
      },
    });
  }

  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return key;
  }

  async getFile(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
    const streamToBuffer = async (stream: any): Promise<Buffer> => {
      return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk: any) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    };
    return streamToBuffer(response.Body);
  }

  async getPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async getPresignedViewUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async deleteFile(_key: string): Promise<void> {
    // S3 Delete implementation
  }
}

export const storage: StorageProvider =
  env.STORAGE_PROVIDER === 's3' && env.S3_ACCESS_KEY
    ? new S3StorageProvider()
    : new LocalStorageProvider();

logger.info(`💾 Storage initialized using provider: ${env.STORAGE_PROVIDER}`);
