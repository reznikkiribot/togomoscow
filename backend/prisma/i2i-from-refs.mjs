// Generates card photos FROM the parsed menu reference (image-to-image).
//
// Why this beats both alternatives for these items: their names («Леденец Сердце»,
// «Джокер дв. начинка») carry no food word, so a keyword search cannot find them
// and a text-only prompt cannot draw them. The parsed reference came off the
// dish's own menu card, so it matches the name by construction — img2img keeps
// its composition while producing a NEW image, so we never publish someone
// else's photograph.
//
// Two stages for the same reason as generate-missing-photos.mjs: onnxruntime
// (CLIP) and child-process spawning in one Node process segfault on Windows.
//   --stage-gen    sd-cli only  → tools/sd/out/i2i-<id>-<n>.png
//   --stage-check  CLIP + S3 upload of whatever passed
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';

const STAGE = process.argv.includes('--stage-fetch') ? 'fetch'
  : process.argv.includes('--stage-gen') ? 'gen'
  : process.argv.includes('--stage-crop') ? 'crop'
  : process.argv.includes('--stage-check') ? 'check' : 'both';
const LIMIT = Number(process.env.LIMIT ?? 500);
const DRY = process.argv.includes('--dry');

const HERE = new URL('.', import.meta.url);
const SD = path.join(process.cwd(), '..', 'tools', 'sd');
const OUT = path.join(SD, 'out');
const REFS = path.join(SD, 'refs');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(REFS, { recursive: true });

const queue = JSON.parse(fs.readFileSync(new URL('./i2i-queue.json', HERE), 'utf8'));
const readJson = (f, fallback) => { try { return JSON.parse(fs.readFileSync(new URL(f, HERE), 'utf8')); } catch { return fallback; } };
const tries = readJson('./i2i-ref-tries.json', {});
const done = new Set(readJson('./i2i-ref-done.json', []));

// 512², not 768²: the VAE compute buffer will not fit at 768 on this GPU and the
// whole generation fails. Delivery resizes anyway.
const SIZE = 512;
const seedOf = (id, n, retry) =>
  Number(BigInt('0x' + createHash('sha1').update(`${id}:${n}:${retry}`).digest('hex').slice(0, 12)) % 2147483647n);

// Lower strength keeps more of the reference (safer match); higher strength moves
// further from it (more original). Retries walk AWAY from the reference, because
// a failed check usually means the render came out muddy, not off-topic.
const STRENGTH = [0.45, 0.55, 0.62];

// sd-cli reads JPEG/PNG but NOT WebP, and several menu CDNs serve WebP — those
// downloads look fine on disk and then fail at load time. Convert on the way in.
const isJpegOrPng = (b) =>
  (b[0] === 0xff && b[1] === 0xd8) || (b[0] === 0x89 && b[1] === 0x50);

async function fetchRef(item, sharp) {
  const file = path.join(REFS, `${item.id}.jpg`);
  if (fs.existsSync(file) && fs.statSync(file).size > 2048) return file;
  try {
    // Without a timeout one unresponsive CDN stalls the whole queue indefinitely.
    const r = await fetch(item.ref, {
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: new URL(item.ref).origin },
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) return null;
    let buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 2048) return null; // placeholder/1px stub
    if (!isJpegOrPng(buf)) buf = await sharp(buf).jpeg({ quality: 92 }).toBuffer();
    fs.writeFileSync(file, buf);
    return file;
  } catch { return null; }
}

// Downloading is its own stage: sharp (WebP→JPEG) must not share a process with
// the sd-cli spawning loop — the same native-library clash that forced gen/check
// apart. Run --stage-fetch first, then --stage-gen reads refs straight off disk.
if (STAGE === 'fetch') {
  const sharp = (await import('sharp')).default;
  const pending = queue.filter((item) => !done.has(item.id));
  let got = 0, miss = 0, seen = 0;
  // 8 at a time: these are ~20 different CDNs, so the load stays polite per host
  // while one slow server no longer holds up everything behind it.
  const workers = Array.from({ length: 8 }, async () => {
    for (;;) {
      const item = pending[seen++];
      if (!item) return;
      if (await fetchRef(item, sharp)) got++; else miss++;
      if ((got + miss) % 50 === 0) console.log(`  скачано ${got}, недоступно ${miss}…`);
    }
  });
  await Promise.all(workers);
  console.log(`референсов скачано: ${got}, недоступно: ${miss}`);
}

if (STAGE === 'gen' || STAGE === 'both') {
  let n = 0, made = 0, noRef = 0;
  for (const item of queue) {
    if (n >= LIMIT) break;
    if (done.has(item.id)) continue;
    n++;
    const ref = path.join(REFS, `${item.id}.jpg`);
    if (!fs.existsSync(ref)) { noRef++; continue; }
    const retry = tries[item.id] ?? 0;
    for (let a = 0; a < 2; a++) {
      const rel = `out/i2i-${item.id}-${a}.png`;
      if (fs.existsSync(path.join(SD, rel))) continue; // resumable
      try {
        execFileSync('./sd-cli.exe', [
          '-m', 'sd_turbo.safetensors',
          '-i', path.relative(SD, ref).replace(/\\/g, '/'),
          '--strength', String(STRENGTH[Math.min(retry, STRENGTH.length - 1)]),
          '--steps', String(8 + Math.min(retry, 3) * 2),
          '--cfg-scale', '1.0', '-W', String(SIZE), '-H', String(SIZE),
          '-s', String(seedOf(item.id, a, retry)), '-o', rel,
          '-p', `professional food photography of ${item.name}, restaurant plating, appetizing, high detail, sharp focus, no text, no watermark`,
        ], { stdio: 'pipe', timeout: 300000, cwd: SD });
        made++;
      } catch (e) {
        console.log(`gen FAIL ${item.name.slice(0, 30)} #${a}: ${String(e.message || '').slice(0, 80)}`);
      }
    }
    if (made % 20 === 0 && made) console.log(`  сгенерировано ${made}…`);
  }
  console.log(`\nстадия генерации: обработано ${n}, кадров ${made}, без референса ${noRef}`);
}

// Cropping is its own stage for the same native-library reason as the others:
// sharp must not share a process with either sd-cli spawning or onnxruntime.
//
// The renders come out square with a flat border around the plate, and a photo
// with margins is not allowed on a card. This trims the uniform edge and then
// centre-crops to 4:3, the ratio the cards display at.
if (STAGE === 'crop') {
  const sharp = (await import('sharp')).default;
  let done = 0, skipped = 0;
  for (const f of fs.readdirSync(OUT).filter((x) => x.startsWith('i2i-') && x.endsWith('.png'))) {
    const file = path.join(OUT, f);
    try {
      // A centre crop to 4:3 is enough on its own — it cuts the flat top and
      // bottom bands where the margins live and leaves the plate filling the
      // frame. (sharp's trim() does nothing here: the render's background is
      // subtly graded, not a flat colour.)
      const meta = await sharp(file).metadata();
      const w = Math.min(meta.width, Math.round(meta.height * (4 / 3)));
      const h = Math.round(w * (3 / 4));
      const out = await sharp(file)
        .extract({
          left: Math.round((meta.width - w) / 2),
          top: Math.round((meta.height - h) / 2),
          width: w, height: h,
        })
        .resize(1024, 768, { fit: 'cover' }) // ≥720p, owner rule
        .png()
        .toBuffer();
      fs.writeFileSync(file, out);
      done++;
    } catch { skipped++; }
  }
  console.log(`кадрировано: ${done}, пропущено: ${skipped}`);
}

if (STAGE === 'check' || STAGE === 'both') {
  const { PrismaClient } = await import('@prisma/client');
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { pipeline, env } = await import('@xenova/transformers');
  env.allowRemoteModels = true;

  const url = `${fs.readFileSync(new URL('../.railway-db-url', HERE), 'utf8').trim()}?connect_timeout=30&connection_limit=1`;
  const p = new PrismaClient({ datasources: { db: { url } } });
  const { execSync } = await import('node:child_process');
  const creds = JSON.parse(
    execSync('railway bucket credentials --bucket uploads --json', { cwd: path.join(process.cwd(), '..'), encoding: 'utf8' }),
  );
  const s3 = new S3Client({
    endpoint: creds.endpoint, region: creds.region,
    credentials: { accessKeyId: creds.accessKeyId, secretAccessKey: creds.secretAccessKey },
    forcePathStyle: creds.urlStyle !== 'virtual-host',
  });

  // Scoring the render against the ITEM NAME is impossible here, and measuring it
  // proved why: the same picture scores 0.026 against «Огненный фурай» and 0.84
  // against an English description of what it shows. CLIP does not read Cyrillic,
  // so a Russian label is noise and «a different dish» always wins — nothing can
  // ever clear 92%, no matter how many times it is regenerated. These 423 items
  // are also exactly the ones with no RU→EN dictionary entry (that is why they
  // landed in this queue), so there is no English label to score against either.
  //
  // What CAN be verified is the thing that actually guarantees the match: the
  // render must still depict its reference, which came off the dish's own menu
  // card. Image-to-image similarity is measured in one language-free embedding
  // space, so it is a real check rather than a rubber stamp.
  const embed = await pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch32');
  // WARNING — this score is NOT a correctness check, and photos passing it must
  // not be put on display without a human looking at them first.
  //
  // Checked against 289 published renders: reference similarity is reliable on
  // simple single-subject shots («Зелёный микс» 0.970 correct, «Леденец Сердце»
  // 0.935 correct) but blind on busy compositions, where a render copies the
  // crockery and background of its reference while getting the dish wrong
  // («Шиповник» 0.877 — a teapot with a yellow slab; «Свиные рёбрышки» 0.820 —
  // no ribs). Correct renders also sit at the bottom («Сало соленое» 0.821), so
  // no threshold separates the two. CLIP with English scene labels does not
  // separate them either: 0.93 for both a correct and a broken render.
  //
  // The bar is kept only to drop the obviously-unrelated; the real gate is
  // human review.
  const ACCEPT = 0.82;
  let ok = 0, failed = 0, noRef = 0;
  const okIds = [];

  // normalize:true is not honoured by this pipeline (the vectors come back with a
  // norm well above 1), so L2-normalise here — otherwise "similarity" is tens,
  // not a 0..1 fraction, and comparing it to a 0.92 threshold is meaningless.
  const vec = async (file) => {
    const out = await embed(file, { pooling: 'mean' });
    const raw = out.data ?? out[0]?.data ?? out;
    let norm = 0;
    for (let i = 0; i < raw.length; i++) norm += raw[i] * raw[i];
    norm = Math.sqrt(norm) || 1;
    const unit = new Float32Array(raw.length);
    for (let i = 0; i < raw.length; i++) unit[i] = raw[i] / norm;
    return unit;
  };
  const cosine = (a, b) => {
    let dot = 0;
    for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
    return dot;
  };

  for (const item of queue) {
    if (done.has(item.id)) continue;
    const refFile = path.join(REFS, `${item.id}.jpg`);
    if (!fs.existsSync(refFile)) { noRef++; continue; }
    let refVec;
    try { refVec = await vec(refFile); } catch { noRef++; continue; }

    let best = { score: 0, file: null };
    for (let a = 0; a < 2; a++) {
      const file = path.join(OUT, `i2i-${item.id}-${a}.png`);
      if (!fs.existsSync(file)) continue;
      try {
        const score = cosine(await vec(file), refVec);
        if (score > best.score) best = { score, file };
      } catch { /* unreadable render */ }
    }
    if (!best.file) continue;
    if (best.score >= ACCEPT) {
      const key = `dishgen-${randomUUID()}`;
      if (!DRY) {
        await s3.send(new PutObjectCommand({
          Bucket: creds.bucketName, Key: key,
          Body: fs.readFileSync(best.file), ContentType: 'image/png',
        }));
        for (let i = 0; i < 6; i++) {
          try {
            // photoVerifiedAt stays NULL on purpose: the score above cannot tell
            // a correct render from a broken one, so the photo is stored and
            // stays hidden until a human approves it.
            await p.listing.update({
              where: { id: item.id },
              data: { photoUrl: `/api/files/${key}`, photoScore: best.score },
            });
            break;
          } catch { await new Promise((r) => setTimeout(r, 3000)); }
        }
      }
      okIds.push(item.id);
      ok++;
    } else {
      // A failed check earns another attempt further from the reference.
      tries[item.id] = (tries[item.id] ?? 0) + 1;
      for (let a = 0; a < 2; a++) {
        const f = path.join(OUT, `i2i-${item.id}-${a}.png`);
        if (fs.existsSync(f)) fs.unlinkSync(f); // let the retry re-render
      }
      failed++;
    }
  }
  fs.writeFileSync(new URL('./i2i-ref-tries.json', HERE), JSON.stringify(tries, null, 1));
  fs.writeFileSync(new URL('./i2i-ref-done.json', HERE), JSON.stringify([...done, ...okIds], null, 1));
  console.log(`\nстадия проверки: прошло ${ok}, не прошло ${failed} (перегенерятся), без референса ${noRef}`);
  await p.$disconnect();
}
