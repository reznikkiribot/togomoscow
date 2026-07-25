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

// Owner rule (25.07.2026): a card photo must be at least 720p. We ship 768².
// Upscaling a small crop to 768 only smears it, so when the trimmed subject is
// too small we clear the photo instead and let the pipeline regenerate it at 768.
const MIN_SIDE = 768;
const MIN_SOURCE = 560;

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

let fixed = 0, skip = 0, lowres = 0, n = 0;
const lowresIds = [];
for (const it of targets) {
  if (n >= LIMIT) break;
  n++;
  try {
    const key = it.photoUrl.replace('/api/files/', '');
    const buf = Buffer.from(await fetch(`${PHOTO_BASE}${it.photoUrl}`).then((x) => x.arrayBuffer()));
    // trim near-uniform border (the plain background), keep a small even margin,
    // then re-square to 512 so the card gets a full-bleed, centered subject.
    const trimmed = await sharp(buf)
      .trim({ threshold: 20 }) // remove the flat background border
      .toBuffer();
    const meta = await sharp(trimmed).metadata();
    const src = await sharp(buf).metadata();
    const w = meta.width ?? 0, h = meta.height ?? 0;
    const padded = w < (src.width ?? 0) * 0.92 || h < (src.height ?? 0) * 0.92;
    // already full-bleed AND already ≥720p → nothing to do
    if (!padded && Math.min(src.width ?? 0, src.height ?? 0) >= 720) { skip++; continue; }
    // Too little real content to reach 720p without smearing → queue it for
    // regeneration but KEEP the current photo until a better one exists.
    // (Clearing photoUrl here once wiped every card at once — a card with a 512px
    // photo is still far better than a card with none.)
    if (Math.min(w, h) < MIN_SOURCE) {
      lowresIds.push(it.id);
      lowres++;
      continue;
    }
    // resize the trimmed subject to fill a 512² square with fit:cover — this crops
    // to the dish edge-to-edge, NO padding added (the earlier version pasted the
    // trimmed image onto a bigger canvas, which put the border straight back).
    const out = await sharp(trimmed)
      .resize(MIN_SIDE, MIN_SIDE, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 88 })
      .toBuffer();
    await s3.send(new aws.PutObjectCommand({ Bucket: creds.bucketName, Key: key, Body: out, ContentType: 'image/jpeg' }));
    // INVALIDATE the resize-proxy thumbnails (`<key>-w200/400/600/900`) — the
    // frontend loads `?w=600`, which is cached separately in the bucket and would
    // otherwise keep serving the OLD padded thumbnail after we crop the original.
    for (const w of [200, 400, 600, 900]) {
      await s3.send(new aws.DeleteObjectCommand({ Bucket: creds.bucketName, Key: `${key}-w${w}` })).catch(() => {});
    }
    fixed++;
    if (fixed % 20 === 0) console.log(`  обрезано ${fixed}…`);
  } catch (e) {
    console.log(`  err ${it.name}: ${String(e.message || '').slice(0, 50)}`);
  }
}
fs.writeFileSync(path.join(__dirname, 'regen-720-todo.json'), JSON.stringify(lowresIds));
console.log(`\nОбрезано: ${fixed}, уже норм: ${skip}, в очередь на 720p (фото ОСТАВЛЕНЫ): ${lowres}, всего: ${n}`);
await p.$disconnect();
