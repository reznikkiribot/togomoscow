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
    await this.$connect();
  }
}
