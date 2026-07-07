// Backfills user avatars for accounts that have no photoUrl (e.g. their Telegram
// initData didn't include photo_url at sign-up). Uses the Bot API getUserProfilePhotos
// → getFile → downloads the image → stores it in object storage → sets photoUrl.
// Run: node prisma/backfill-avatars.mjs [--all]   (--all re-fetches everyone)
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) { console.error('no TELEGRAM_BOT_TOKEN'); process.exit(1); }

const { PrismaClient } = await import('@prisma/client');
const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
const { randomUUID } = await import('node:crypto');
const p = new PrismaClient();

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  },
  forcePathStyle: true,
});
const bucket = process.env.MINIO_BUCKET ?? 'uploads';

const api = (m, q) => fetch(`https://api.telegram.org/bot${token}/${m}?${new URLSearchParams(q)}`).then((r) => r.json());

const all = process.argv.includes('--all');
const users = await p.user.findMany({
  where: all ? {} : { photoUrl: null },
  select: { id: true, firstName: true, telegramId: true },
});
console.log(`Кандидатов: ${users.length}`);

let ok = 0, none = 0, fail = 0;
for (const u of users) {
  try {
    const photos = await api('getUserProfilePhotos', { user_id: String(u.telegramId), limit: '1' });
    const sizes = photos?.result?.photos?.[0];
    if (!sizes?.length) { none++; continue; } // no avatar / hidden by privacy
    const fileId = sizes[sizes.length - 1].file_id; // largest size
    const f = await api('getFile', { file_id: fileId });
    const fp = f?.result?.file_path;
    if (!fp) { fail++; continue; }
    const buf = Buffer.from(await (await fetch(`https://api.telegram.org/file/bot${token}/${fp}`)).arrayBuffer());
    const key = randomUUID();
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buf, ContentType: 'image/jpeg' }));
    await p.user.update({ where: { id: u.id }, data: { photoUrl: `/api/files/${key}` } });
    ok++;
    console.log(`  ✓ ${u.firstName} → /api/files/${key}`);
  } catch (e) {
    fail++;
    console.log(`  ✗ ${u.firstName}: ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 200)); // gentle on the Bot API
}
console.log(`\nГотово. Загружено: ${ok}, без аватара: ${none}, ошибок: ${fail}`);
await p.$disconnect();
