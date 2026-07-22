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

  // the label sets the scanner uses on every recognition — warmed at startup so
  // the FIRST scan isn't a 7s "load the text model" spike
  static readonly BOTTLE_LABELS = [
    'a photo of a wine bottle, beer bottle or can with a label',
    'a photo of food or a dish on a plate',
    'a photo of a drink in a cup or glass',
    'a photo of an unrelated object or scene',
  ];

  async onModuleInit() {
    // Give the first page/API request priority over ONNX model initialization.
    // The model still warms in the background before a typical scan interaction.
    setTimeout(() => this.load()
      .then(() => {
        // precompute + cache the bottle/moderation label vectors while idle
        this.classifyVec(new Array(512).fill(0), ClipService.BOTTLE_LABELS).catch(() => {});
        this.loadLabelVecs().catch(() => {});
      })
      .catch((e) => this.log.warn(`CLIP preload failed: ${e?.message}`)), 5_000);
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

  // Moderation label embeddings via the CLIP TEXT tower only (~60MB quantized).
  // The old zero-shot pipeline loaded a SECOND full copy of the vision tower and
  // OOM-killed the whole container on Railway the moment someone saved a review
  // with a photo. Now: image side reuses the warm extractor above; text side is
  // 4 label vectors computed once and cached.
  private labelVecs: number[][] | null = null;
  private labelsLoading: Promise<number[][]> | null = null;
  private static readonly MOD_LABELS = [
    'a photo of food or a drink', // food
    'a photo of a person or a selfie', // person
    'explicit adult content', // nsfw
    'a screenshot, document or diagram', // other
  ];

  private async loadLabelVecs(): Promise<number[][]> {
    if (this.labelVecs) return this.labelVecs;
    if (this.labelsLoading) return this.labelsLoading;
    this.labelsLoading = (async () => {
      const t0 = Date.now();
      const { AutoTokenizer, CLIPTextModelWithProjection, env } = await import('@xenova/transformers');
      (env as any).cacheDir = process.env.CLIP_CACHE || './.models-cache';
      const tokenizer = await AutoTokenizer.from_pretrained(this.model);
      const textModel = await CLIPTextModelWithProjection.from_pretrained(this.model);
      const inputs = tokenizer(ClipService.MOD_LABELS, { padding: true, truncation: true });
      const { text_embeds } = await textModel(inputs);
      const [n, dim] = text_embeds.dims;
      const vecs: number[][] = [];
      for (let i = 0; i < n; i++) {
        const v = Array.from(text_embeds.data.slice(i * dim, (i + 1) * dim) as Float32Array);
        const norm = Math.hypot(...v) || 1;
        vecs.push(v.map((x) => x / norm));
      }
      // free the text tower — the 4 vectors are all we ever need from it
      await (textModel as any).dispose?.().catch?.(() => {});
      this.labelVecs = vecs;
      this.log.log(`CLIP moderation labels ready in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
      return vecs;
    })();
    return this.labelsLoading;
  }

  // generic zero-shot over arbitrary label sets (text vectors cached per set) —
  // same memory-safe text-tower approach as moderation
  private classCache = new Map<string, number[][]>();
  async classify(input: Buffer, labels: string[]): Promise<number[] | null> {
    try {
      const key = labels.join('|');
      let vecs = this.classCache.get(key);
      if (!vecs) {
        const { AutoTokenizer, CLIPTextModelWithProjection, env } = await import('@xenova/transformers');
        (env as any).cacheDir = process.env.CLIP_CACHE || './.models-cache';
        const tokenizer = await AutoTokenizer.from_pretrained(this.model);
        const textModel = await CLIPTextModelWithProjection.from_pretrained(this.model);
        const inputs = tokenizer(labels, { padding: true, truncation: true });
        const { text_embeds } = await textModel(inputs);
        const [n, dim] = text_embeds.dims;
        vecs = [];
        for (let i = 0; i < n; i++) {
          const v = Array.from(text_embeds.data.slice(i * dim, (i + 1) * dim) as Float32Array);
          const norm = Math.hypot(...v) || 1;
          vecs.push(v.map((x) => x / norm));
        }
        await (textModel as any).dispose?.().catch?.(() => {});
        this.classCache.set(key, vecs);
      }
      const imgVec = await this.embedImage(input);
      return this.softmaxOver(vecs, imgVec);
    } catch (e: any) {
      this.log.warn(`classify failed: ${e?.message}`);
      return null;
    }
  }

  /** Classify a PRE-COMPUTED image embedding against cached labels — no second
   *  image embed (the recognizer already embedded the photo once for search). */
  async classifyVec(imgVec: number[], labels: string[]): Promise<number[] | null> {
    if (!imgVec?.length) return null;
    try {
      const key = labels.join('|');
      let vecs = this.classCache.get(key);
      if (!vecs) {
        const { AutoTokenizer, CLIPTextModelWithProjection, env } = await import('@xenova/transformers');
        (env as any).cacheDir = process.env.CLIP_CACHE || './.models-cache';
        const tokenizer = await AutoTokenizer.from_pretrained(this.model);
        const textModel = await CLIPTextModelWithProjection.from_pretrained(this.model);
        const inputs = tokenizer(labels, { padding: true, truncation: true });
        const { text_embeds } = await textModel(inputs);
        const [n, dim] = text_embeds.dims;
        vecs = [];
        for (let i = 0; i < n; i++) {
          const v = Array.from(text_embeds.data.slice(i * dim, (i + 1) * dim) as Float32Array);
          const norm = Math.hypot(...v) || 1;
          vecs.push(v.map((x) => x / norm));
        }
        await (textModel as any).dispose?.().catch?.(() => {});
        this.classCache.set(key, vecs);
      }
      return this.softmaxOver(vecs, imgVec);
    } catch {
      return null;
    }
  }

  private softmaxOver(vecs: number[][], imgVec: number[]): number[] | null {
    if (!imgVec.length) return null;
    const logits = vecs.map((lv) => 100 * lv.reduce((s, x, i) => s + x * imgVec[i], 0));
    const max = Math.max(...logits);
    const exps = logits.map((l) => Math.exp(l - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => e / sum);
  }

  /** Photo moderation: what IS this picture? Scores sum to ~1 across labels
   *  (softmax over CLIP similarities — same math the zero-shot pipeline does).
   *  Used to keep NSFW out entirely and faces/documents off the catalog cards. */
  async moderatePhoto(input: Buffer): Promise<{ food: number; person: number; nsfw: number; other: number } | null> {
    try {
      const [labels, imgVec] = await Promise.all([this.loadLabelVecs(), this.embedImage(input)]);
      if (!imgVec.length) return null;
      // CLIP logit scale ≈ 100 for the ViT-B/32 checkpoint
      const logits = labels.map((lv) => 100 * lv.reduce((s, x, i) => s + x * imgVec[i], 0));
      const max = Math.max(...logits);
      const exps = logits.map((l) => Math.exp(l - max));
      const sum = exps.reduce((a, b) => a + b, 0);
      const p = exps.map((e) => e / sum);
      return { food: p[0], person: p[1], nsfw: p[2], other: p[3] };
    } catch (e: any) {
      this.log.warn(`moderatePhoto failed: ${e?.message}`);
      return null; // moderation unavailable → don't block users
    }
  }
}
