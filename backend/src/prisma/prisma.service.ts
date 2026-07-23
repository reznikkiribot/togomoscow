import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const raw = process.env.DATABASE_URL;
    let url = raw;
    if (raw) {
      try {
        const parsed = new URL(raw);
        parsed.searchParams.set('connection_limit', process.env.PRISMA_CONNECTION_LIMIT ?? '5');
        if (!parsed.searchParams.has('pool_timeout')) parsed.searchParams.set('pool_timeout', '10');
        url = parsed.toString();
      } catch {
        // Prisma will report a malformed DATABASE_URL with its normal diagnostics.
      }
    }
    super(url ? { datasources: { db: { url } } } : undefined);
  }

  async onModuleInit() {
    // Do NOT let a cold database kill the boot. On Railway the app resolves the
    // DB over the private network (postgres-*.railway.internal), which can lag a
    // few seconds behind the container start; a bare `await $connect()` then
    // threw P1001 in onModuleInit, Nest aborted init, the process crashed before
    // it ever answered /api/health, and Railway marked EVERY deploy FAILED.
    // Retry with backoff; if it still fails, start anyway — queries reconnect
    // lazily and the health endpoint comes up so the deploy goes live.
    const attempts = 6;
    for (let i = 1; i <= attempts; i += 1) {
      try {
        await this.$connect();
        if (i > 1) console.log(`Prisma connected on attempt ${i}`);
        return;
      } catch (err) {
        const message = (err as Error)?.message?.split('\n')[0] ?? String(err);
        console.warn(`Prisma connect attempt ${i}/${attempts} failed: ${message}`);
        if (i === attempts) {
          console.warn('Prisma not connected at boot — continuing; queries will reconnect lazily.');
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * i, 4000)));
      }
    }
  }
}
