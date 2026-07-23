import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { ClipService } from '../vision/clip.service';
import { VectorSearchService } from '../vision/vector-search.service';

const CLIENT_LOG = process.env.CLIENT_LOG_PATH || '.client-error.log';
const BEHAVIOR_LOG = process.env.BEHAVIOR_LOG_PATH || '.behavior.log';

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

  // Railway's healthcheck gates the deploy on this. It MUST be a liveness probe
  // (is the process up?), NOT a readiness probe (is the DB reachable?). It used to
  // `await SELECT 1`, so whenever the private-network DB lagged the container by a
  // second, health returned 500, the healthcheck failed, and the whole deploy was
  // marked FAILED. DB status is now reported as a field without ever failing the
  // check — the app is alive and will serve as soon as the DB connects.
  @Get()
  async check() {
    // The DB probe must never block the response: while Prisma is still
    // reconnecting, `$queryRaw` can HANG (queued) rather than reject, which would
    // stall the healthcheck just as badly as throwing. Race it against a short
    // timeout so health always answers within ~1s.
    let db = 'up';
    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error('db-timeout')), 1000)),
      ]);
    } catch {
      db = 'connecting';
    }
    return { status: 'ok', db, time: new Date().toISOString() };
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

  // ── behavior analytics: the app posts a session summary on exit (screens
  //    visited, time on each, scroll depth, where it ended). Stored to a log we
  //    then analyse for UX improvement suggestions.
  @Post('behavior')
  behavior(@Body() body: any) {
    try {
      fs.appendFileSync(BEHAVIOR_LOG, `${new Date().toISOString()} :: ${JSON.stringify(body).slice(0, 1500)}\n`);
    } catch { /* ignore */ }
    return { ok: true };
  }

  /** AI-style UX insights from behavior data: session length, where people drop
   *  off / get stuck, and concrete improvement suggestions. Read by the cabinet. */
  @Get('ux-insights')
  uxInsights() {
    let all: any[] = [];
    try {
      const text = fs.existsSync(BEHAVIOR_LOG) ? fs.readFileSync(BEHAVIOR_LOG, 'utf8') : '';
      all = text.trim().split(/\r?\n/).filter(Boolean).slice(-8000).map((l) => {
        try { return JSON.parse(l.split(' :: ')[1]); } catch { return null; }
      }).filter(Boolean);
    } catch { /* none */ }
    const rows = all.filter((r) => r.kind === 'session' || r.totalMs != null);
    // aggregate EVERY tap → what people actually press most
    const tapCount = new Map<string, number>();
    let totalTaps = 0;
    for (const r of all.filter((r) => r.kind === 'taps')) {
      for (const t of r.taps ?? []) { tapCount.set(t.el, (tapCount.get(t.el) ?? 0) + 1); totalTaps += 1; }
    }
    const topTaps = [...tapCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([el, n]) => ({ el, n }));
    if (!rows.length && !totalTaps) return { sessions: 0, insights: [], screens: [], topTaps: [], totalTaps: 0 };

    const durs = rows.map((r) => Number(r.totalMs) || 0).filter((d) => d > 0);
    const avgSec = Math.round(durs.reduce((a, b) => a + b, 0) / Math.max(1, durs.length) / 1000);
    // per-screen: total time, visits, avg scroll depth, how often the session ENDED here
    const perScreen = new Map<string, { ms: number; visits: number; scroll: number; scrollN: number; exits: number }>();
    const g = (k: string) => perScreen.get(k) ?? perScreen.set(k, { ms: 0, visits: 0, scroll: 0, scrollN: 0, exits: 0 }).get(k)!;
    for (const r of rows) {
      for (const s of r.screens ?? []) {
        const e = g(s.name || '?');
        e.ms += Number(s.ms) || 0; e.visits += 1;
        if (s.maxScroll != null) { e.scroll += Number(s.maxScroll); e.scrollN += 1; }
      }
      if (r.lastScreen) g(r.lastScreen).exits += 1;
    }
    const screens = [...perScreen.entries()].map(([name, v]) => ({
      name,
      visits: v.visits,
      avgSec: Math.round(v.ms / Math.max(1, v.visits) / 1000),
      avgScroll: v.scrollN ? Math.round((v.scroll / v.scrollN) * 100) : null,
      exitRate: Math.round((v.exits / rows.length) * 100),
    })).sort((a, b) => b.visits - a.visits);

    // heuristic AI-style suggestions
    const insights: string[] = [];
    if (avgSec < 20) insights.push(`⏱ Средняя сессия всего ${avgSec}с — пользователи уходят быстро. Усильте первый экран: сразу показывать «Что пробуем?» и одну оценку в один тап.`);
    const topExit = screens.slice().sort((a, b) => b.exitRate - a.exitRate)[0];
    if (topExit && topExit.exitRate >= 30) insights.push(`🚪 Чаще всего выходят с экрана «${topExit.name}» (${topExit.exitRate}%). Проверьте, не тупик ли это — добавьте следующий шаг/CTA.`);
    const stuck = screens.find((s) => s.avgSec >= 25 && (s.avgScroll ?? 100) < 25);
    if (stuck) insights.push(`🧭 На «${stuck.name}» проводят ${stuck.avgSec}с, но почти не скроллят (${stuck.avgScroll}%) — вероятно, застревают/ищут. Упростите экран или подскажите действие.`);
    const shallow = screens.find((s) => s.visits >= 5 && (s.avgScroll ?? 0) < 15 && s.avgSec < 8);
    if (shallow) insights.push(`👀 «${shallow.name}» пролистывают за ${shallow.avgSec}с без прокрутки — контент не цепляет. Пересмотрите порядок карточек/заголовок.`);
    if (!insights.length) insights.push('✅ Явных проблем в поведении не видно. Копите больше сессий для точных выводов.');

    return { sessions: rows.length, avgSec, screens, insights, topTaps, totalTaps };
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
