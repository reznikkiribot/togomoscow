// Isolated sharp worker for retro-collage-purge.mjs. Sharp and ONNX are kept in
// separate processes because their native runtimes conflict on this Windows host.
import fs from 'node:fs';
import sharp from 'sharp';

const manifestPath = process.argv[2];
if (!manifestPath) throw new Error('manifest path is required');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

async function fetchBuffer(photoUrl) {
  const url = photoUrl.startsWith('http') ? photoUrl : `${manifest.base}${photoUrl}`;
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer.length) throw new Error('empty response');
      return buffer;
    } catch (error) {
      lastError = error;
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
  throw new Error(`download failed after 4 attempts: ${String(lastError?.message ?? lastError)}`);
}

async function detectCollage(input) {
  const { data, info } = await sharp(input)
    .resize(256, 256, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  function strongest(vertical) {
    const lineCount = vertical ? width : height;
    const span = vertical ? height : width;
    let best = { mean: 0, persistent: 0, at: 0 };
    for (let line = Math.floor(lineCount * 0.12); line < Math.ceil(lineCount * 0.88); line++) {
      let total = 0;
      let persistent = 0;
      for (let pos = 0; pos < span; pos++) {
        const a = vertical ? data[pos * width + line - 1] : data[(line - 1) * width + pos];
        const b = vertical ? data[pos * width + line] : data[line * width + pos];
        const delta = Math.abs(a - b);
        total += delta;
        if (delta >= 38) persistent++;
      }
      const candidate = { mean: total / span, persistent: persistent / span, at: line };
      if (candidate.mean * candidate.persistent > best.mean * best.persistent) best = candidate;
    }
    return best;
  }
  const vertical = strongest(true);
  const horizontal = strongest(false);
  const strong = [vertical, horizontal].some((signal) => signal.mean >= 32 && signal.persistent >= 0.68);
  const crossing = [vertical, horizontal].every((signal) => signal.mean >= 23 && signal.persistent >= 0.48);
  return { collage: strong || crossing, vertical, horizontal };
}

const results = new Array(manifest.urls.length);
let cursor = 0;
let completed = 0;
async function consume() {
  while (cursor < manifest.urls.length) {
    const index = cursor++;
    const photoUrl = manifest.urls[index];
    const file = `${manifest.cacheDir}/${index}.img`;
    try {
      const buffer = await fetchBuffer(photoUrl);
      fs.writeFileSync(file, buffer);
      results[index] = { photoUrl, file, structure: await detectCollage(buffer) };
    } catch (error) {
      results[index] = { photoUrl, file, error: String(error?.message ?? error) };
    }
    completed++;
    if (completed % 50 === 0) console.log(`  …скачано/структурно проверено ${completed}/${manifest.urls.length}`);
  }
}
await Promise.all(Array.from({ length: Math.min(6, manifest.urls.length) }, () => consume()));
fs.writeFileSync(manifest.resultPath, JSON.stringify(results));
