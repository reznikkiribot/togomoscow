import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const isFrontend =
  !!process.env.API_PROXY_TARGET ||
  /front|web|mini/i.test(process.env.RAILWAY_SERVICE_NAME || '');

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(args) {
  const result = spawnSync(npm, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function buildPackage(target, script) {
  console.log(`[railway] building ${target}`);
  run(['--prefix', target, 'ci']);
  run(['--prefix', target, 'run', script]);
}

if (isFrontend) {
  buildPackage('frontend', 'build');
} else {
  // The backend service also carries the Mini App static bundle. This gives us a
  // single-domain fallback when a separate Railway frontend service serves stale code.
  buildPackage('frontend', 'build');
  const from = join(process.cwd(), 'frontend', 'dist');
  const to = join(process.cwd(), 'backend', 'public');
  if (existsSync(to)) rmSync(to, { recursive: true, force: true });
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  buildPackage('backend', 'railway:build');
}
