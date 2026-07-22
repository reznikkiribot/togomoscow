import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import type { Readable } from 'stream';
import sharp from 'sharp';

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly logger = new Logger(UploadsService.name);
  private readonly s3?: S3Client;
  private readonly bucket: string;
  private readonly uploadDir: string;
  private readonly useS3: boolean;
  private readonly availability = new Map<string, { status: 'available' | 'missing' | 'unknown'; expires: number }>();

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('MINIO_BUCKET') ?? 'uploads';
    this.uploadDir = this.config.get<string>('UPLOAD_DIR') ?? join(process.cwd(), 'uploads-data');

    // Storage is configured at process start; keep local and Railway S3 behind
    // the same interface so response handling does not depend on the provider.
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

  private async send(command: any, timeoutMs = 15_000): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await this.s3!.send(command, { abortSignal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  async onModuleInit() {
    if (!this.useS3) {
      await mkdir(this.uploadDir, { recursive: true });
      this.logger.warn(`Object storage is not configured; using local directory ${this.uploadDir}`);
      return;
    }

    this.logger.log(`Object storage enabled (bucket: ${this.bucket})`);

    try {
      await this.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.send(new CreateBucketCommand({ Bucket: this.bucket }));
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

    await this.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
      60_000,
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
    await this.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: contentType }),
      30_000,
    );
  }

  private async localMetadata(key: string) {
    const [file, contentType] = await Promise.all([
      stat(join(this.uploadDir, key)),
      readFile(join(this.uploadDir, `${key}.json`), 'utf8')
        .then((raw) => {
          const meta = JSON.parse(raw);
          return typeof meta.contentType === 'string' ? meta.contentType : undefined;
        })
        .catch(() => undefined),
    ]);
    return { contentType, contentLength: file.size, lastModified: file.mtime };
  }

  async head(key: string): Promise<{
    contentType?: string;
    contentLength?: number;
    etag?: string;
    lastModified?: Date;
  }> {
    if (!this.useS3) {
      return this.localMetadata(key);
    }

    const res = await this.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
    return {
      contentType: res.ContentType,
      contentLength: res.ContentLength,
      etag: res.ETag,
      lastModified: res.LastModified,
    };
  }

  /** Check a same-origin stored URL without downloading it. `unknown` deliberately
   *  differs from `missing`: a transient S3 outage must never trigger DB cleanup. */
  async storedUrlStatus(url: string): Promise<'available' | 'missing' | 'unknown'> {
    const match = url.match(/^\/api\/files\/([a-zA-Z0-9._-]+)/);
    if (!match) return 'available';
    const key = match[1];
    const cached = this.availability.get(key);
    if (cached && cached.expires > Date.now()) return cached.status;
    const check = async (candidate: string) => {
      try {
        await this.head(candidate);
        return 'available' as const;
      } catch (error: any) {
        const status = Number(error?.$metadata?.httpStatusCode ?? error?.statusCode ?? 0);
        if (status === 404 || error?.code === 'ENOENT' || error?.name === 'NoSuchKey' || error?.name === 'NotFound') return 'missing' as const;
        return 'unknown' as const;
      }
    };
    let status = await check(key);
    // The file controller can serve an immutable derivative even when an old
    // original disappeared, so keep that URL alive when any derivative exists.
    if (status === 'missing') {
      for (const width of [900, 600, 400, 200]) {
        const derivative = await check(`${key}-w${width}`);
        if (derivative === 'available') { status = derivative; break; }
        if (derivative === 'unknown') { status = derivative; break; }
      }
    }
    this.availability.set(key, {
      status,
      expires: Date.now() + (status === 'available' ? 30 * 60_000 : status === 'missing' ? 5 * 60_000 : 30_000),
    });
    return status;
  }

  async get(key: string): Promise<{
    body: Readable;
    contentType?: string;
    contentLength?: number;
    etag?: string;
    lastModified?: Date;
  }> {
    if (!this.useS3) {
      // stat() first: createReadStream() reports a missing file asynchronously,
      // after the controller may already have committed a 200 response.
      const meta = await this.localMetadata(key);
      return { body: createReadStream(join(this.uploadDir, key)), ...meta };
    }

    const res = await this.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return {
      body: res.Body as Readable,
      contentType: res.ContentType,
      contentLength: res.ContentLength,
      etag: res.ETag,
      lastModified: res.LastModified,
    };
  }
}
