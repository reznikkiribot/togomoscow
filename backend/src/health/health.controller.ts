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

  @Get('vision')
  async vision() {
    const counts = await this.vectors.rebuild();
    return {
      status: counts.image > 0 ? 'ok' : 'degraded',
      clipReady: this.clip.ready,
      textIndex: counts.text,
      imageIndex: counts.image,
      time: new Date().toISOString(),
    };
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
