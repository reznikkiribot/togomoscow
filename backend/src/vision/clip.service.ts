import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

// CLIP image encoder running locally in-process (Transformers.js → ONNX, open-source,
// no cloud). Produces a 512-dim image embedding in ~200-500ms, so photo recognition is
// pure image-to-image similarity — fast (<2s) AND language-independent (no VLM/translation).
// Loaded once and kept warm. Degrades gracefully (returns []) if the runtime is missing.
@Injectable()
export class ClipService implements OnModuleInit {
  private readonly log = new Logger('CLIP');
  private extractor: any = null;
  private RawImage: any = null;
  private loading: Promise<any> | null = null;
  readonly model = process.env.CLIP_MODEL || 'Xenova/clip-vit-base-patch32';

  async onModuleInit() {
    // warm the model at startup (background) so the first scan isn't slow
    this.load().catch((e) => this.log.warn(`CLIP preload failed: ${e?.message}`));
  }

  private async load() {
    if (this.extractor) return this.extractor;
    if (this.loading) return this.loading;
    this.loading = (async () => {
      const t0 = Date.now();
      // @xenova/transformers is ESM → dynamic import from our CJS build
      const { pipeline, env, RawImage } = await import('@xenova/transformers');
      (env as any).cacheDir = process.env.CLIP_CACHE || './.models-cache';
      (env as any).allowRemoteModels = true;
      this.RawImage = RawImage;
      this.extractor = await pipeline('image-feature-extraction', this.model);
      this.log.log(`CLIP ready (${this.model}) in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
      return this.extractor;
    })();
    return this.loading;
  }

  get ready() {
    return !!this.extractor;
  }

  /** Embed an image (Buffer or URL) → normalized 512-dim vector. [] on failure. */
  async embedImage(input: Buffer | string): Promise<number[]> {
    try {
      const ex = await this.load();
      // string → URL/path (fetched by transformers.js); Buffer → decode via RawImage
      // (data URIs are NOT supported by transformers.js v2)
      const img =
        typeof input === 'string'
          ? input
          : await this.RawImage.fromBlob(new Blob([new Uint8Array(input)]));
      const out = await ex(img, { pooling: 'mean', normalize: true });
      return Array.from(out.data as Float32Array);
    } catch (e: any) {
      this.log.warn(`embedImage failed: ${e?.message}`);
      return [];
    }
  }

  // zero-shot moderation (same CLIP weights, text+image towers): label → score.
  private zeroShot: any = null;
  private zsLoading: Promise<any> | null = null;
  private async loadZeroShot() {
    if (this.zeroShot) return this.zeroShot;
    if (this.zsLoading) return this.zsLoading;
    this.zsLoading = (async () => {
      const { pipeline, env } = await import('@xenova/transformers');
      (env as any).cacheDir = process.env.CLIP_CACHE || './.models-cache';
      this.zeroShot = await pipeline('zero-shot-image-classification', this.model);
      this.log.log('CLIP zero-shot ready');
      return this.zeroShot;
    })();
    return this.zsLoading;
  }

  /** Photo moderation: what IS this picture? Scores sum to ~1 across labels.
   *  Used to keep NSFW out entirely and faces/documents off the catalog cards. */
  async moderatePhoto(input: Buffer): Promise<{ food: number; person: number; nsfw: number; other: number } | null> {
    try {
      const zs = await this.loadZeroShot();
      const img = await this.RawImage.fromBlob(new Blob([new Uint8Array(input)]));
      const LABELS = [
        'a photo of food or a drink', // food
        'a photo of a person or a selfie', // person
        'explicit adult content', // nsfw
        'a screenshot, document or diagram', // other
      ];
      const out = await zs(img, LABELS);
      const score = (label: string) => out.find((o: any) => o.label === label)?.score ?? 0;
      return {
        food: score(LABELS[0]),
        person: score(LABELS[1]),
        nsfw: score(LABELS[2]),
        other: score(LABELS[3]),
      };
    } catch (e: any) {
      this.log.warn(`moderatePhoto failed: ${e?.message}`);
      return null; // moderation unavailable → don't block users
    }
  }
}
