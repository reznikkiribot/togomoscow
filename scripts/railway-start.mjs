import { spawnSync } from 'node:child_process';

const isFrontend =
  !!process.env.API_PROXY_TARGET ||
  /front|web|mini/i.test(process.env.RAILWAY_SERVICE_NAME || '');

const target = isFrontend ? 'frontend' : 'backend';
const script = isFrontend ? 'start' : 'railway:start';

console.log(`[railway] starting ${target}`);

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const result = spawnSync(npm, ['--prefix', target, 'run', script], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
