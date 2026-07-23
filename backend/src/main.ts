import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import compression from 'compression';
import { AppModule } from './app.module';
import { ListingsService } from './listings/listings.service';
import { RecsysService } from './recsys/recsys.service';
import { PrismaService } from './prisma/prisma.service';

// Prisma stores telegram_id as BigInt; make BigInt JSON-serializable.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  // togomoscow API bootstrap
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(compression({ threshold: 1_024 }));
  app.setGlobalPrefix('api');
  // Dev: allow any origin (Vite dev server / tunnel). Tighten for production.
  app.enableCors({ origin: true });

  const publicDir = join(process.cwd(), 'public');
  const indexFile = join(publicDir, 'index.html');
  if (existsSync(indexFile)) {
    app.useStaticAssets(publicDir, {
      index: false,
      setHeaders(res, filePath) {
        // `filePath` is an OS path (backslashes on Windows, slashes on Linux), so
        // normalise before matching — comparing it against a URL-shaped string made
        // EVERY asset fall through to `no-store`, re-downloading the 640 KB bundle
        // on every single app open. Vite hashes these filenames, so they're immutable.
        const normalised = filePath.replace(/\\/g, '/');
        if (normalised.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store, max-age=0');
        } else if (/\/assets\//.test(normalised) || /-[A-Za-z0-9_-]{8,}\.(js|css|woff2?)$/.test(normalised)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          // other static files (icons, telegram-web-app.js): cacheable but revalidated
          res.setHeader('Cache-Control', 'public, max-age=3600');
        }
      },
    });

    const server = app.getHttpAdapter().getInstance();
    server.get(/^\/tg-boot-(219|221|222|224)([/?#]|$)/, (_req: any, res: any) => {
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.redirect(302, '/tg-boot-225?v=225&from=backend-redirect');
    });
    server.get(/^\/(?!api\/).*/, (_req: any, res: any) => {
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.sendFile(indexFile);
    });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}/api`);

  // Warm the hot caches AFTER the health endpoint is already answering. Deferring
  // to setTimeout guarantees warm-up work can never delay or fail the Railway
  // healthcheck — a rejected warm-up query must never take the whole deploy down.
  setTimeout(() => {
    const warmStarted = Date.now();
    try {
      const prisma = app.get(PrismaService);
      const listings = app.get(ListingsService);
      const recsys = app.get(RecsysService);
      void Promise.allSettled([
        prisma.$queryRaw`SELECT 1`,
        recsys.anonFeed(12),
        listings.firstTasterItems(8),
        listings.list({ type: 'DISH', sort: 'rating', take: 12 }),
        listings.list({ type: 'DRINK', sort: 'rating', take: 12 }),
        listings.topWeekly(),
        listings.geo(),
      ]).then((results) => {
        const failed = results.filter((result) => result.status === 'rejected').length;
        console.log(`Hot response cache warmed in ${Date.now() - warmStarted}ms (${failed} failed)`);
      });
    } catch (err) {
      console.warn('Warm-up skipped:', (err as Error)?.message);
    }
  }, 3000);
}
bootstrap();
