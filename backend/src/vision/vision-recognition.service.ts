import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListingsService } from '../listings/listings.service';
import { OllamaService } from './ollama.service';
import { EmbeddingService } from './embedding.service';
import { VectorSearchService } from './vector-search.service';
import { ClipService } from './clip.service';
import { OCRService } from './ocr.service';

export type RecognizeMode = 'auto' | 'dish' | 'drink' | 'wine' | 'menu';

export interface Candidate {
  id: string;
  type: string;
  name: string;
  photoUrl: string | null;
  avgRating: number;
  reviewCount: number;
  confidence: number; // 0..1
}
export interface RecognizeResult {
  caption: string;
  mode: RecognizeMode;
  candidates: Candidate[];
  autoOpen: boolean;
  diagnostic?: string;
}

function bigrams(s: string) {
  const t = ` ${(s ?? '').toLowerCase().trim()} `;
  const o: string[] = [];
  for (let i = 0; i < t.length - 1; i++) o.push(t.slice(i, i + 2));
  return o;
}
function dice(a: string, b: string) {
  const A = bigrams(a), B = bigrams(b);
  if (!A.length || !B.length) return 0;
  const m = new Map<string, number>();
  for (const g of B) m.set(g, (m.get(g) ?? 0) + 1);
  let hit = 0;
  for (const g of A) { const c = m.get(g) ?? 0; if (c > 0) { hit++; m.set(g, c - 1); } }
  return (2 * hit) / (A.length + B.length);
}

@Injectable()
export class VisionRecognitionService {
  private readonly log = new Logger('VisionRecognition');
  private readonly AUTO_OPEN = Number(process.env.VISION_AUTO_OPEN ?? 0.9);

  constructor(
    private readonly prisma: PrismaService,
    private readonly listings: ListingsService,
    private readonly ollama: OllamaService,
    private readonly embed: EmbeddingService,
    private readonly vectors: VectorSearchService,
    private readonly clip: ClipService,
    private readonly ocr: OCRService,
  ) {}

  async recognize(image: Buffer, mode: RecognizeMode = 'auto'): Promise<RecognizeResult> {
    if (mode === 'wine') return this.recognizeWine(image);
    if (mode === 'menu') return this.recognizeMenu(image);

    // PRIMARY: CLIP image-to-image — fast (~250ms) + accurate + language-independent
    const qvec = await this.clip.embedImage(image);
    if (qvec.length) {
      const type = mode === 'drink' ? 'DRINK' : mode === 'dish' ? 'DISH' : undefined;
      const hits = this.vectors.searchImage(qvec, { type, limit: 8 });
      const candidates = await this.shape(hits.map((h) => ({ id: h.id, confidence: h.score })));
      const top = candidates[0]?.confidence ?? 0;
      if (candidates.length) {
        return {
          caption: 'фото',
          mode,
          candidates,
          autoOpen: top >= this.AUTO_OPEN,
          diagnostic: `clip:image top=${top.toFixed(2)} imageIndex=${this.vectors.imageSize}`,
        };
      }
      this.log.warn(`CLIP produced no candidates: imageIndex=${this.vectors.imageSize} rawHits=${hits.length}`);
    }
    // FALLBACK (CLIP unavailable): VLM caption → translate → text search
    return this.recognizeByCaption(image, mode);
  }

  /** Shape a scored id list into enriched candidates (top-5), preserving order. */
  private async shape(scored: { id: string; confidence: number }[]): Promise<Candidate[]> {
    const ids = scored.map((s) => s.id);
    if (!ids.length) return [];
    const items = await this.prisma.listing.findMany({
      where: { id: { in: ids } },
      select: { id: true, type: true, name: true, photoUrl: true, avgRating: true, reviewCount: true },
    });
    const byId = new Map(items.map((i) => [i.id, i]));
    return scored
      .map((s) => {
        const it = byId.get(s.id);
        if (!it) return null;
        return {
          id: it.id,
          type: it.type,
          name: it.name,
          photoUrl: it.photoUrl,
          avgRating: it.avgRating,
          reviewCount: it.reviewCount,
          confidence: Math.max(0, Math.min(1, Math.round(s.confidence * 100) / 100)),
        };
      })
      .filter(Boolean)
      .slice(0, 5) as Candidate[];
  }

  /** Legacy fallback: VLM caption → RU normalize → name + text-embedding search. */
  private async recognizeByCaption(image: Buffer, mode: RecognizeMode): Promise<RecognizeResult> {
    const caption = await this.ollama.generate(
      this.ollama.visionModel,
      'What single food or drink is in this photo? Answer with only its short name (2-4 words).',
      [image.toString('base64')],
      30000,
    );
    if (!caption) return { caption: '', mode, candidates: [], autoOpen: false, diagnostic: 'fallback:no_caption' };
    const norm = await this.ollama.generate(
      this.ollama.textModel,
      `Переведи название блюда или напитка на русский коротко (1-3 слова), только название: "${caption}"`,
      undefined,
      10000,
    );
    const query = (norm || caption).replace(/["'.]/g, '').split('\n')[0].trim();
    const candidates = await this.rankByText(query, mode === 'drink' ? 'DRINK' : mode === 'dish' ? 'DISH' : undefined);
    return {
      caption: query,
      mode,
      candidates,
      autoOpen: (candidates[0]?.confidence ?? 0) >= 0.95,
      diagnostic: `fallback:caption query="${query}" candidates=${candidates.length}`,
    };
  }

  private async rankByText(query: string, type?: 'DISH' | 'DRINK'): Promise<Candidate[]> {
    const nameIds = await this.listings.recognizeSearch(query, type, 20);
    const qvec = await this.embed.embedText(query);
    const vecHits = qvec.length ? this.vectors.search(qvec, { type, limit: 20 }) : [];
    const vecScore = new Map(vecHits.map((h) => [h.id, h.score]));
    const ids = [...new Set([...nameIds.map((r) => r.id), ...vecHits.map((h) => h.id)])];
    if (!ids.length) return [];
    const items = await this.prisma.listing.findMany({
      where: { id: { in: ids } },
      select: { id: true, type: true, name: true, photoUrl: true, avgRating: true, reviewCount: true },
    });
    const scored = items.map((it) => {
      const nameSim = dice(it.name, query);
      const sem = vecScore.get(it.id) ?? 0;
      return { id: it.id, confidence: Math.max(nameSim, 0.35 * nameSim + 0.65 * sem) };
    });
    scored.sort((a, b) => b.confidence - a.confidence);
    return this.shape(scored);
  }

  private async recognizeWine(image: Buffer): Promise<RecognizeResult> {
    const raw = await this.ocr.text(image);
    let query = raw;
    if (raw) {
      const parsed = await this.ollama.generate(
        this.ollama.textModel,
        `Это текст с винной этикетки. Верни ТОЛЬКО название/производителя вина одной строкой:\n"${raw.slice(0, 400)}"`,
        undefined,
        10000,
      );
      query = (parsed || raw).split('\n')[0].trim();
    }
    const candidates = query ? await this.rankByText(query, 'DRINK') : [];
    return { caption: query, mode: 'wine', candidates, autoOpen: false };
  }

  private async recognizeMenu(image: Buffer): Promise<RecognizeResult> {
    const raw = await this.ocr.text(image);
    const lines = this.ocr.lines(raw);
    const seen = new Set<string>();
    const candidates: Candidate[] = [];
    for (const line of lines) {
      const best = (await this.rankByText(line))[0];
      if (best && best.confidence >= 0.5 && !seen.has(best.id)) {
        seen.add(best.id);
        candidates.push(best);
      }
      if (candidates.length >= 12) break;
    }
    return { caption: `Меню: найдено ${candidates.length}`, mode: 'menu', candidates, autoOpen: false };
  }
}
