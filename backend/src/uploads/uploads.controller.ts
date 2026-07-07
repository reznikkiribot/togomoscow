import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UploadsService } from './uploads.service';

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

  @Get('files/:key')
  async file(@Param('key') key: string, @Res() res: Response) {
    try {
      const obj = await this.uploads.get(key);
      res.setHeader('Content-Type', obj.contentType ?? 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      obj.body.pipe(res);
    } catch {
      res.status(404).end();
    }
  }
}
