import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface Entry {
  id: string;
  type: string;
  vec: Float32Array;
  norm: number;
}

// In-memory cosine index over item embeddings — two spaces:
//   • text  (nomic, 768d)  → semantic "similar items"
//   • image (CLIP, 512d)   → photo recognition (image-to-image)
// For ~1k items this is sub-millisecond, beating the 500ms budget without pgvector.
// The API is storage-agnostic: pgvector is a drop-in replacement behind it later.
@Injectable()
export class VectorSearchService implements OnModuleInit {
  private readonly log = new Logger('VectorSearch');
  private textIndex: Entry[] = [];
  private imageIndex: Entry[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.rebuild().catch((e) => this.log.warn(`initial index build failed: ${e?.message}`));
  }

  async rebuild(): Promise<{ text: number; image: number }> {
    const rows = await this.prisma.$queryRaw<
      { id: string; type: string; embedding: number[]; image_embedding: number[] }[]
    >`SELECT id, type::text AS type, embedding, image_embedding FROM listings
        WHERE type::text IN ('DISH','DRINK')`;
    const mk = (arr: number[], id: string, type: string): Entry | null => {
      if (!arr?.length) return null;
      const vec = Float32Array.from(arr);
      let n = 0;
      for (let i = 0; i < vec.length; i++) n += vec[i] * vec[i];
      return { id, type, vec, norm: Math.sqrt(n) || 1 };
    };
    this.textIndex = rows.map((r) => mk(r.embedding, r.id, r.type)).filter(Boolean) as Entry[];
    this.imageIndex = rows.map((r) => mk(r.image_embedding, r.id, r.type)).filter(Boolean) as Entry[];
    this.log.log(`vector index → text: ${this.textIndex.length}, image: ${this.imageIndex.length}`);
    return { text: this.textIndex.length, image: this.imageIndex.length };
  }

  get imageSize() {
    return this.imageIndex.length;
  }

  private knn(index: Entry[], query: number[], opts: { type?: string; limit?: number; excludeId?: string }) {
    if (!query.length || !index.length) return [];
    const q = Float32Array.from(query);
    let qn = 0;
    for (let i = 0; i < q.length; i++) qn += q[i] * q[i];
    qn = Math.sqrt(qn) || 1;
    const out: { id: string; score: number }[] = [];
    for (const e of index) {
      if (opts.type && e.type !== opts.type) continue;
      if (opts.excludeId && e.id === opts.excludeId) continue;
      if (e.vec.length !== q.length) continue;
      let dot = 0;
      for (let i = 0; i < q.length; i++) dot += q[i] * e.vec[i];
      out.push({ id: e.id, score: dot / (qn * e.norm) });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, opts.limit ?? 20);
  }

  /** Photo recognition: nearest items to a query IMAGE embedding (CLIP). */
  searchImage(query: number[], opts: { type?: 'DISH' | 'DRINK'; limit?: number } = {}) {
    return this.knn(this.imageIndex, query, opts);
  }

  /** Semantic text search over item text embeddings (nomic). */
  search(query: number[], opts: { type?: 'DISH' | 'DRINK'; limit?: number; excludeId?: string } = {}) {
    return this.knn(this.textIndex, query, opts);
  }

  /** "🤖 Похожие …" — items visually + semantically closest to a given item. */
  similarTo(id: string, limit = 8) {
    // prefer visual similarity (image space) when available, else semantic
    const img = this.imageIndex.find((x) => x.id === id);
    if (img) return this.knn(this.imageIndex, Array.from(img.vec), { type: img.type, limit: limit + 1, excludeId: id }).slice(0, limit);
    const txt = this.textIndex.find((x) => x.id === id);
    if (txt) return this.knn(this.textIndex, Array.from(txt.vec), { type: txt.type, limit: limit + 1, excludeId: id }).slice(0, limit);
    return [];
  }
}
