// Generates text embeddings (Ollama nomic-embed-text) for every dish/drink and caches
// them on the row. Idempotent: skips items already embedded with the current model
// (never recomputes). Run after new parses. Run: node prisma/backfill-embeddings.mjs [--all]
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const l of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
  if (!l || l.startsWith('#') || !l.includes('=')) continue;
  const i = l.indexOf('='); const k = l.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const OLLAMA = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
const { PrismaClient } = await import('@prisma/client');
const p = new PrismaClient();

const embed = async (text) => {
  const r = await fetch(`${OLLAMA}/api/embeddings`, { method: 'POST', body: JSON.stringify({ model: MODEL, prompt: text }) });
  const j = await r.json();
  return Array.isArray(j.embedding) ? j.embedding : [];
};
const itemText = (l) => [l.name, l.category, l.cuisine].filter(Boolean).join('. ');

const all = process.argv.includes('--all');
const items = await p.listing.findMany({
  where: { type: { in: ['DISH', 'DRINK'] } },
  select: { id: true, name: true, category: true, cuisine: true, embedding: true, embeddingModel: true },
});
console.log(`items: ${items.length}`);
let done = 0, skip = 0, fail = 0;
for (const it of items) {
  if (!all && it.embedding?.length && it.embeddingModel === MODEL) { skip++; continue; }
  try {
    const vec = await embed(itemText(it));
    if (vec.length) {
      await p.listing.update({ where: { id: it.id }, data: { embedding: vec, embeddingModel: MODEL } });
      done++;
      if (done % 100 === 0) console.log(`  embedded ${done}…`);
    } else fail++;
  } catch (e) { fail++; }
}
console.log(`\nembedded: ${done}, skipped(existing): ${skip}, failed: ${fail}`);
await p.$disconnect();
