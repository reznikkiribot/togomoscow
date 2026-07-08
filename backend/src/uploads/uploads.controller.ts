import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import sharp from 'sharp';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UploadsService } from './uploads.service';

// allowed thumbnail widths (whitelist → bounded cache keys)
const THUMB_WIDTHS = new Set([200, 400, 600, 900]);

@Controller()
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  // Authenticated upload. Returns a same-origin URL the Mini App can render
  // (served back through /api/files so it works through the dev tunnel).
  @Post('uploads')
  @UseGuards(TelegramAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 80 * 1024 * 1024 } }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file');
    const key = await this.uploads.put(file.buffer, file.mimetype);
    return { url: `/api/files/${key}` };
  }

  // ?w=200|400|600|900 → resized WebP thumbnail, generated once and cached back
  // into storage — feed photos load in a fraction of the original's size/time.
  @Get('files/:key')
  async file(@Param('key') key: string, @Query('w') w: string, @Res() res: Response) {
    const width = Number(w);
    const wantThumb = THUMB_WIDTHS.has(width);
    const cacheKey = wantThumb ? `${key}-w${width}` : key;
    try {
      const obj = await this.uploads.get(cacheKey);
      res.setHeader('Content-Type', wantThumb ? 'image/webp' : (obj.contentType ?? 'application/octet-stream'));
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      obj.body.pipe(res);
      return;
    } catch {
      /* thumb not cached yet (or key missing) → try to build it */
    }
    if (!wantThumb) {
      res.status(404).end();
      return;
    }
    try {
      const orig = await this.uploads.get(key);
      const chunks: Buffer[] = [];
      for await (const c of orig.body) chunks.push(c as Buffer);
      const thumb = await sharp(Buffer.concat(chunks)).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.end(thumb);
      // cache for next time (fire-and-forget)
      this.uploads.putAt(cacheKey, thumb, 'image/webp').catch(() => {});
    } catch {
      res.status(404).end();
    }
  }
}
