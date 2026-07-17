// FULL menu pipeline orchestrator (owner 18.07 wish: «меню само загружается»):
//   1) import every OK menu-out file into the prod catalog (idempotent upserts)
//   2) per-venue photo pipeline: dl refs → img2img @0.2 → CLIP check → upload
// Run manually or from the weekly scheduled task. Each stage is a separate
// process (onnx+spawn segfault lesson) and survives transient proxy drops.
//   node prisma/menu-pipeline.mjs [--no-photos]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.join(__dirname, '..');
const dbUrl = fs.readFileSync(path.join(BACKEND, '.railway-db-url'), 'utf8').trim();
const env = { ...process.env, DATABASE_URL: `${dbUrl}?connect_timeout=30&connection_limit=1` };
const node = process.execPath;

const run = (args, tries = 3) => {
  for (let a = 1; a <= tries; a++) {
    try {
      execFileSync(node, args, { cwd: BACKEND, env, stdio: 'inherit', timeout: 6 * 3600_000 });
      return true;
    } catch {
      console.log(`  attempt ${a}/${tries} failed: node ${args.join(' ')}`);
    }
  }
  return false;
};

// 1) all parseable menus → catalog (only files with real items)
const domains = fs.readdirSync(path.join(__dirname, 'menu-out'))
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .filter((f) => {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'menu-out', f), 'utf8'));
      return j.status === 'ok' && (j.items?.length ?? 0) >= 5;
    } catch { return false; }
  })
  .map((f) => f.replace('.json', ''));
console.log(`== ИМПОРТ: ${domains.length} доменов`);
for (let i = 0; i < domains.length; i += 8) run(['prisma/menu-import.mjs', ...domains.slice(i, i + 8)]);

// 2) photos for everything new
if (!process.argv.includes('--no-photos')) {
  console.log('== ФОТО: dl → gen(0.2) → check');
  run(['prisma/regen-per-venue.mjs', '--stage-dl']);
  run(['prisma/regen-per-venue.mjs', '--stage-gen']);
  run(['prisma/regen-per-venue.mjs', '--stage-check']);
}
console.log('== PIPELINE DONE');
