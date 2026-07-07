import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Prisma stores telegram_id as BigInt; make BigInt JSON-serializable.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  // togomoscow API bootstrap
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // Dev: allow any origin (Vite dev server / tunnel). Tighten for production.
  app.enableCors({ origin: true });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}/api`);
}
bootstrap();
