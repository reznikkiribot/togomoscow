// Verifies: user adds a dish (PENDING) -> reviews it immediately ->
// owner sees it pending -> owner approves -> it appears in the venue's menu.
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
const J = async (p, o) => (await fetch(base + p, o)).json();

// test user owns a venue from the earlier owner test
const venues = await J('/owner/venues', { headers: auth });
const venue = venues[0];
console.log('venue (owned):', venue?.name);

const item = await J(`/listings/${venue.id}/items`, {
  method: 'POST', headers: auth, body: JSON.stringify({ type: 'DISH', name: 'Тест-блюдо ' + Date.now() % 10000 }),
});
console.log('added item:', item.name, item.id);

const review = await J(`/listings/${item.id}/reviews`, {
  method: 'POST', headers: auth, body: JSON.stringify({ rating: 5, text: 'Сразу оценил' }),
});
console.log('review created on new item:', review.rating, 'stars');

const pending = await J(`/owner/venues/${venue.id}/pending-items`, { headers: auth });
console.log('pending items for owner:', pending.map((p) => p.item.name).join(', '));

await J(`/owner/venues/${venue.id}/items/${item.id}`, {
  method: 'POST', headers: auth, body: JSON.stringify({ status: 'APPROVED', price: 350 }),
});
const detail = await J(`/listings/${venue.id}`);
const inMenu = detail.topDishes.some((d) => d.id === item.id);
console.log('after approve, item in venue topDishes:', inMenu);
