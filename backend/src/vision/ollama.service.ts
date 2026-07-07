import { Injectable, Logger } from '@nestjs/common';

// Thin client for the LOCAL Ollama runtime (open-source models, no cloud APIs).
// Vision (moondream) + text (qwen2.5) + embeddings (nomic-embed-text) all run on
// the user's machine. This is the ONLY place that talks to the model runtime, so
// the model backend can be swapped (Ollama → CLIP/SigLIP server) without touching
// the rest of the vision pipeline.
@Injectable()
export class OllamaService {
  private readonly log = new Logger('Ollama');
  private readonly base = process.env.OLLAMA_URL || 'http://localhost:11434';
  readonly visionModel = process.env.OLLAMA_VISION_MODEL || 'moondream';
  readonly textModel = process.env.OLLAMA_TEXT_MODEL || 'qwen2.5:3b';
  readonly embedModel = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';

  private available: boolean | null = null;

  /** Is the local model runtime reachable? Cached; the pipeline degrades gracefully if not. */
  async isUp(): Promise<boolean> {
    if (this.available !== null) return this.available;
    try {
      const r = await fetch(`${this.base}/api/tags`, { signal: AbortSignal.timeout(1500) });
      this.available = r.ok;
    } catch {
      this.available = false;
    }
    return this.available;
  }

  /** Text/vision generation. Pass base64 images for the vision model. */
  async generate(model: string, prompt: string, images?: string[], timeoutMs = 30000): Promise<string> {
    try {
      const r = await fetch(`${this.base}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, images, stream: false, options: { temperature: 0.1 } }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!r.ok) return '';
      const j: any = await r.json();
      return (j.response ?? '').trim();
    } catch (e: any) {
      this.log.warn(`generate(${model}) failed: ${e?.message}`);
      return '';
    }
  }

  /** 768-dim embedding of a text (nomic-embed-text). Returns [] on failure. */
  async embed(text: string, timeoutMs = 15000): Promise<number[]> {
    try {
      const r = await fetch(`${this.base}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.embedModel, prompt: text }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!r.ok) return [];
      const j: any = await r.json();
      return Array.isArray(j.embedding) ? j.embedding : [];
    } catch (e: any) {
      this.log.warn(`embed failed: ${e?.message}`);
      return [];
    }
  }
}
