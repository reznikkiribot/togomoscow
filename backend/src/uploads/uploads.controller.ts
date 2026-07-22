import {
  BadRequestException,
  Controller,
  Get,
  Head,
  Param,
  Post,
  Query,
  Req,
  Body,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { Readable } from 'stream';
import { createHash } from 'crypto';
import sharp from 'sharp';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UploadsService } from './uploads.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

// allowed thumbnail widths (whitelist → bounded cache keys)
const THUMB_WIDTHS = new Set([200, 400, 600, 900]);
const MAX_PROXY_BYTES = 15 * 1024 * 1024;
const MAX_THUMB_SOURCE_BYTES = 30 * 1024 * 1024;
const MAX_RAW_BYTES = 85 * 1024 * 1024;

type StoredImage = Awaited<ReturnType<UploadsService['get']>>;

// SSRF guard for the external-image proxy: https only, public hostnames only
function safeExternalUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return null;
    const h = u.hostname;
    if (/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.)/.test(h)) return null;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return null;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) return null; // no raw IPs at all
    if (h.endsWith('.internal') || h.endsWith('.local')) return null;
    return u;
  } catch {
    return null;
  }
}

function setImageHeaders(
  res: Response,
  contentType: string,
  immutable = true,
  meta?: Pick<StoredImage, 'contentLength' | 'etag' | 'lastModified'>,
) {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', immutable ? 'public, max-age=31536000, immutable' : 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (meta?.contentLength != null) res.setHeader('Content-Length', String(meta.contentLength));
  if (meta?.etag) res.setHeader('ETag', meta.etag);
  if (meta?.lastModified) res.setHeader('Last-Modified', meta.lastModified.toUTCString());
}

function imageError(res: Response, status: number) {
  if (res.headersSent) {
    res.destroy();
    return;
  }
  setImageHeaders(res, 'text/plain; charset=utf-8', false);
  res.status(status).end();
}

function pipeWithTimeout(body: Readable, res: Response, timeoutMs = 20_000) {
  const timeout = setTimeout(() => {
    body.destroy(new Error('storage stream timeout'));
    imageError(res, 504);
  }, timeoutMs);
  const cleanup = () => clearTimeout(timeout);
  body.once('error', () => {
    cleanup();
    imageError(res, 502);
  });
  res.once('finish', cleanup);
  res.once('close', cleanup);
  body.pipe(res);
}

async function readLimited(body: Readable, maxBytes: number, idleTimeoutMs: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  let timeout: NodeJS.Timeout | undefined;
  const armTimeout = () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => body.destroy(new Error('storage read timeout')), idleTimeoutMs);
  };
  armTimeout();
  try {
    for await (const chunk of body as any) {
      armTimeout();
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > maxBytes) {
        body.destroy();
        throw new Error('image too large');
      }
      chunks.push(buffer);
    }
    return Buffer.concat(chunks);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function readStored(
  uploads: UploadsService,
  key: string,
  maxBytes: number,
  idleTimeoutMs: number,
  attempts = 2,
): Promise<{ buffer: Buffer; object: StoredImage }> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let object: StoredImage | undefined;
    try {
      object = await uploads.get(key);
      const buffer = await readLimited(object.body, maxBytes, idleTimeoutMs);
      return { buffer, object };
    } catch (error) {
      object?.body.destroy();
      lastError = error;
    }
  }
  throw lastError;
}

function sendImageBuffer(
  res: Response,
  buffer: Buffer,
  contentType: string,
  object?: StoredImage,
) {
  setImageHeaders(res, contentType, true, {
    contentLength: buffer.length,
    etag: object?.etag,
    lastModified: object?.lastModified,
  });
  res.end(buffer);
}

function errorStatus(error: any, fallback = 502) {
  const status = Number(error?.$metadata?.httpStatusCode ?? error?.statusCode ?? 0);
  return status === 404 || error?.code === 'ENOENT' || error?.name === 'NoSuchKey' ? 404 : fallback;
}

async function fetchExternalImage(initial: URL, signal: AbortSignal): Promise<globalThis.Response> {
  let current = initial;
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const response = await fetch(current.href, {
      signal,
      redirect: 'manual',
      headers: { Accept: 'image/avif,image/webp,image/*,*/*;q=0.5' },
    });
    if (response.status < 300 || response.status >= 400) return response;
    const location = response.headers.get('location');
    const next = location ? safeExternalUrl(new URL(location, current).href) : null;
    await response.body?.cancel().catch(() => {});
    if (!next) throw new Error('unsafe redirect');
    current = next;
  }
  throw new Error('too many redirects');
}

@Controller()
export class UploadsController {
  constructor(
    private readonly uploads: UploadsService,
    private readonly users: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  // Authenticated upload. Returns a same-origin URL the Mini App can render
  // (served back through /api/files so it works through the dev tunnel).
  @Post('uploads')
  @UseGuards(TelegramAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 80 * 1024 * 1024 } }))
  async upload(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { source?: string },
  ) {
    if (!file) throw new BadRequestException('No file');
    if (!file.mimetype?.startsWith('image/')) throw new BadRequestException('Only images are allowed');
    try {
      await sharp(file.buffer).metadata();
    } catch {
      throw new BadRequestException('Invalid image');
    }
    const user = await this.users.upsertFromTelegram(req.telegramUser);
    const source = body?.source === 'camera' || body?.source === 'gallery' ? body.source : 'unknown';
    const key = await this.uploads.put(file.buffer, file.mimetype);
    await this.prisma.uploadedAsset.create({
      data: { key, userId: user.id, source, contentType: file.mimetype },
    });
    return { url: `/api/files/${key}` };
  }

  // External-image proxy+resize: catalog photos live on unsplash/brand CDNs and
  // weigh megabytes — this serves a small cached WebP from OUR origin instead
  // (one HTTP/2 connection, immutable browser cache → card photos load instantly).
  @Get('img')
  async externalImg(@Query('u') u: string, @Query('w') w: string, @Res() res: Response) {
    const width = THUMB_WIDTHS.has(Number(w)) ? Number(w) : 600;
    const url = safeExternalUrl(u ?? '');
    if (!url) {
      imageError(res, 400);
      return;
    }
    const cacheKey = `ext-${createHash('sha1').update(`${url.href}|${width}`).digest('hex')}`;
    try {
      const obj = await this.uploads.get(cacheKey);
      setImageHeaders(res, 'image/webp');
      pipeWithTimeout(obj.body, res);
      return;
    } catch {
      /* not cached yet */
    }
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 10_000);
    try {
      const r = await fetchExternalImage(url, ctrl.signal);
      if (!r.ok) throw new Error(`upstream ${r.status}`);
      const length = Number(r.headers.get('content-length') ?? 0);
      if (length > MAX_PROXY_BYTES) throw new Error('too large');
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length > MAX_PROXY_BYTES) throw new Error('too large');
      const thumb = await sharp(buf).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
      setImageHeaders(res, 'image/webp');
      res.end(thumb);
      this.uploads.putAt(cacheKey, thumb, 'image/webp').catch(() => {});
    } catch (error: any) {
      // let the client fall back to the original URL
      imageError(res, error?.name === 'AbortError' ? 504 : 502);
    } finally {
      clearTimeout(timeout);
    }
  }

  // ?w=200|400|600|900 → resized WebP thumbnail, generated once and cached back
  // into storage — feed photos load in a fraction of the original's size/time.
  @Head('files/:key')
  async fileHead(@Param('key') key: string, @Query('w') w: string, @Res() res: Response) {
    const width = Number(w);
    const wantThumb = THUMB_WIDTHS.has(width);
    const cacheKey = wantThumb ? `${key}-w${width}` : key;
    try {
      const meta = await this.uploads.head(cacheKey);
      setImageHeaders(res, wantThumb ? 'image/webp' : (meta.contentType ?? 'image/jpeg'), true, meta);
      res.end();
    } catch (error) {
      imageError(res, errorStatus(error));
    }
  }

  @Get('files/:key')
  async file(@Param('key') key: string, @Query('w') w: string, @Res() res: Response) {
    const width = Number(w);
    const wantThumb = THUMB_WIDTHS.has(width);
    const cacheKey = wantThumb ? `${key}-w${width}` : key;
    try {
      const stored = await readStored(this.uploads, cacheKey, wantThumb ? MAX_PROXY_BYTES : MAX_RAW_BYTES, 30_000);
      sendImageBuffer(res, stored.buffer, wantThumb ? 'image/webp' : (stored.object.contentType ?? 'image/jpeg'), stored.object);
      return;
    } catch (error) {
      /* thumb not cached yet (or key missing) → try to build it */
      if (!wantThumb) {
        // A previously generated derivative is much better than a broken image.
        // This also keeps old reviews visible when the original bucket object is
        // temporarily unreadable but the immutable thumbnail cache is healthy.
        for (const fallbackWidth of [900, 600, 400, 200]) {
          try {
            const stored = await readStored(this.uploads, `${key}-w${fallbackWidth}`, MAX_PROXY_BYTES, 30_000);
            sendImageBuffer(res, stored.buffer, 'image/webp', stored.object);
            return;
          } catch {
            /* try the next cached derivative */
          }
        }
        imageError(res, errorStatus(error));
        return;
      }
    }
    try {
      const orig = await readStored(this.uploads, key, MAX_THUMB_SOURCE_BYTES, 30_000);
      const thumb = await sharp(orig.buffer).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
      sendImageBuffer(res, thumb, 'image/webp');
      // cache for next time (fire-and-forget)
      this.uploads.putAt(cacheKey, thumb, 'image/webp').catch(() => {});
    } catch (error) {
      imageError(res, errorStatus(error));
    }
  }

}
