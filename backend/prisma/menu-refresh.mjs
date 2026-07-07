// Scheduled menu refresh: crawl the top-N chain sites with the cascade engine,
// then import everything that extracted. Run weekly by the supervisor.
//   node prisma/menu-refresh.mjs [N=40]
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const node = process.execPath;
const N = String(Number(process.argv[2]) || 40);

console.log(`[menu-refresh] ${new Date().toISOString()} — crawling top ${N} chains…`);
spawnSync(node, [path.join(__dirname, 'menu-engine.mjs'), '--from-db', N], { stdio: 'inherit' });
console.log('[menu-refresh] importing all extracted menus…');
spawnSync(node, [path.join(__dirname, 'menu-import.mjs'), '--all'], { stdio: 'inherit' });
console.log('[menu-refresh] deduping items (reordered/size-variant names)…');
spawnSync(node, [path.join(__dirname, 'dedup-items.mjs')], { stdio: 'inherit' });
console.log('[menu-refresh] done.');
