// Venue events/new-dish ingestion. Two polite, ban-safe phases:
//   discover  — fetch each venue's OWN website, extract its Telegram/VK links,
//               register VenueSource rows (website itself is also a source).
//   telegram  — read OPEN channels via the public t.me/s/<channel> web preview
//               (plain HTTP GET of a public page — no account, no MTProto, no ban),
//               parse posts, classify (new dish / event / promo), store VenueEvent.
//
// Run (cron-friendly, batched):
//   node prisma/ingest-events.mjs discover 200
//   node prisma/ingest-events.mjs telegram 200
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

const UA = 'togomoscow/1.0 (+https://app.togomoscow.ru; tasting club aggregator)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, timeout = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ru,en' }, signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

const stripTags = (h) =>
  h
    .replace(/<br\s*\/?>(?=)/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

function tgHandleFromUrl(u) {
  const m = u.match(/t\.me\/(?:s\/)?([A-Za-z0-9_]{4,})/);
  if (!m) return null;
  const h = m[1].toLowerCase();
  if (['share', 'joinchat', 'addstickers', 'iv', 'proxy'].includes(h)) return null;
  return h;
}

// We ONLY keep two kinds:
//   'dish'     — a new dish/drink (shown in the feed as a menu-style card)
//   'schedule' — a working-hours change (shown only inside the venue card)
// Everything else (concerts, memes, general posts) is dropped.
const FOOD_RE =
  /бургер|пицц|паст|ролл|сашими|суши|салат|\bсуп\b|\bсет\b|стейк|шаурм|шаверм|хачапур|хинкал|долм|десерт|торт|чизкейк|тирамису|выпечк|завтрак|сэндвич|сендвич|блюд|пельмен|вареник|\bвок\b|боул|поке|рамен|том.?ям|круассан|эклер|пончик|мороже|шашлык|кебаб|плов|лазань|ризотто|гирос|фалафель|хот.?дог|наггетс|картофель фри|кофе|латте|капучин|\bраф\b|\bчай\b|матч|какао|коктейл|лимонад|смузи|\bвино\b|\bпиво\b|сидр|напит|глинтвейн|раф|эспрессо|американо|сангри/i;
// stricter "new menu item" signal: an explicit menu phrase, or "нов* <dish word>"
const DISH_NOUN = '(бургер|пицц|ролл|сашими|суши|сэндвич|сендвич|кофе|латте|капучин|раф|чай|матч|какао|коктейл|десерт|торт|чизкейк|тирамису|эклер|круассан|напит|блюд|\\bсет\\b|паст|\\bсуп\\b|салат|стейк|шаурм|хачапур|хинкал|пиво|сидр|\\bвино\\b|лимонад|смузи|боул|поке|рамен|завтрак|мороже|пельмен|плов|кебаб|шашлык)';
const NEW_RE = new RegExp(
  'в меню|новинк|теперь готов|добавил[аи]?\\s+[\\wё\\s-]{0,16}в меню|обновил[аи]?\\s+меню|представляем\\s+нов|встречайте\\s+нов|' +
    'нов(ый|ое|ая|ые)\\s+[\\wё-]{0,12}\\s*' + DISH_NOUN,
  'i',
);
// hiring / vacancy posts are NOT food events
const JOB_RE =
  /(ищ[еуа][мт]|требу[ею]тся|нужен|нужна|нужны|приглашаем|в команду нужен)\s+[\wё\s-]{0,20}(бармен|бариста|повар|официант|курьер|сотрудник|админ|кух|персонал|стаж[её]р|хостес|менеджер)|ваканси|резюме|подработк|трудоустройств/i;
// schedule change must reference an actual DATE/holiday (so slogans like
// "всегда выходной" are NOT treated as a schedule change)
const SCHED_WORD = /не работа|закрыт|выходн|режим работ|график работ|часы работ|сокращ[её]нн|праздничн.{0,14}график|работаем по/i;
const DATE_TOKEN =
  /\b\d{1,2}[ .\-]?(январ|феврал|март|апрел|ма[йя]|июн|июл|август|сентябр|октябр|ноябр|декабр)|\b\d{1,2}[.\/]\d{1,2}|\b\d{1,2}\s?числ|нового?\s?год|новогодн|\bпраздни|майских|выходн[ыо][ех]\s+дн/i;

// equipment / price-hike / sales — NOT a new dish
const NOTFOOD_RE =
  /повышен\w*\s+цен|кофемашин|оборудован|вендинг|в продаж|продаётся|продаж[аи]\b|аренд|франшиз|\bопт\b|\bб\/?у\b|поставк|закупк|инвентар|посуд[аыу]|мебел|ремонт|кальян/i;

function extractPrice(text) {
  const m = text.match(/(\d[\d  ]{1,6})\s?(?:₽|руб|р\.|р\b)/i);
  if (!m) return null;
  const n = Number(m[1].replace(/[^\d]/g, ''));
  return n >= 30 && n <= 5000 ? n : null; // sane dish/drink price range
}

function classify(text) {
  const s = (text || '').toLowerCase();
  if (JOB_RE.test(s) || NOTFOOD_RE.test(s)) return null; // hiring / equipment / sales
  if (SCHED_WORD.test(s) && DATE_TOKEN.test(s)) return 'schedule'; // real hours change (dated)
  if (FOOD_RE.test(s) && (NEW_RE.test(s) || extractPrice(s) != null)) return 'dish';
  return null; // not about food/drink → skip
}

// best-effort dish name from a post (no LLM): a phrase right after a "new" signal,
// else a short phrase around the first food word.
function extractDishName(text) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  // only a confident "signal: <name>" extraction; otherwise caller uses the
  // post's first line (a human-written headline beats a bare keyword stem).
  const m = t.match(
    /(?:новинк[аи]?|встречайте|попробуйте|новое блюдо|новый напиток|теперь в меню)\s*[-—:–]?\s*([A-Za-zА-Яа-яЁё][^.!?\n«»()]{3,42})/i,
  );
  return m ? m[1].trim().replace(/[\s,–—-]+$/, '') : null;
}

// ---- discover sources from a venue's own website ----
async function discover(prisma, limit) {
  const venues = await prisma.listing.findMany({
    where: { type: 'RESTAURANT', website: { not: null }, sources: { none: {} } },
    select: { id: true, website: true },
    take: limit,
  });
  let made = 0;
  for (const v of venues) {
    const site = v.website;
    const sources = [];
    // website is itself a source
    if (!/t\.me|vk\.com|instagram/.test(site)) sources.push({ type: 'website', url: site, handle: null });
    // the website field may already BE a t.me/vk link
    const directTg = tgHandleFromUrl(site);
    if (directTg) sources.push({ type: 'telegram', url: `https://t.me/${directTg}`, handle: directTg });
    // otherwise fetch the homepage and look for social links
    if (!directTg && /^https?:\/\//.test(site) && !/vk\.com|instagram/.test(site)) {
      const html = await get(site);
      if (html) {
        const tg = [...html.matchAll(/t\.me\/([A-Za-z0-9_]{4,})/g)].map((m) => m[1].toLowerCase())[0];
        const handle = tg && tgHandleFromUrl(`t.me/${tg}`);
        if (handle) sources.push({ type: 'telegram', url: `https://t.me/${handle}`, handle });
        const vk = [...html.matchAll(/vk\.com\/([A-Za-z0-9_.]{3,})/g)].map((m) => m[1])[0];
        if (vk && !/share|widget/.test(vk)) sources.push({ type: 'vk', url: `https://vk.com/${vk}`, handle: vk });
      }
      await sleep(1200); // polite per-host pause
    }
    for (const s of sources) {
      await prisma.venueSource
        .create({ data: { venueId: v.id, type: s.type, url: s.url, handle: s.handle } })
        .then(() => made++)
        .catch(() => {}); // unique(venueId,type) — ignore dupes
    }
  }
  console.log(`discover: scanned ${venues.length} venues, created ${made} sources`);
}

// ---- ingest OPEN telegram channels via the public web preview ----
function parseTgPreview(html, channel) {
  const posts = [];
  const blocks = html.split('data-post="').slice(1);
  for (const b of blocks) {
    const id = b.slice(0, b.indexOf('"')); // channel/123
    const num = id.split('/')[1];
    if (!num) continue;
    const textM = b.match(/tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/);
    const text = textM ? stripTags(textM[1]) : '';
    const photoM = b.match(/background-image:url\('([^']+)'\)/);
    const dateM = b.match(/datetime="([^"]+)"/);
    if (!text && !photoM) continue;
    posts.push({
      externalId: id,
      num: Number(num),
      text,
      photoUrl: photoM ? photoM[1] : null,
      publishedAt: dateM ? new Date(dateM[1]) : new Date(),
      url: `https://t.me/${channel}/${num}`,
    });
  }
  return posts;
}

async function telegram(prisma, limit) {
  const sources = await prisma.venueSource.findMany({
    where: { type: 'telegram', status: 'active' },
    orderBy: [{ lastFetched: { sort: 'asc', nulls: 'first' } }],
    take: limit,
  });
  let events = 0;
  for (const s of sources) {
    const channel = s.handle;
    const html = await get(`https://t.me/s/${channel}`);
    await prisma.venueSource.update({ where: { id: s.id }, data: { lastFetched: new Date() } }).catch(() => {});
    if (!html) {
      await prisma.venueSource.update({ where: { id: s.id }, data: { status: 'error' } }).catch(() => {});
      await sleep(1500);
      continue;
    }
    const posts = parseTgPreview(html, channel).slice(-12); // recent only
    const lastNum = s.lastPostId ? Number(s.lastPostId.split('/')[1]) : 0;
    let maxNum = lastNum;
    for (const p of posts) {
      if (p.num <= lastNum) continue; // already seen
      maxNum = Math.max(maxNum, p.num);
      const kind = classify(p.text);
      if (!kind) continue; // only new dishes/drinks or schedule changes
      if (kind === 'dish' && !p.photoUrl) continue; // a dish event needs its photo
      await prisma.venueEvent
        .create({
          data: {
            venueId: s.venueId,
            kind,
            price: kind === 'dish' ? extractPrice(p.text) : null,
            title:
              (kind === 'dish' ? extractDishName(p.text) : null) ||
              p.text.split('\n')[0].slice(0, 120) ||
              null,
            text: p.text.slice(0, 1000) || null,
            photoUrl: p.photoUrl,
            url: p.url,
            source: 'telegram',
            externalId: p.externalId,
            publishedAt: p.publishedAt,
          },
        })
        .then(() => events++)
        .catch(() => {}); // unique(venueId,externalId)
    }
    if (maxNum > lastNum) {
      await prisma.venueSource.update({ where: { id: s.id }, data: { lastPostId: `${channel}/${maxNum}` } }).catch(() => {});
    }
    await sleep(1500); // polite between channels
  }
  console.log(`telegram: read ${sources.length} channels, created ${events} events`);
}

// ---- ingest VK community walls via the OFFICIAL VK API (needs VK_TOKEN) ----
async function vk(prisma, limit) {
  const token = process.env.VK_TOKEN;
  if (!token) {
    console.log('vk: no VK_TOKEN in .env — skipping (create a free VK app → service token)');
    return;
  }
  const sources = await prisma.venueSource.findMany({
    where: { type: 'vk', status: 'active' },
    orderBy: [{ lastFetched: { sort: 'asc', nulls: 'first' } }],
    take: limit,
  });
  let events = 0;
  for (const s of sources) {
    const url = `https://api.vk.com/method/wall.get?domain=${encodeURIComponent(s.handle)}&count=12&access_token=${token}&v=5.199`;
    const txt = await get(url);
    await prisma.venueSource.update({ where: { id: s.id }, data: { lastFetched: new Date() } }).catch(() => {});
    let data;
    try { data = JSON.parse(txt); } catch { data = null; }
    const items = data?.response?.items;
    if (!items) {
      const code = data?.error?.error_code;
      // 6 = too many requests (transient) → back off, don't disable the source
      if (code === 6) { await sleep(2000); continue; }
      // 15/18/19/30 = closed/blocked/private community → disable; else leave active
      if ([15, 18, 19, 30, 100, 113].includes(code)) {
        await prisma.venueSource.update({ where: { id: s.id }, data: { status: 'error' } }).catch(() => {});
      }
      await sleep(400);
      continue;
    }
    const lastId = s.lastPostId ? Number(s.lastPostId) : 0;
    let maxId = lastId;
    for (const it of items) {
      if (it.id <= lastId || it.marked_as_ads) continue;
      maxId = Math.max(maxId, it.id);
      const text = (it.text ?? '').trim();
      if (!text) continue;
      const kind = classify(text);
      if (!kind) continue; // only new dishes/drinks or schedule changes
      const ph = (it.attachments ?? []).find((a) => a.type === 'photo')?.photo;
      const photo = ph?.sizes?.slice().sort((a, b) => b.width - a.width)[0]?.url ?? null;
      if (kind === 'dish' && !photo) continue; // a dish event needs its photo
      await prisma.venueEvent
        .create({
          data: {
            venueId: s.venueId,
            kind,
            price: kind === 'dish' ? extractPrice(text) : null,
            title:
              (kind === 'dish' ? extractDishName(text) : null) ||
              text.split('\n')[0].slice(0, 120) ||
              null,
            text: text.slice(0, 1000),
            photoUrl: photo,
            url: `https://vk.com/wall${it.owner_id}_${it.id}`,
            source: 'vk',
            externalId: `${it.owner_id}_${it.id}`,
            publishedAt: new Date((it.date ?? 0) * 1000),
          },
        })
        .then(() => events++)
        .catch(() => {});
    }
    if (maxId > lastId) await prisma.venueSource.update({ where: { id: s.id }, data: { lastPostId: String(maxId) } }).catch(() => {});
    await sleep(400); // VK allows ~3 req/s on user/service tokens
  }
  console.log(`vk: read ${sources.length} communities, created ${events} events`);
}

async function main() {
  const mode = process.argv[2] ?? 'all';
  const limit = Number(process.argv[3] ?? 200);
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  if (mode === 'discover' || mode === 'all') await discover(prisma, limit);
  if (mode === 'telegram' || mode === 'all') await telegram(prisma, limit);
  if (mode === 'vk' || mode === 'all') await vk(prisma, limit);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
