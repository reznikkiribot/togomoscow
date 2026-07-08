import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TelegramAuthGuard } from '../common/telegram-auth.guard';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ListingsService } from '../listings/listings.service';
import { VectorSearchService } from './vector-search.service';
import { VisionRecognitionService, type RecognizeMode } from './vision-recognition.service';

@Controller('vision')
export class VisionController {
  constructor(
    private readonly recognition: VisionRecognitionService,
    private readonly users: UsersService,
    private readonly prisma: PrismaService,
    private readonly listings: ListingsService,
    private readonly vectors: VectorSearchService,
  ) {}

  /** Recognize a dish/drink/wine/menu from a photo → top-5 candidates. */
  @Post('recognize')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  async recognize(@UploadedFile() file: Express.Multer.File, @Body() body: { mode?: RecognizeMode }) {
    if (!file) throw new BadRequestException('No image');
    const mode = body?.mode ?? 'auto';
    try {
      return await this.recognition.recognize(file.buffer, mode);
    } catch (e) {
      return {
        caption: '',
        mode,
        candidates: [],
        autoOpen: false,
        diagnostic: `server:${String((e as Error).message || e).slice(0, 240)}`,
      };
    }
  }

  /** Confirmation/correction → training data + a positive recsys signal. */
  @Post('feedback')
  @UseGuards(TelegramAuthGuard)
  async feedback(
    @Req() req: any,
    @Body()
    body: {
      photoUrl?: string;
      caption?: string;
      mode?: string;
      predictedIds?: string[];
      topConfidence?: number;
      chosenId?: string;
    },
  ) {
    const user = await this.users.upsertFromTelegram(req.telegramUser);
    const predicted = body.predictedIds ?? [];
    await this.prisma.recognitionFeedback
      .create({
        data: {
          userId: user.id,
          photoUrl: body.photoUrl ?? null,
          caption: body.caption ?? null,
          mode: body.mode ?? 'dish',
          predictedIds: predicted,
          topConfidence: body.topConfidence ?? null,
          chosenId: body.chosenId ?? null,
          wasTop: body.chosenId ? predicted[0] === body.chosenId : null,
        },
      })
      .catch(() => {});
    if (body.chosenId) {
      this.prisma.interaction
        .create({ data: { userId: user.id, listingId: body.chosenId, type: 'OPEN', weight: 1 } })
        .catch(() => {});
    }
    return { ok: true };
  }

  /** "🤖 Похожие …" — gated: only for users who've rated enough to have a taste profile. */
  @Get('similar/:id')
  @UseGuards(TelegramAuthGuard)
  async similar(@Req() req: any, @Param('id') id: string) {
    const user = await this.users.upsertFromTelegram(req.telegramUser);
    const min = Number(process.env.RECS_MIN_REVIEWS ?? 15);
    const count = await this.prisma.review.count({ where: { userId: user.id } });
    if (count < min) return { locked: true, items: [] };
    const hits = this.vectors.similarTo(id, 8);
    if (!hits.length) return { locked: false, items: [] };
    const rows = await this.prisma.listing.findMany({ where: { id: { in: hits.map((h) => h.id) } } });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const ordered = hits.map((h) => byId.get(h.id)).filter(Boolean) as typeof rows;
    const items = await this.listings.enrichCards(ordered);
    return { locked: false, items };
  }
}
