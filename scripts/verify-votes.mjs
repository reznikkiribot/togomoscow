// Verifies review vote toggle + counts with a signed initData.
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
const auth = { Authorization: `tma ${initData}`, 'Content-Type': 'application/json' };
const base = 'http://localhost:3000/api';

const listing = (await (await fetch(`${base}/listings?type=RESTAURANT&take=1`)).json())[0];
console.log('listing:', listing.name);
const review = await (await fetch(`${base}/listings/${listing.id}/reviews`, {
  method: 'POST', headers: auth, body: JSON.stringify({ rating: 5, text: 'Тест голосов' }),
})).json();
console.log('review id:', review.id);
const v1 = await (await fetch(`${base}/reviews/${review.id}/vote`, {
  method: 'POST', headers: auth, body: JSON.stringify({ type: 'USEFUL' }),
})).json();
console.log('after vote USEFUL:', JSON.stringify(v1));
const v2 = await (await fetch(`${base}/reviews/${review.id}/vote`, {
  method: 'POST', headers: auth, body: JSON.stringify({ type: 'USEFUL' }),
})).json();
console.log('after toggle off:', JSON.stringify(v2));
