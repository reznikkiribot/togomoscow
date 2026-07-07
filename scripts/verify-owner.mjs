// Verifies the Sprint 3 owner loop: claim -> admin approve -> edit -> reply.
// Test user 999000111 is configured as ADMIN in .env.
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

const listing = (await J('/listings?type=RESTAURANT&take=1'))[0];
console.log('listing:', listing.name);

console.log('claim:', JSON.stringify(await J(`/owner/claims/${listing.id}`, { method: 'POST', headers: auth, body: '{}' })));
const pending = await J('/admin/claims', { headers: auth });
console.log('admin pending claims:', pending.length);
const claim = pending.find((c) => c.listingId === listing.id);
console.log('approve:', JSON.stringify(await J(`/admin/claims/${claim.id}/approve`, { method: 'POST', headers: auth })).slice(0, 80));
const venues = await J('/owner/venues', { headers: auth });
console.log('owner venues:', venues.map((v) => v.name).join(', '));
const edited = await J(`/owner/venues/${listing.id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ description: 'Обновлено владельцем' }) });
console.log('edited description:', edited.description);

// create a review then reply to it
const review = await J(`/listings/${listing.id}/reviews`, { method: 'POST', headers: auth, body: JSON.stringify({ rating: 5, text: 'Отлично' }) });
const replied = await J(`/owner/reviews/${review.id}/reply`, { method: 'POST', headers: auth, body: JSON.stringify({ text: 'Спасибо за отзыв!' }) });
console.log('owner reply:', replied.ownerReply);
