// Programmatically points the bot's Menu Button at a web_app URL via the
// Telegram Bot API — no BotFather clicking needed.
//
// Usage: node scripts/set-menu-button.mjs <https-url>
// If no url is passed, tries to read it from .cloudflared.log in the repo root.
import fs from 'fs';

const ROOT = 'D:/Приложения/Yelp';

const env = fs.readFileSync(`${ROOT}/backend/.env`, 'utf8');
const token = env.match(/TELEGRAM_BOT_TOKEN="?([^"\r\n]+)"?/)[1];

let url = process.argv[2];
if (!url) {
  try {
    const log = fs.readFileSync(`${ROOT}/.cloudflared.log`, 'utf8');
    url = log.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)?.[0];
  } catch {
    /* ignore */
  }
}
if (!url) {
  console.error('No URL given and none found in .cloudflared.log');
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    menu_button: {
      type: 'web_app',
      text: 'Открыть',
      web_app: { url },
    },
  }),
});

const body = await res.json();
console.log('Menu button ->', url);
console.log('Telegram:', JSON.stringify(body));
if (!body.ok) process.exit(1);
