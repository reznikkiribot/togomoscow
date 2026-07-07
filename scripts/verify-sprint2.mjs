// Exercises the authenticated Sprint 2 endpoints with a signed initData.
import crypto from 'crypto';
import fs from 'fs';

const env = fs.readFileSync('D:/Приложения/Yelp/backend/.env', 'utf8');
const token = env.match(/TELEGRAM_BOT_TOKEN="?([^"\r\n]+)"?/)[1];

const user = { id: 999000111, first_name: 'Тест', username: 'testuser' };
const fields = {
  auth_date: String(Math.floor(Date.now() / 1000)),
  user: JSON.stringify(user),
};
const dcs = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join('\n');
const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
const hash = crypto.createHmac('sha256', secret).update(dcs).digest('hex');
const initData = new URLSearchParams({ ...fields, hash }).toString();
const auth = { Authorization: `tma ${initData}`, 'Content-Type': 'application/json' };
const base = 'http://localhost:3000/api';

const j = async (label, p, opts = {}) => {
  const r = await fetch(base + p, opts);
  const body = await r.text();
  console.log(`${label}: ${r.status} ${body.slice(0, 160)}`);
  return body;
};

// pick a restaurant to review
const listings = JSON.parse(await (await fetch(`${base}/listings?type=RESTAURANT&take=1`)).text());
const target = listings[0];
console.log('Target listing:', target.name, target.id);

await j('profile (before)', '/me/profile', { headers: auth });
await j('create review', `/listings/${target.id}/reviews`, {
  method: 'POST', headers: auth,
  body: JSON.stringify({ rating: 5, text: 'Отлично!', attributes: { visitDate: '2026-06-19' } }),
});
await j('add favorite', `/me/favorites/${target.id}`, { method: 'POST', headers: auth });
await j('my reviews', '/me/reviews', { headers: auth });
await j('my favorites', '/me/favorites', { headers: auth });
await j('profile (after)', '/me/profile', { headers: auth });
