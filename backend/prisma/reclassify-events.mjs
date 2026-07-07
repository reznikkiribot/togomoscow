// Re-evaluates every stored VenueEvent with the new rules: keep only new
// dishes/drinks ('dish', needs a photo) and hours changes ('schedule'); drop the
// rest; fill the detected price. Run after changing the classifier.
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

const FOOD_RE = /бургер|пицц|паст|ролл|сашими|суши|салат|\bсуп\b|\bсет\b|стейк|шаурм|шаверм|хачапур|хинкал|долм|десерт|торт|чизкейк|тирамису|выпечк|завтрак|сэндвич|сендвич|блюд|пельмен|вареник|\bвок\b|боул|поке|рамен|том.?ям|круассан|эклер|пончик|мороже|шашлык|кебаб|плов|лазань|ризотто|гирос|фалафель|хот.?дог|наггетс|картофель фри|кофе|латте|капучин|\bраф\b|\bчай\b|матч|какао|коктейл|лимонад|смузи|\bвино\b|\bпиво\b|сидр|напит|глинтвейн|эспрессо|американо|сангри/i;
const DISH_NOUN = '(бургер|пицц|ролл|сашими|суши|сэндвич|сендвич|кофе|латте|капучин|раф|чай|матч|какао|коктейл|десерт|торт|чизкейк|тирамису|эклер|круассан|напит|блюд|\\bсет\\b|паст|\\bсуп\\b|салат|стейк|шаурм|хачапур|хинкал|пиво|сидр|\\bвино\\b|лимонад|смузи|боул|поке|рамен|завтрак|мороже|пельмен|плов|кебаб|шашлык)';
const NEW_RE = new RegExp(
  'в меню|новинк|теперь готов|добавил[аи]?\\s+[\\wё\\s-]{0,16}в меню|обновил[аи]?\\s+меню|представляем\\s+нов|встречайте\\s+нов|' +
    'нов(ый|ое|ая|ые)\\s+[\\wё-]{0,12}\\s*' + DISH_NOUN,
  'i',
);
const JOB_RE = /(ищ[еуа][мт]|требу[ею]тся|нужен|нужна|нужны|приглашаем|в команду нужен)\s+[\wё\s-]{0,20}(бармен|бариста|повар|официант|курьер|сотрудник|админ|кух|персонал|стаж[её]р|хостес|менеджер)|ваканси|резюме|подработк|трудоустройств/i;
const SCHED_WORD = /не работа|закрыт|выходн|режим работ|график работ|часы работ|сокращ[её]нн|праздничн.{0,14}график|работаем по/i;
const DATE_TOKEN = /\b\d{1,2}[ .\-]?(январ|феврал|март|апрел|ма[йя]|июн|июл|август|сентябр|октябр|ноябр|декабр)|\b\d{1,2}[.\/]\d{1,2}|\b\d{1,2}\s?числ|нового?\s?год|новогодн|\bпраздни|майских|выходн[ыо][ех]\s+дн/i;
const NOTFOOD_RE = /повышен\w*\s+цен|кофемашин|оборудован|вендинг|в продаж|продаётся|продаж[аи]\b|аренд|франшиз|\bопт\b|\bб\/?у\b|поставк|закупк|инвентар|посуд[аыу]|мебел|ремонт|кальян/i;
function extractPrice(text) {
  const m = (text || '').match(/(\d[\d  ]{1,6})\s?(?:₽|руб|р\.|р\b)/i);
  if (!m) return null;
  const n = Number(m[1].replace(/[^\d]/g, ''));
  return n >= 30 && n <= 5000 ? n : null;
}
function extractDishName(text) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  const m = t.match(/(?:новинк[аи]?|встречайте|попробуйте|новое блюдо|новый напиток|теперь в меню)\s*[-—:–]?\s*([A-Za-zА-Яа-яЁё][^.!?\n«»()]{3,42})/i);
  return m ? m[1].trim().replace(/[\s,–—-]+$/, '') : null;
}
function classify(text) {
  const s = (text || '').toLowerCase();
  if (JOB_RE.test(s) || NOTFOOD_RE.test(s)) return null;
  if (SCHED_WORD.test(s) && DATE_TOKEN.test(s)) return 'schedule';
  if (FOOD_RE.test(s) && (NEW_RE.test(s) || extractPrice(s) != null)) return 'dish';
  return null;
}

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  let kept = 0, dropped = 0, processed = 0;
  let cursor = null;
  const toDelete = [];
  // pass 1: scan ALL events by id (deletes deferred so the cursor never breaks)
  while (true) {
    const batch = await prisma.venueEvent.findMany({
      take: 1000,
      orderBy: { id: 'asc' },
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (!batch.length) break;
    cursor = batch[batch.length - 1].id;
    for (const e of batch) {
      processed++;
      const txt = e.text || e.title || '';
      const kind = classify(txt);
      if (!kind || (kind === 'dish' && !e.photoUrl)) {
        toDelete.push(e.id);
        dropped++;
      } else {
        const price = kind === 'dish' ? extractPrice(txt) : null;
        const firstLine = (e.text || '').split('\n')[0].slice(0, 120) || e.title;
        const title = kind === 'dish' ? extractDishName(txt) || firstLine : e.title;
        if (e.kind !== kind || e.price !== price || e.title !== title) {
          await prisma.venueEvent.update({ where: { id: e.id }, data: { kind, price, title } }).catch(() => {});
        }
        kept++;
      }
    }
    console.log(`scanned ${processed} — keep ${kept}, drop ${dropped}`);
  }
  // pass 2: apply deletes
  for (let i = 0; i < toDelete.length; i += 500) {
    await prisma.venueEvent.deleteMany({ where: { id: { in: toDelete.slice(i, i + 500) } } });
  }
  console.log(`DONE. kept ${kept}, dropped ${dropped}`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
