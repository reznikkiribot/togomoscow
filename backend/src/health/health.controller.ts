import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { ClipService } from '../vision/clip.service';
import { VectorSearchService } from '../vision/vector-search.service';

const CLIENT_LOG = process.env.CLIENT_LOG_PATH || '.client-error.log';

// Unauthenticated health checks and early client diagnostics. The client
// endpoints intentionally do not require Telegram initData: they must work
// before the app has booted far enough to authenticate.
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clip: ClipService,
    private readonly vectors: VectorSearchService,
  ) {}

  @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', db: 'up', time: new Date().toISOString() };
  }

  // Current frontend bundle name — the client compares it with its own script
  // src and reloads itself when the server has a newer build. This kills the
  // "eternally stale Telegram session" problem for good.
  private bundleCache: { at: number; js: string } | null = null;
  @Get('bundle')
  bundle() {
    if (this.bundleCache && Date.now() - this.bundleCache.at < 60_000) return { js: this.bundleCache.js };
    try {
      const html = fs.readFileSync(`${process.cwd()}/public/index.html`, 'utf8');
      const js = html.match(/\/assets\/(index-[\w-]+\.js)/)?.[1] ?? '';
      this.bundleCache = { at: Date.now(), js };
      return { js };
    } catch {
      return { js: '' };
    }
  }

  // Public community counters — social proof for CTA blocks ("уже N оценок в
  // клубе"). Cached in-memory for 5 min: it's shown on every home open.
  private statsCache: { at: number; data: { reviews: number; tasters: number } } | null = null;
  @Get('community')
  async community() {
    if (this.statsCache && Date.now() - this.statsCache.at < 300_000) return this.statsCache.data;
    const [reviews, tasters] = await Promise.all([
      this.prisma.review.count(),
      this.prisma.user.count({ where: { reviews: { some: {} } } }),
    ]);
    const data = { reviews, tasters };
    this.statsCache = { at: Date.now(), data };
    return data;
  }

  @Get('vision')
  async vision() {
    try {
      const counts = await this.vectors.rebuild();
      return {
        status: counts.image > 0 ? 'ok' : 'degraded',
        clipReady: this.clip.ready,
        textIndex: counts.text,
        imageIndex: counts.image,
        time: new Date().toISOString(),
      };
    } catch (e) {
      return {
        status: 'error',
        clipReady: this.clip.ready,
        textIndex: 0,
        imageIndex: 0,
        error: String((e as Error).message || e).slice(0, 300),
        time: new Date().toISOString(),
      };
    }
  }

  @Get('ping')
  ping(@Req() req: any) {
    this.appendClientEvent(req, { kind: 'ping', query: req.query });
    return { pong: true, time: new Date().toISOString() };
  }

  @Post('client-error')
  clientError(@Req() req: any, @Body() body: any) {
    this.appendClientEvent(req, body);
    return { ok: true };
  }

  @Get('client-events')
  clientEvents() {
    try {
      const text = fs.existsSync(CLIENT_LOG) ? fs.readFileSync(CLIENT_LOG, 'utf8') : '';
      return {
        ok: true,
        lines: text
          .trim()
          .split(/\r?\n/)
          .filter(Boolean)
          .slice(-120),
      };
    } catch (e) {
      return { ok: false, lines: [], error: String((e as Error).message || e) };
    }
  }

  private appendClientEvent(req: any, body: any) {
    try {
      const ua = (req.headers['user-agent'] || '').slice(0, 160);
      const ip = (req.headers['cf-connecting-ip'] || req.ip || '').toString().slice(0, 80);
      const line = `${new Date().toISOString()} :: ${JSON.stringify(body).slice(0, 900)} :: IP=${ip} :: UA=${ua}\n`;
      fs.appendFileSync(CLIENT_LOG, line);
    } catch {
      /* ignore */
    }
  }
}
