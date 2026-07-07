import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaService } from './ollama.service';

// Produces + persists item embeddings. One embedding per dish/drink, generated from
// its text (name + category + cuisine). Embeddings are cached on the row and only
// (re)computed when missing or the model changed — never recomputed needlessly.
@Injectable()
export class EmbeddingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ollama: OllamaService,
  ) {}

  /** Canonical text we embed for an item — keep this stable so cached vectors stay valid. */
  itemText(l: { name: string; category?: string | null; cuisine?: string | null }): string {
    return [l.name, l.category, l.cuisine].filter(Boolean).join('. ');
  }

  async embedText(text: string): Promise<number[]> {
    return this.ollama.embed(text);
  }

  /** Embed one item and store it (idempotent). Returns the vector (or [] if the model is down). */
  async embedItem(id: string): Promise<number[]> {
    const l = await this.prisma.listing.findUnique({
      where: { id },
      select: { id: true, name: true, category: true, cuisine: true, type: true },
    });
    if (!l || l.type === 'RESTAURANT') return [];
    const vec = await this.ollama.embed(this.itemText(l));
    if (vec.length) {
      await this.prisma.listing
        .update({ where: { id }, data: { embedding: vec, embeddingModel: this.ollama.embedModel } })
        .catch(() => {});
    }
    return vec;
  }

  /** Fire-and-forget embed on item creation — the card gets its vector automatically. */
  embedItemAsync(id: string): void {
    this.embedItem(id).catch(() => {});
  }
}
