// Verifies the photo upload round-trip: POST /api/uploads -> MinIO -> GET /api/files/:key
import crypto from 'crypto';
import fs from 'fs';

const env = fs.readFileSync('D:/Приложения/Yelp/backend/.env', 'utf8');
const token = env.match(/TELEGRAM_BOT_TOKEN="?([^"\r\n]+)"?/)[1];
const user = { id: 999000111, first_name: 'Тест' };
const fields = { auth_date: String(Math.floor(Date.now() / 1000)), user: JSON.stringify(user) };
const dcs = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join('\n');
const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
const hash = crypto.createHmac('sha256', secret).update(dcs).digest('hex');
const initData = new URLSearchParams({ ...fields, hash }).toString();
const base = 'http://localhost:3000/api';

// 1x1 PNG
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const fd = new FormData();
fd.append('file', new Blob([png], { type: 'image/png' }), 'test.png');

const up = await fetch(`${base}/uploads`, {
  method: 'POST',
  headers: { Authorization: `tma ${initData}` },
  body: fd,
});
const upBody = await up.json();
console.log('upload:', up.status, JSON.stringify(upBody));

const fileRes = await fetch(`http://localhost:3000${upBody.url}`);
const buf = Buffer.from(await fileRes.arrayBuffer());
console.log('file fetch:', fileRes.status, 'content-type:', fileRes.headers.get('content-type'), 'bytes:', buf.length, 'matches:', buf.equals(png));
