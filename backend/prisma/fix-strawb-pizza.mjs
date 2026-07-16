// Surgical photo fix (16.07.2026): «Свежая клубника» showed raspberries,
// «Пицца Том ям» showed soup (already retro-moderated away). Uploads the
// hand-verified candidates from tools/sd/out-fix and repoints menu links.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.DATABASE_URL = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim() + '?connect_timeout=30&connection_limit=1';
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();
const aws = await import('@aws-sdk/client-s3');

let creds = null;
for (let att = 1; att <= 5; att++) {
  try {
    creds = JSON.parse(execSync('railway bucket credentials --bucket uploads --json', { cwd: path.join(__dirname, '..', '..'), encoding: 'utf8' }));
    break;
  } catch (e) {
    console.log(`creds attempt ${att}/5 failed`);
    if (att === 5) throw e;
    await new Promise((r) => setTimeout(r, att * 5000));
  }
}
const s3 = new aws.S3Client({
  endpoint: creds.endpoint, region: creds.region,
  credentials: { accessKeyId: creds.accessKeyId, secretAccessKey: creds.secretAccessKey },
  forcePathStyle: creds.urlStyle !== 'virtual-host',
});

async function upload(file) {
  const key = `aigen-${randomUUID()}`;
  await s3.send(new aws.PutObjectCommand({ Bucket: creds.bucketName, Key: key, Body: fs.readFileSync(file), ContentType: 'image/png' }));
  return `/api/files/${key}`;
}

const retry = async (fn) => {
  for (let a = 1; a <= 6; a++) {
    try { return await fn(); } catch (e) { console.log('db retry', a, String(e.message||'').split('\n').filter(Boolean).slice(-1)[0].slice(0,80)); await new Promise((r) => setTimeout(r, a * 4000)); }
  }
  throw new Error('db retries exhausted');
};

const SD = path.join(__dirname, '..', '..', 'tools', 'sd', 'out-fix');
const strawbUrl = await upload(path.join(SD, 'strawb-2.png'));
console.log('клубника залита:', strawbUrl);
const pizzaUrl = await upload(path.join(SD, 'tomyam-pizza-2.png'));
console.log('пицца залита:', pizzaUrl);

// Свежая клубника: repoint every link that still shows the raspberry image
const r1 = await retry(() => p.menuLink.updateMany({
  where: { itemId: 'cf356bea-1f35-473f-8ea7-3e09f654c97e', photoUrl: { startsWith: '/api/files/aigen-f2b00ac1' } },
  data: { photoUrl: strawbUrl },
}));
console.log('клубника: обновлено линков', r1.count);

// Пицца Том ям (Додо): links have no photo — set it everywhere for this item
const r2 = await retry(() => p.menuLink.updateMany({
  where: { itemId: '05bac0fe-d972-49bc-a95c-2cd4cb77af0e' },
  data: { photoUrl: pizzaUrl },
}));
console.log('пицца: обновлено линков', r2.count);

await p.$disconnect();
console.log('DONE');
