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
}
