// Weekly nudge via the bot: "as the week wrapped up — rate what you tried".
// Personalized with the user's 7-day count + streak. Sends to everyone who has a
// telegramId; users who never started the bot just fail silently (ignored).
// Run weekly by a Windows Scheduled Task (see scripts/install-weekly-push.ps1).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);
process.env.DATABASE_URL = process.env.DATABASE_URL || env.DATABASE_URL;
const token = env.TELEGRAM_BOT_TOKEN;

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

async function main() {
  // Notifications are DISABLED per product decision — no weekly push at all.
  // (Scheduled task is also disabled; this guard is belt-and-suspenders.)
  console.log('Уведомления отключены — еженедельный пуш не отправляется.');
  return;
  // eslint-disable-next-line no-unreachable
  if (!token) {
    console.log('Нет TELEGRAM_BOT_TOKEN');
    return;
  }
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const users = await prisma.user.findMany();
  let sent = 0;
  let failed = 0;
  for (const u of users) {
    const reviews = await prisma.review.findMany({
      where: { userId: u.id },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    const weekCount = reviews.filter((r) => r.createdAt >= weekAgo).length;
    const days = new Set(reviews.map((r) => dayKey(r.createdAt)));
    let streak = 0;
    const cur = new Date();
    if (!days.has(dayKey(cur))) cur.setUTCDate(cur.getUTCDate() - 1);
    while (days.has(dayKey(cur))) {
      streak++;
      cur.setUTCDate(cur.getUTCDate() - 1);
    }
    const text =
      weekCount > 0
        ? `🍽 За неделю ты оценил(а) ${weekCount}! Серия — ${streak} 🔥\nЗагляни и оцени что-то новое.`
        : `🍽 Давно не виделись! Оцени блюдо или напиток на этой неделе и собери серию 🔥`;
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: String(u.telegramId), text }),
      });
      if (res.ok) sent++;
      else failed++;
    } catch {
      failed++;
    }
  }
  console.log(`Еженедельный пуш: отправлено ${sent}, не доставлено ${failed} (из ${users.length}).`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
