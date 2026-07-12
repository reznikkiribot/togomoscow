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
import { UploadsService } from '../uploads/uploads.service';
import { ClipService } from './clip.service';
import { VectorSearchService } from './vector-search.service';
import { VisionRecognitionService, type RecognizeMode } from './vision-recognition.service';

const MAX_EXEMPLARS = 20; // per item — bounds memory while keeping variety

@Controller('vision')
export class VisionController {
  constructor(
    private readonly recognition: VisionRecognitionService,
    private readonly users: UsersService,
    private readonly prisma: PrismaService,
    private readonly listings: ListingsService,
    private readonly uploads: UploadsService,
    private readonly clip: ClipService,
    private readonly vectors: VectorSearchService,
  ) {}

  /** Prototype learning: the CONFIRMED photo becomes a new reference view of the
   *  item — embedded and added to the live index, so the NEXT scan of the same
   *  dish matches this real-world photo, not just the catalog picture. */
  private async learnFromFeedback(photoUrl: string, chosenId: string) {
    const key = photoUrl.match(/\/api\/files\/([\w-]+)/)?.[1];
    if (!key) return;
    const listing = await this.prisma.listing.findUnique({
      where: { id: chosenId },
      select: { id: true, type: true },
    });
    if (!listing || (listing.type !== 'DISH' && listing.type !== 'DRINK')) return;
    const obj = await this.uploads.get(key);
    const chunks: Buffer[] = [];
    for await (const c of obj.body) chunks.push(c as Buffer);
    const vec = await this.clip.embedImage(Buffer.concat(chunks));
    if (!vec.length) return;
    await this.prisma.recognitionExemplar.create({ data: { listingId: chosenId, embedding: vec } });
    this.vectors.addImageExemplar(chosenId, listing.type, vec); // learn instantly
    // cap: drop the oldest beyond MAX_EXEMPLARS
    const extra = await this.prisma.recognitionExemplar.findMany({
      where: { listingId: chosenId },
      orderBy: { createdAt: 'desc' },
      skip: MAX_EXEMPLARS,
      select: { id: true },
    });
    if (extra.length) {
      await this.prisma.recognitionExemplar.deleteMany({ where: { id: { in: extra.map((x) => x.id) } } });
    }
  }

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
      // every confirmation trains the recognizer (fire-and-forget)
      if (body.photoUrl) this.learnFromFeedback(body.photoUrl, body.chosenId).catch(() => {});
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
    // the source item's kind — «похожие» must stay in the same lane (a smoothie
    // is not "similar" to a matcha latte just because the stock photos rhyme)
    const src = await this.prisma.listing.findUnique({ where: { id }, select: { type: true, category: true } });
    const hits = this.vectors.similarTo(id, 24); // over-fetch, then filter by kind
    if (!hits.length) return { locked: false, items: [] };
    const rows = await this.prisma.listing.findMany({ where: { id: { in: hits.map((h) => h.id) } } });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const catToken = (c?: string | null) => (c ?? '').toLowerCase().replace(/\s.*/, '');
    const srcCat = catToken(src?.category);
    let ordered = hits
      .map((h) => byId.get(h.id))
      .filter((r): r is NonNullable<typeof r> => !!r && r.id !== id)
      // same TYPE (dish/drink); same broad category when the source has one
      .filter((r) => (!src?.type || r.type === src.type) && (!srcCat || catToken(r.category) === srcCat));
    // if the category filter is too strict (few results), relax to same type only
    if (ordered.length < 3) {
      ordered = hits
        .map((h) => byId.get(h.id))
        .filter((r): r is NonNullable<typeof r> => !!r && r.id !== id && (!src?.type || r.type === src.type));
    }
    const items = await this.listings.enrichCards(ordered.slice(0, 8));
    return { locked: false, items };
  }
}
