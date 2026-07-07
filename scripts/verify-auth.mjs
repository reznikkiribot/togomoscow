// Local verification: builds a valid Telegram initData signed with the real
// bot token (read from backend/.env), then calls /api/me to prove the full
// auth chain works end-to-end. Throwaway dev helper.
import crypto from 'crypto';
import fs from 'fs';

const env = fs.readFileSync('D:/Приложения/Yelp/backend/.env', 'utf8');
const token = env.match(/TELEGRAM_BOT_TOKEN="?([^"\r\n]+)"?/)[1];

const user = { id: 999000111, first_name: 'Тест', username: 'testuser' };
const fields = {
  auth_date: String(Math.floor(Date.now() / 1000)),
  user: JSON.stringify(user),
};

const dataCheckString = Object.keys(fields)
  .sort()
  .map((k) => `${k}=${fields[k]}`)
  .join('\n');

const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
const hash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
const initData = new URLSearchParams({ ...fields, hash }).toString();

const res = await fetch('http://localhost:3000/api/me', {
  headers: { Authorization: `tma ${initData}` },
});
console.log('Status:', res.status);
console.log('Body:', await res.text());
