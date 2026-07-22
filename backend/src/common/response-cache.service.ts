import { Injectable } from '@nestjs/common';

type CacheEntry = { value: unknown; expiresAt: number };

@Injectable()
export class ResponseCacheService {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly pending = new Map<string, Promise<unknown>>();

  async getOrSet<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const hit = this.entries.get(key);
    if (hit && hit.expiresAt > now) return this.clone(hit.value as T);
    if (hit) this.entries.delete(key);

    const inFlight = this.pending.get(key) as Promise<T> | undefined;
    if (inFlight) return this.clone(await inFlight);

    const request = load();
    this.pending.set(key, request);
    try {
      const value = await request;
      this.prune();
      this.entries.set(key, { value: this.clone(value), expiresAt: Date.now() + ttlMs });
      return this.clone(value);
    } finally {
      this.pending.delete(key);
    }
  }

  invalidate(prefix?: string) {
    if (!prefix) {
      this.entries.clear();
      return;
    }
    for (const key of this.entries.keys()) if (key.startsWith(prefix)) this.entries.delete(key);
  }

  private clone<T>(value: T): T {
    if (value == null || typeof value !== 'object') return value;
    return structuredClone(value);
  }

  private prune() {
    if (this.entries.size < 500) return;
    const now = Date.now();
    for (const [key, entry] of this.entries) if (entry.expiresAt <= now) this.entries.delete(key);
    while (this.entries.size >= 500) {
      const oldest = this.entries.keys().next().value as string | undefined;
      if (!oldest) break;
      this.entries.delete(oldest);
    }
  }
}
