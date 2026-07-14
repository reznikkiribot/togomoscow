import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
  topConfident?: boolean; // the top match is >0.9 — pre-highlight it, but never auto-open
  diagnostic?: string;
  labelText?: string; // Vivino-style: the brand read off a wine/beer label
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
export class VisionRecognitionService implements OnModuleInit {
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

  onModuleInit() {
    if (process.env.VISION_AUTO_BACKFILL === '0') return;
    const delayMs = Number(process.env.VISION_AUTO_BACKFILL_DELAY_MS ?? 5000);
    setTimeout(() => {
      this.backfillImageEmbeddings().catch((e) => this.log.warn(`image backfill failed: ${e?.message}`));
    }, delayMs);
  }

  async recognize(image: Buffer, mode: RecognizeMode = 'auto'): Promise<RecognizeResult> {
    if (mode === 'wine') return this.recognizeLabel(image);
    if (mode === 'menu') return this.recognizeMenu(image);

    // PRIMARY: CLIP image-to-image — fast (~250ms) + accurate + language-independent.
    // Embed ONCE and reuse for bottle-detection (no second embed → faster).
    const qvec = await this.clip.embedImage(image);
    // Vivino-style: a BOTTLE/CAN label is recognized by its TEXT (labels all look
    // alike to CLIP). Detect via the SAME embedding, then OCR.
    if ((mode === 'auto' || mode === 'drink') && qvec.length) {
      const probs = await this.clip.classifyVec(qvec, ClipService.BOTTLE_LABELS);
      if (probs && probs[0] >= 0.45) return this.recognizeLabel(image);
    }
    if (qvec.length) {
      const type = mode === 'drink' ? 'DRINK' : mode === 'dish' ? 'DISH' : undefined;
      // GUARD: don't guess a dish for a photo that clearly ISN'T food (a selfie,
      // a person, a screenshot). Reuse the one embedding — no extra work.
      const kind = await this.clip.classifyVec(qvec, [
        'a photo of food or a drink',
        'a photo of a person, face or selfie',
        'a photo of a screenshot, text or an unrelated object',
      ]);
      if (kind && (kind[1] > 0.5 || kind[2] > 0.55) && kind[0] < 0.4) {
        return {
          caption: kind[1] > kind[2] ? 'На фото человек, а не блюдо' : 'На фото не блюдо и не напиток',
          mode, candidates: [], autoOpen: false,
          diagnostic: `not-food food=${kind[0].toFixed(2)} person=${kind[1].toFixed(2)} other=${kind[2].toFixed(2)}`,
        };
      }
      const hits = this.vectors.searchImage(qvec, { type, limit: 8 });
      const candidates = await this.shape(hits.map((h) => ({ id: h.id, confidence: h.score })));
      const top = candidates[0]?.confidence ?? 0;
      if (candidates.length) {
        return {
          caption: 'фото',
          mode,
          candidates,
          // NEVER auto-open (owner rule): even at 100% confidence the human keeps
          // the final say on which dish/drink it is. We only PRE-HIGHLIGHT the top.
          autoOpen: false,
          topConfident: top >= this.AUTO_OPEN,
          diagnostic: `clip:image top=${top.toFixed(2)} imageIndex=${this.vectors.imageSize}`,
        };
      }
      this.log.warn(`CLIP produced no candidates: imageIndex=${this.vectors.imageSize} rawHits=${hits.length}`);
    }
    // FALLBACK (CLIP unavailable): VLM caption → translate → text search
    return this.recognizeByCaption(image, mode);
  }

  private async backfillImageEmbeddings() {
    if (this.vectors.imageSize > 0) return;
    const limit = Math.max(1, Math.min(Number(process.env.VISION_AUTO_BACKFILL_LIMIT ?? 80), 250));
    const origin = (process.env.PUBLIC_APP_URL || 'https://togomoscow-production.up.railway.app').replace(/\/$/, '');
    const rows = await this.prisma.$queryRawUnsafe<{ id: string; name: string; photoUrl: string }[]>(
      `SELECT id, name, photo_url AS "photoUrl"
         FROM listings
        WHERE type::text IN ('DISH','DRINK')
          AND photo_url IS NOT NULL
          AND COALESCE(array_length(image_embedding, 1), 0) = 0
        ORDER BY
          CASE
            WHEN lower(name) LIKE '%болонь%' OR lower(name) LIKE '%bologn%' THEN 0
            WHEN lower(name) LIKE '%паста%' OR lower(name) LIKE '%спагет%' OR lower(name) LIKE '%pasta%' THEN 1
            ELSE 2
          END,
          review_count DESC
        LIMIT ${limit}`,
    );
    if (!rows.length) return;
    this.log.log(`auto image backfill started: ${rows.length} items`);
    let done = 0;
    let failed = 0;
    for (const row of rows) {
      try {
        const url = row.photoUrl.startsWith('http') ? row.photoUrl : `${origin}${row.photoUrl}`;
        const vec = await this.clip.embedImage(url);
        if (!vec.length) {
          failed++;
          continue;
        }
        await this.prisma.listing.update({ where: { id: row.id }, data: { imageEmbedding: vec } });
        done++;
      } catch {
        failed++;
      }
    }
    const counts = await this.vectors.rebuild();
    this.log.log(`auto image backfill done: embedded=${done}, failed=${failed}, imageIndex=${counts.image}`);
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
      autoOpen: false, // never auto-open — the user always confirms (owner rule)
      topConfident: (candidates[0]?.confidence ?? 0) >= 0.95,
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

  /** Vivino-style label recognition (wine AND beer): OCR the label, distil the
   *  brand line, search the catalog + look the brand up on the open web
   *  (Open Food Facts) so unknown bottles still resolve to a proper name. */
  private async recognizeLabel(image: Buffer): Promise<RecognizeResult> {
    const raw = await this.ocr.text(image);
    // brand line: the longest meaningful OCR lines (labels shout the brand)
    const lines = this.ocr.lines(raw).slice(0, 6);
    let query = lines
      .sort((a, b) => b.length - a.length)
      .slice(0, 2)
      .join(' ')
      .replace(/\b\d{4}\b/g, '') // vintage years only add noise
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60);
    // a local LLM (if present) distils the brand better than heuristics
    const parsed = await this.ollama
      .generate(
        this.ollama.textModel,
        `Это текст с этикетки вина или пива. Верни ТОЛЬКО название бренда/напитка одной строкой:\n"${raw.slice(0, 400)}"`,
        undefined,
        8000,
      )
      .catch(() => null);
    if (parsed?.trim()) query = parsed.split('\n')[0].trim().slice(0, 60);
    const candidates = query ? await this.rankByText(query, 'DRINK') : [];
    // web brand lookup (free, no key): confirms/officialises the name
    let webName: string | null = null;
    if (query) {
      try {
        const r = await fetch(
          `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=3&fields=product_name,brands`,
          { signal: AbortSignal.timeout(5000) },
        );
        if (r.ok) {
          const j: any = await r.json();
          const prod = (j.products ?? []).find((p: any) => p.product_name || p.brands);
          if (prod) webName = [prod.brands, prod.product_name].filter(Boolean).join(' ').slice(0, 60);
        }
      } catch {
        /* web lookup is best-effort */
      }
    }
    const caption = webName || query || 'этикетка';
    return {
      caption: caption ? `🍷 Этикетка: ${caption}` : 'Этикетка не читается',
      mode: 'wine',
      candidates,
      autoOpen: false,
      labelText: caption || undefined,
      diagnostic: `label ocr="${query}" web="${webName ?? ''}"`,
    };
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
