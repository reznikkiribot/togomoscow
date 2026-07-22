// Resumable batch runner for the prioritized, not-yet-parsed website domains.
// Existing menu-out files are never overwritten (menu-engine default).
// Public PDF links discovered by menu-engine are routed through pdf-menu.mjs.
//
// Usage:
//   node prisma/menu-batch.mjs [--limit 40] [--batch-size 5]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.join(__dirname, '..');
const PRIORITY_FILE = path.join(__dirname, 'menu-priority.json');
const STATE_FILE = path.join(__dirname, 'menu-batch-state.json');
const MENU_OUT = path.join(__dirname, 'menu-out');
const NON_MENU_PDF = /(?:policy|privacy|personal|consent|legal|offer|oferta|terms|agreement|politic|politika|soglash|requisite|реквизит|политик|соглаш|оферт)/i;

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? Number(process.argv[index + 1]) : fallback;
}

function safeFile(domain) {
  return path.join(MENU_OUT, `${domain.replace(/[^\w.-]/g, '_')}.json`);
}

function run(args, timeout) {
  const result = spawnSync(process.execPath, args, {
    cwd: BACKEND,
    stdio: 'inherit',
    timeout,
    windowsHide: true,
  });
  return result.status === 0;
}

if (!fs.existsSync(PRIORITY_FILE)) throw new Error('Run node prisma/coverage-gaps.mjs first');
const priority = JSON.parse(fs.readFileSync(PRIORITY_FILE, 'utf8'));
const limit = Math.max(1, option('--limit', 40));
const batchSize = Math.max(1, option('--batch-size', 5));
const queue = priority.unparsed
  .filter((row) => row.action === 'automatic' && !fs.existsSync(safeFile(row.domain)))
  .slice(0, limit);
const state = {
  startedAt: new Date().toISOString(),
  requested: queue.length,
  batchSize,
  completed: [],
  failedBatches: [],
  pdfRuns: [],
};
fs.writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
console.log(`Queued ${queue.length} domains in batches of ${batchSize}.`);

for (let index = 0; index < queue.length; index += batchSize) {
  const batch = queue.slice(index, index + batchSize);
  console.log(`\n== Batch ${Math.floor(index / batchSize) + 1}: ${batch.map((row) => row.domain).join(', ')}`);
  const ok = run(['prisma/menu-engine.mjs', ...batch.map((row) => row.domain)], 45 * 60_000);
  if (!ok) state.failedBatches.push(batch.map((row) => row.domain));

  for (const row of batch) {
    const file = safeFile(row.domain);
    if (!fs.existsSync(file)) continue;
    try {
      let result = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (result.method === 'pdf-link' && /^https?:\/\//.test(result.source ?? '') && !NON_MENU_PDF.test(result.source)) {
        console.log(`${row.domain}: routing public PDF through pdf-menu.mjs`);
        const pdfOk = run(['prisma/pdf-menu.mjs', row.domain, result.source], 10 * 60_000);
        state.pdfRuns.push({ domain: row.domain, source: result.source, ok: pdfOk });
        result = JSON.parse(fs.readFileSync(file, 'utf8'));
      }
      state.completed.push({
        domain: row.domain,
        status: result.status,
        method: result.method,
        count: Number(result.count ?? result.items?.length ?? 0),
      });
    } catch (error) {
      state.completed.push({ domain: row.domain, status: `invalid result: ${error.message}`, count: 0 });
    }
  }
  state.updatedAt = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

state.finishedAt = new Date().toISOString();
fs.writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
const successful = state.completed.filter((row) => row.count >= 5).length;
console.log(`\nDone: ${successful}/${state.completed.length} domains extracted. State: prisma/menu-batch-state.json`);
