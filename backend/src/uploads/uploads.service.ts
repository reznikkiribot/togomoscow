import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import type { Readable } from 'stream';
import sharp from 'sharp';

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly s3?: S3Client;
  private readonly bucket: string;
  private readonly uploadDir: string;
  private readonly useS3: boolean;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('MINIO_BUCKET') ?? 'uploads';
    this.uploadDir = this.config.get<string>('UPLOAD_DIR') ?? join(process.cwd(), 'uploads-data');

    const endpoint = this.config.get<string>('MINIO_ENDPOINT');
    const accessKeyId = this.config.get<string>('MINIO_ACCESS_KEY');
    const secretAccessKey = this.config.get<string>('MINIO_SECRET_KEY');
    this.useS3 = Boolean(endpoint && accessKeyId && secretAccessKey);

    if (this.useS3) {
      this.s3 = new S3Client({
        endpoint,
        region: this.config.get<string>('MINIO_REGION') ?? 'us-east-1',
        credentials: {
          accessKeyId: accessKeyId!,
          secretAccessKey: secretAccessKey!,
        },
        // local MinIO needs path-style; Railway buckets (t3.storageapi.dev) are
        // virtual-host style → set MINIO_FORCE_PATH_STYLE=false there
        forcePathStyle: (this.config.get<string>('MINIO_FORCE_PATH_STYLE') ?? 'true') !== 'false',
      });
    }
  }

  async onModuleInit() {
    if (!this.useS3) {
      await mkdir(this.uploadDir, { recursive: true });
      return;
    }

    try {
      await this.s3!.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.s3!.send(new CreateBucketCommand({ Bucket: this.bucket }));
      } catch {
        // The bucket may already exist, or object storage may not be ready yet.
      }
    }
  }

  async put(buffer: Buffer, contentType: string): Promise<string> {
    const key = randomUUID();
    let body = buffer;

    if (contentType?.startsWith('image/') && !/gif|svg/.test(contentType)) {
      try {
        body = await sharp(buffer).rotate().toBuffer();
      } catch {
        body = buffer;
      }
    }

    if (!this.useS3) {
      await writeFile(join(this.uploadDir, key), body);
      await writeFile(join(this.uploadDir, `${key}.json`), JSON.stringify({ contentType }));
      return key;
    }

    await this.s3!.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return key;
  }

  /** Store bytes under an EXPLICIT key (thumbnail cache) — no transforms applied. */
  async putAt(key: string, buffer: Buffer, contentType: string): Promise<void> {
    if (!this.useS3) {
      await writeFile(join(this.uploadDir, key), buffer);
      await writeFile(join(this.uploadDir, `${key}.json`), JSON.stringify({ contentType }));
      return;
    }
    await this.s3!.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: contentType }),
    );
  }

  async get(key: string): Promise<{ body: Readable; contentType?: string }> {
    if (!this.useS3) {
      let contentType: string | undefined;
      try {
        const meta = JSON.parse(await readFile(join(this.uploadDir, `${key}.json`), 'utf8'));
        contentType = typeof meta.contentType === 'string' ? meta.contentType : undefined;
      } catch {
        contentType = undefined;
      }
      return { body: createReadStream(join(this.uploadDir, key)), contentType };
    }

    const res = await this.s3!.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return { body: res.Body as Readable, contentType: res.ContentType };
  }
}
