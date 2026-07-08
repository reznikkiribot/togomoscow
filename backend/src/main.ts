import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';

// Prisma stores telegram_id as BigInt; make BigInt JSON-serializable.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  // togomoscow API bootstrap
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  // Dev: allow any origin (Vite dev server / tunnel). Tighten for production.
  app.enableCors({ origin: true });

  const publicDir = join(process.cwd(), 'public');
  const indexFile = join(publicDir, 'index.html');
  if (existsSync(indexFile)) {
    app.useStaticAssets(publicDir, {
      index: false,
      setHeaders(res, path) {
        if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-store, max-age=0');
        else if (path.includes(`${join(publicDir, 'assets')}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'no-store, max-age=0');
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
}
bootstrap();
