// Builds an AI taste profile per user with the local LLM (Ollama). Analyses the
// user's behaviour — ratings, taste choices, likes on reviews, saves, views,
// swipes (dislikes) — and stores a structured profile in user.preferences.aiTaste.
// The recommendation feed then ranks items against this profile (cheap, instant).
// Incremental: only (re)builds for users whose signals changed since last build.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
for (const line of envText.split(/\r?\n/)) {
  if (!line || line.startsWith('#') || !line.includes('=')) continue;
  const i = line.indexOf('=');
  const k = line.slice(0, i).trim();
  if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const OLLAMA = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

async function ollamaUp() {
  try {
    const r = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return false;
    const d = await r.json();
    return (d.models ?? []).some((m) => m.name.startsWith(MODEL.split(':')[0]));
  } catch {
    return false;
  }
}

const PROMPT = (signals) =>
  `Ты аналитик вкусов в приложении-дегустаторе. По сигналам пользователя опиши его вкус.
Верни СТРОГО JSON:
{"cuisines": ["кухни/категории, которые нравятся, нижним регистром: кофе, итальянская, бургеры..."],
 "loves": ["конкретные блюда/напитки, которые нравятся"],
 "dislikes": ["что не нравится"],
 "price": "low|mid|premium|any",
 "summary": "1 короткое предложение про вкус пользователя на русском"}

Сигналы:
${signals}`;

async function ai(signals) {
  try {
    const r = await fetch(`${OLLAMA}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt: PROMPT(signals), stream: false, format: 'json', options: { temperature: 0.2 } }),
      signal: AbortSignal.timeout(90000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return JSON.parse(d.response);
  } catch {
    return null;
  }
}

function fmtItems(rows, label) {
  if (!rows.length) return '';
  return `${label}: ${rows.map((r) => r.txt).filter(Boolean).slice(0, 25).join('; ')}\n`;
}

async function buildSignals(prisma, userId) {
  const reviews = await prisma.review.findMany({
    where: { userId },
    include: { listing: { select: { name: true, category: true, type: true } } },
    orderBy: { createdAt: 'desc' },
    take: 60,
  });
  const liked = []; // rating >= 4
  const disliked = []; // rating <= 2
  const tasteWords = new Set();
  for (const r of reviews) {
    const nm = `${r.listing?.name ?? ''} (${r.listing?.category ?? ''}) ${r.rating}/5`;
    (r.rating >= 4 ? liked : r.rating <= 2 ? disliked : []).push({ txt: nm });
    const ch = (r.attributes?.choices ?? {});
    for (const arr of Object.values(ch)) for (const v of arr ?? []) if (v && v !== 'Не знаю') tasteWords.add(v);
  }
  const swipes = await prisma.dislike.findMany({ where: { userId }, select: { category: true }, take: 40 });
  const favs = await prisma.favorite.findMany({ where: { userId }, include: { listing: { select: { name: true, category: true } } }, take: 30 });
  const views = await prisma.interaction.findMany({
    where: { userId, type: { in: ['VIEW', 'OPEN'] } },
    include: { listing: { select: { name: true, category: true } } },
    orderBy: { createdAt: 'desc' },
    take: 40,
  });
  // likes the user gave to OTHER people's reviews → topics they engage with
  const myVotes = await prisma.reviewVote.findMany({ where: { userId }, take: 40, select: { reviewId: true } });
  let likedTopics = [];
  if (myVotes.length) {
    const revs = await prisma.review.findMany({
      where: { id: { in: myVotes.map((v) => v.reviewId) } },
      include: { listing: { select: { name: true, category: true } } },
    });
    likedTopics = revs.map((r) => ({ txt: `${r.listing?.name ?? ''} (${r.listing?.category ?? ''})` }));
  }

  let s = '';
  s += fmtItems(liked, 'Высоко оценил');
  s += fmtItems(disliked, 'Низко оценил');
  s += tasteWords.size ? `Любимые вкусовые ноты: ${[...tasteWords].slice(0, 20).join(', ')}\n` : '';
  s += swipes.length ? `Свайпнул мимо (не интересно), категории: ${[...new Set(swipes.map((x) => x.category).filter(Boolean))].slice(0, 12).join(', ')}\n` : '';
  s += fmtItems(favs.map((f) => ({ txt: `${f.listing?.name ?? ''} (${f.listing?.category ?? ''})` })), 'Сохранил в избранное');
  s += fmtItems(views.map((v) => ({ txt: `${v.listing?.name ?? ''}` })), 'Просматривал');
  s += fmtItems(likedTopics, 'Лайкнул отзывы про');
  return { text: s.trim(), signalCount: reviews.length + swipes.length + favs.length + views.length + myVotes.length };
}

async function main() {
  if (!(await ollamaUp())) {
    console.log(`Ollama/модель ${MODEL} недоступны — пропускаю.`);
    return;
  }
  const limit = Number(process.argv[2] ?? 50);
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  // users with at least a few signals, ordered by recent activity
  const users = await prisma.user.findMany({
    where: { reviews: { some: {} } },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: { id: true, preferences: true },
  });
  let built = 0;
  for (const u of users) {
    const { text, signalCount } = await buildSignals(prisma, u.id);
    if (signalCount < 2) continue;
    const prefs = u.preferences ?? {};
    if (prefs.aiTaste && prefs.aiTaste.signalCount === signalCount) continue; // unchanged
    const profile = await ai(text);
    if (!profile) continue;
    await prisma.user.update({
      where: { id: u.id },
      data: { preferences: { ...prefs, aiTaste: { ...profile, signalCount, builtAt: new Date().toISOString() } } },
    });
    built++;
    console.log(`✓ ${u.id.slice(0, 8)} — ${profile.summary ?? ''}`);
  }
  console.log(`DONE. профилей построено/обновлено: ${built}/${users.length}`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
