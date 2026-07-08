import { createServer } from 'http';
import { createReadStream, existsSync } from 'fs';
import { stat } from 'fs/promises';
import { extname, join, normalize } from 'path';
import { fileURLToPath } from 'url';

const root = fileURLToPath(new URL('./dist/', import.meta.url));
const port = Number(process.env.PORT || 3000);
const apiTarget = (process.env.API_PROXY_TARGET || 'https://togomoscow-production.up.railway.app').replace(/\/$/, '');

const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  return join(root, normalized === '/' ? 'index.html' : normalized);
}

async function serveFile(req, res) {
  let path = safePath(req.url || '/');
  if (!existsSync(path) || (await stat(path).catch(() => null))?.isDirectory()) {
    path = join(root, 'index.html');
  }

  const type = mime[extname(path).toLowerCase()] || 'application/octet-stream';
  const cache = path.includes(`${join(root, 'assets')}`) ? 'public, max-age=31536000, immutable' : 'no-store, max-age=0';
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': cache });
  createReadStream(path).pipe(res);
}

async function proxyApi(req, res) {
  const target = new URL(req.url || '/', apiTarget);
  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: req.headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req,
      duplex: 'half',
    });
    const headers = Object.fromEntries(upstream.headers.entries());
    res.writeHead(upstream.status, headers);
    if (upstream.body) {
      for await (const chunk of upstream.body) res.write(chunk);
    }
    res.end();
  } catch (error) {
    send(res, 502, JSON.stringify({ error: 'API proxy failed', message: error.message }), {
      'Content-Type': 'application/json; charset=utf-8',
    });
  }
}

createServer((req, res) => {
  if (/^\/tg-boot-(219|221|222|224)([/?#]|$)/.test(req.url || '')) {
    const target = new URL('/tg-boot-225', `http://${req.headers.host || 'localhost'}`);
    target.searchParams.set('v', '225');
    target.searchParams.set('from', 'redirect');
    res.writeHead(302, {
      Location: target.pathname + target.search,
      'Cache-Control': 'no-store, max-age=0',
    });
    res.end();
    return;
  }
  if (req.url?.startsWith('/api/')) {
    void proxyApi(req, res);
    return;
  }
  void serveFile(req, res).catch((error) => {
    send(res, 500, error.message || 'Internal Server Error');
  });
}).listen(port, '0.0.0.0', () => {
  console.log(`Frontend listening on :${port}`);
  console.log(`Proxying /api to ${apiTarget}`);
});
