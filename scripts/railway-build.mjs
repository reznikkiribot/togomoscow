import { spawnSync } from 'node:child_process';

const isFrontend =
  !!process.env.API_PROXY_TARGET ||
  /front|web|mini/i.test(process.env.RAILWAY_SERVICE_NAME || '');

const target = isFrontend ? 'frontend' : 'backend';
const script = isFrontend ? 'build' : 'railway:build';

console.log(`[railway] building ${target}`);

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

for (const args of [
  ['--prefix', target, 'ci'],
  ['--prefix', target, 'run', script],
]) {
  const result = spawnSync(npm, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
