// Auto-crop the plain background margin from aigen-* photos so the dish fills the
// card (no «поля» under object-fit:cover). Uses sharp ONLY (no onnx in this
// process → no segfault). Reads the padded list from audit-photos-report.json, or
// scans all aigen photos with --all. Re-uploads the cropped image to the SAME key.
//
//   node prisma/crop-photo-padding.mjs [--all] [--limit N]
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
process.env.DATABASE_URL = fs.readFileSync(path.join(__dirname, '..', '.railway-db-url'), 'utf8').trim();
const PHOTO_BASE = 'https://togomoscow-production.up.railway.app';
const ALL = process.argv.includes('--all');
const limArg = process.argv.indexOf('--limit');
const LIMIT = limArg > -1 ? Number(process.argv[limArg + 1]) : Infinity;

const sharp = (await import('sharp')).default;
const { PrismaClient } = await import('@prisma/client');
const aws = await import('@aws-sdk/client-s3');
const p = new PrismaClient();
const creds = JSON.parse(execSync('railway bucket credentials --bucket uploads --json', { cwd: path.join(__dirname, '..', '..'), encoding: 'utf8' }));
const s3 = new aws.S3Client({
  endpoint: creds.endpoint, region: creds.region,
  credentials: { accessKeyId: creds.accessKeyId, secretAccessKey: creds.secretAccessKey },
  forcePathStyle: creds.urlStyle !== 'virtual-host',
});

// which items to fix
let targets;
if (ALL) {
  targets = await p.listing.findMany({
    where: { type: { in: ['DISH', 'DRINK'] }, photoUrl: { startsWith: '/api/files/aigen' } },
    select: { id: true, name: true, photoUrl: true },
  });
} else {
  const rep = JSON.parse(fs.readFileSync(path.join(__dirname, 'audit-photos-report.json'), 'utf8'));
  const padIds = new Set(rep.bad.filter((b) => b.reason === 'padded').map((b) => b.id));
  targets = await p.listing.findMany({ where: { id: { in: [...padIds] } }, select: { id: true, name: true, photoUrl: true } });
}
console.log(`к обрезке: ${targets.length}`);

let fixed = 0, skip = 0, n = 0;
for (const it of targets) {
  if (n >= LIMIT) break;
  n++;
  try {
    const key = it.photoUrl.replace('/api/files/', '');
    const buf = Buffer.from(await fetch(`${PHOTO_BASE}${it.photoUrl}`).then((x) => x.arrayBuffer()));
    // trim near-uniform border (the plain background), keep a small even margin,
    // then re-square to 512 so the card gets a full-bleed, centered subject.
    const trimmed = await sharp(buf)
      .trim({ threshold: 20 }) // remove flat background border
      .toBuffer();
    const meta = await sharp(trimmed).metadata();
    // if trim removed almost nothing, the photo was already fine
    if ((meta.width ?? 512) >= 470 && (meta.height ?? 512) >= 470) { skip++; continue; }
    const side = Math.max(meta.width ?? 1, meta.height ?? 1);
    const out = await sharp({
      create: { width: side, height: side, channels: 3, background: { r: 245, g: 245, b: 245 } },
    })
      .composite([{ input: trimmed, gravity: 'center' }])
      .resize(512, 512, { fit: 'cover' })
      .jpeg({ quality: 88 })
      .toBuffer();
    await s3.send(new aws.PutObjectCommand({ Bucket: creds.bucketName, Key: key, Body: out, ContentType: 'image/jpeg' }));
    fixed++;
    if (fixed % 20 === 0) console.log(`  обрезано ${fixed}…`);
  } catch (e) {
    console.log(`  err ${it.name}: ${String(e.message || '').slice(0, 50)}`);
  }
}
console.log(`\nОбрезано: ${fixed}, уже норм: ${skip}, всего: ${n}`);
await p.$disconnect();
