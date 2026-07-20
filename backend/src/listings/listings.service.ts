import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ListingType, Prisma } from '@prisma/client';
import OpeningHours from 'opening_hours';
import { isNonStandalone } from '../common/non-standalone';
import { buildAffinities, loadVenueTraits, scorePriceSegment, scoreVenueTier } from '../common/taste-affinity';
import { PrismaService } from '../prisma/prisma.service';
import { placeholderKeys } from '../stock/stock.data';
import { cuisineLabel, cuisineToken } from './cuisine';

// A check-in counts as "verified" when the user's GPS is within this radius of
// the venue. City GPS + OSM coordinates are imprecise, so we stay lenient.
const CHECKIN_RADIUS_M = 500;

// separators removed before matching, so "муму" finds "Му-Му", "rostics" → "Rostic's"
const NAME_STRIP_RE = /[-'`‘’.]/g;
const NAME_STRIP_SQL = "[-'`‘’.]";

// "word characters" for building word boundaries in Postgres regexes. We CANNOT use
// \m/\M — this DB's regex word class is ASCII-only, so \m/\M silently match nothing on
// Cyrillic (they're read as literal m/M). This explicit class covers RU + EN + digits.
const WORD_CH = 'a-zа-яё0-9';

// rough RU↔EN transliteration so a Russian query can find a Latin name and vice versa
const RU_LAT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};
function ruToLat(s: string): string {
  let o = '';
  for (const ch of s) o += RU_LAT[ch] ?? ch;
  return o;
}
const LAT_DIGRAPHS: [string, string][] = [
  ['sch', 'щ'], ['zh', 'ж'], ['kh', 'х'], ['ch', 'ч'], ['sh', 'ш'], ['ts', 'ц'],
  ['yu', 'ю'], ['ya', 'я'], ['yo', 'ё'],
];
const LAT_RU: Record<string, string> = {
  a: 'а', b: 'б', c: 'к', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и', j: 'дж', k: 'к',
  l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'к', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в',
  w: 'в', x: 'кс', y: 'й', z: 'з',
};
function latToRu(s: string): string {
  let str = s;
  for (const [a, b] of LAT_DIGRAPHS) str = str.split(a).join(b);
  let o = '';
  for (const ch of str) o += LAT_RU[ch] ?? ch;
  return o;
}

// nearest Moscow metro station to a point — shown as the venue's location ("м. …")
// instead of a bare "Москва". Data: OSM subway stations (name + coords).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const METRO: { n: string; lat: number; lng: number }[] = require('./metro-stations.json');
function nearestMetro(lat?: number | null, lng?: number | null): string | null {
  if (lat == null || lng == null) return null;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  let best: string | null = null;
  let bd = Infinity;
  for (const s of METRO) {
    const dLat = s.lat - lat;
    const dLng = (s.lng - lng) * cosLat;
    const d = dLat * dLat + dLng * dLng;
    if (d < bd) { bd = d; best = s.n; }
  }
  return bd < 0.0025 ? best : null; // within ~5.5 km, else no nearby metro
}

// bigram Dice-coefficient similarity (0..1) — robust to typos/declensions, used to
// RANK search results (so "капучинно"→"Капучино" card wins over venues serving coffee)
function bigrams(s: string): string[] {
  const t = ` ${(s ?? '').toLowerCase().trim()} `;
  const out: string[] = [];
  for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2));
  return out;
}
function dice(a: string, b: string): number {
  const A = bigrams(a);
  const B = bigrams(b);
  if (!A.length || !B.length) return 0;
  const map = new Map<string, number>();
  for (const g of B) map.set(g, (map.get(g) ?? 0) + 1);
  let m = 0;
  for (const g of A) { const c = map.get(g) ?? 0; if (c > 0) { m++; map.set(g, c - 1); } }
  return (2 * m) / (A.length + B.length);
}
// best name↔query similarity across RU↔EN transliterations
function nameSim(name: string, ql: string): number {
  return Math.max(dice(name, ql), dice(name, latToRu(ql)), dice(name, ruToLat(ql)));
}

// taste clusters: liking one member predicts liking the others (content-based,
// no crowd data). Lets "rated cappuccino 5★" surface latte/raf, not espresso.
const normKind = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const TASTE_CLUSTERS: string[][] = [
  // coffee — milk-based
  ['капучино', 'латте', 'флэтуайт', 'раф', 'мокко', 'макиато', 'кортадо', 'пикколо', 'айслатте'],
  // coffee — black
  ['эспрессо', 'доппио', 'ристретто', 'американо', 'колдбрю', 'фильтр', 'v60', 'аэропресс', 'кемекс', 'турка', 'френчпресс'],
  // beer — lager / light
  ['балтика', 'heineken', 'carlsberg', 'tuborg', 'stellaartois', 'bud', 'corona', 'holsten', 'miller', 'krombacher', 'warsteiner', 'asahi', 'tsingtao', 'pilsnerurquell', 'budweiserbudvar', 'velkopopovickýkozel', 'žateckýgus', 'старыймельник', 'сибирскаякорона', 'очаково', 'жигулёвское'],
  // beer — wheat / white
  ['hoegaarden', 'blanchedebruxelles', 'edelweiss', 'weihenstephaner', 'erdinger', 'franziskaner', 'paulaner', 'пшеничное'],
  // beer — dark / stout / porter
  ['guinness', 'стаут', 'портер'],
  // beer — hoppy / IPA
  ['brewdogpunkipa', 'крафтовыйipa', 'ipa'],
  // wine — sparkling
  ['veuveclicquot', 'moëtchandon', 'просекко', 'игристое', 'шампанское', 'lambrusco', 'cinzano', 'martini', 'абраудюрсо', 'золотаябалка'],
  // wine — red
  ['киндзмараули', 'саперави', 'мукузани', 'conchaytoro', 'casillerodeldiablo', 'chianti', 'rioja', 'gatonegro', 'carlorossi', 'красноесухое'],
  // wine — white
  ['цинандали', 'белоесухое', 'undurraga'],
  // cocktails — bitter / strong
  ['негрони', 'манхэттен', 'олдфэшнд', 'олдфэшн', 'мартини', 'вискисауэр', 'сазерак'],
  // cocktails — sweet / refreshing
  ['мохито', 'пинаколада', 'дайкири', 'маргарита', 'апероль', 'апирольшприц', 'спритц', 'космополитан'],
  // dishes — spicy / asian
  ['томям', 'пхали', 'кимчи', 'паданг', 'карри', 'удон', 'рамен', 'паттайя'],
];

// Maps a catalog item's category → how to find real venues that serve it.
// `cuisine` matches OSM cuisine tags; `barLike` includes bars/pubs (for drinks).
const LISTINGS_CUISINE_FOR: Record<string, { cuisine?: string[]; barLike?: boolean }> = {
  стейки: { cuisine: ['steak'] },
  мясо: { cuisine: ['steak', 'grill', 'meat'] },
  гриль: { cuisine: ['grill', 'steak', 'bbq'] },
  кофе: { cuisine: ['coffee'] },
  'горячие напитки': { cuisine: ['coffee'] },
  чай: { cuisine: ['coffee', 'tea'] },
  пиво: { cuisine: ['beer'], barLike: true },
  ipa: { cuisine: ['beer'], barLike: true },
  коктейли: { barLike: true },
  коктейль: { barLike: true },
  вино: { cuisine: ['wine'], barLike: true },
  пицца: { cuisine: ['pizza', 'italian'] },
  итальянская: { cuisine: ['italian', 'pizza'] },
  паста: { cuisine: ['italian'] },
  бургеры: { cuisine: ['burger'] },
  фастфуд: { cuisine: ['burger', 'fast_food'] },
  грузинская: { cuisine: ['georgian'] },
  кавказская: { cuisine: ['georgian', 'caucasian'] },
  японская: { cuisine: ['japanese', 'sushi'] },
  суши: { cuisine: ['sushi', 'japanese'] },
  десерты: { cuisine: ['cake', 'dessert', 'ice_cream'] },
  выпечка: { cuisine: ['bakery', 'cake'] },
  морепродукты: { cuisine: ['seafood', 'fish'] },
  азиатская: { cuisine: ['asian'] },
  китайская: { cuisine: ['chinese'] },
  тайская: { cuisine: ['thai'] },
  русская: { cuisine: ['russian'] },
  сэндвичи: { cuisine: ['sandwich'] },
};

// filter-token → Russian category/name keywords (regex), so the sparse OSM
// `cuisine` field isn't the only thing the cuisine filter can match
const CUISINE_TOKEN_RU: Record<string, string> = {
  russian: 'русск|борщ|пельмен|блин|окрошк|солянк',
  georgian: 'грузин|хачапур|хинкал|чахохбил|сацив',
  italian: 'итальян|паст|пицц|ризотто|лазань',
  pizza: 'пицц',
  sushi: 'суши|ролл|сашими|японск',
  asian: 'азиатск|вок|том ям|фо бо|рамен|пад тай',
  chinese: 'китайск|дим сам|вок',
  burger: 'бургер',
  coffee: 'кофе|латте|капучино|раф|эспрессо|американо',
  barbecue: 'гриль|шашлык|барбекю|мангал|стейк',
  fast_food: 'фастфуд|бургер|шаурм|шаверм|хот.?дог|наггетс|картофель фри',
};

function inMoscow(lat?: number | null, lng?: number | null): boolean {
  return (
    lat != null && lng != null && lat > 55.4 && lat < 56.05 && lng > 37.2 && lng < 37.95
  );
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search/list with chain grouping: chain branches (same group_key) collapse
   * into ONE representative row carrying branchCount. Independents have
   * branchCount = 1.
   */
  async list(params: {
    type?: ListingType;
    search?: string;
    take?: number;
    sort?: string;
    price?: number;
    openNow?: boolean;
    cuisine?: string;
    category?: string;
    viewerId?: string | null;
  }) {
    const {
      type,
      search,
      take = 50,
      sort = 'recommended',
      price,
      openNow,
      cuisine,
      category,
      viewerId,
    } = params;
    const conds: Prisma.Sql[] = [];
    if (type) conds.push(Prisma.sql`type = ${type}::"ListingType"`);
    // word-aware name match (so "раф" won't hit "гРАФ"); fall back to substring
    if (search) {
      const mc = this.matchCond(search, 'AND', false);
      conds.push(mc ?? Prisma.sql`name ILIKE ${'%' + search + '%'}`);
    }
    // OWNER RULE (12.07.2026): dishes/drinks with NO venue link are hidden from the
    // menu/browse (Блюда/Напитки tabs) — they only surface on a DIRECT search.
    // They stay in the DB and reappear automatically once a parse links a venue.
    if ((type === 'DISH' || type === 'DRINK') && !search) {
      conds.push(
        Prisma.sql`EXISTS (SELECT 1 FROM menu_links ml WHERE ml.item_id = listings.id AND ml.status = 'APPROVED')`,
      );
    }
    if (price) conds.push(Prisma.sql`price_level = ${Number(price)}`);
    if (cuisine) {
      // the OSM `cuisine` field is sparse — also match the Russian category/name
      // so filtering by "Грузинская" actually surfaces Georgian spots/dishes
      const ru = CUISINE_TOKEN_RU[cuisine.toLowerCase()];
      conds.push(
        ru
          ? Prisma.sql`(cuisine ILIKE ${'%' + cuisine + '%'} OR category ~* ${ru} OR name ~* ${ru})`
          : Prisma.sql`cuisine ILIKE ${'%' + cuisine + '%'}`,
      );
    }
    if (category) {
      // "Кафе" also surfaces fast-food / shawarma / ice-cream / food-court (casual spots)
      if (/кафе/i.test(category)) {
        conds.push(
          Prisma.sql`(category ~* 'кафе|фастфуд|шаурм|шаверм|мороженое|фуд.?корт' OR cuisine ~* 'kebab|shawarma')`,
        );
      } else if (/бар/i.test(category)) {
        // "Бары" also includes pubs and beer gardens
        conds.push(Prisma.sql`category ~* 'бар|паб|pub|пивной сад'`);
      } else {
        conds.push(Prisma.sql`category ILIKE ${'%' + category + '%'}`);
      }
    }
    const whereSql = conds.length
      ? Prisma.sql`WHERE ${Prisma.join(conds, ' AND ')}`
      : Prisma.empty;

    // "Рекомендуемые" is a real TOP ranking: a Bayesian blend so a 5.0 with one
    // review doesn't outrank a 4.6 with fifty (m=global mean 4.0, C=confidence 8).
    const baseOrder =
      sort === 'rating'
        ? Prisma.sql`t."avgRating" DESC, t."reviewCount" DESC`
        : sort === 'reviews'
          ? Prisma.sql`t."reviewCount" DESC, t."avgRating" DESC`
          : Prisma.sql`((t."reviewCount"::float * t."avgRating" + 8 * 4.0) / (t."reviewCount" + 8)) DESC, t."reviewCount" DESC`;
    // «Напитки»: coffee first, then the rest of the non-alcoholic drinks, alcohol
    // LAST (owner rule 13.07.2026)
    const orderSql =
      type === 'DRINK'
        ? Prisma.sql`
            CASE
              WHEN t.category ~* 'кофе|coffee|латте|капучино|раф|эспрессо|американо|флэт' THEN 0
              WHEN t.category ~* 'вино|wine|пиво|beer|коктейл|cocktail|крепк|виски|водк|ликёр|ликер|ром|джин|текил|коньяк|бренди|шампанск|игрист|сидр|наливк|настойк|аперитив|вермут|бар\b' THEN 2
              ELSE 1
            END ASC, ${baseOrder}`
        : baseOrder;

    // when filtering by "open now" we fetch a larger pool, then filter in JS
    const pool = openNow ? 300 : Number(take);

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM (
        SELECT DISTINCT ON (COALESCE(group_key, id))
          id, name, type, category, cuisine,
          photo_url AS "photoUrl", price_level AS "priceLevel",
          avg_rating AS "avgRating", review_count AS "reviewCount",
          website, address, lat, lng, phone, hours,
          COALESCE(group_key, id) AS "groupKey",
          COUNT(*) OVER (PARTITION BY COALESCE(group_key, id))::int AS "branchCount"
        FROM listings
        ${whereSql}
        ORDER BY COALESCE(group_key, id), review_count DESC, avg_rating DESC
      ) t
      ORDER BY ${orderSql}
      LIMIT ${pool}
    `;

    if (openNow) {
      const open = rows.filter((r) => {
        if (!r.hours) return false;
        try {
          return new (OpeningHours as any)(r.hours).getState(new Date());
        } catch {
          return false;
        }
      });
      return this.personalSort(await this.enrichCards(open.slice(0, Number(take))), sort, viewerId, !!search);
    }
    return this.personalSort(await this.enrichCards(rows), sort, viewerId, !!search);
  }

  /** «Рекомендуемые» in EVERY catalog list ranks with the same taste profile as
   *  the feed (owner rule 16.07.2026): category + venue affinity re-rank on top
   *  of the base quality order. Search keeps its relevance order untouched. */
  private async personalSort(cards: any[], sort: string, viewerId?: string | null, isSearch = false) {
    if (sort !== 'recommended' || !viewerId || isSearch || cards.length < 3) return cards;
    try {
      const { catAffinity, venueAffinity, priceSegmentAffinity, venueTierAffinity } = await buildAffinities(this.prisma, viewerId);
      if (!catAffinity.size && !venueAffinity.size && !priceSegmentAffinity && !venueTierAffinity.size) return cards;

      const itemIds = cards
        .filter((card) => card.type === 'DISH' || card.type === 'DRINK')
        .map((card) => card.id);
      const menuLinks = itemIds.length
        ? await this.prisma.menuLink.findMany({
          where: { itemId: { in: itemIds }, status: 'APPROVED' },
          select: { itemId: true, venueId: true, price: true },
        })
        : [];
      const linksByItem = new Map<string, typeof menuLinks>();
      for (const link of menuLinks) {
        if (!linksByItem.has(link.itemId)) linksByItem.set(link.itemId, []);
        linksByItem.get(link.itemId)!.push(link);
      }
      const venueIds = [...new Set([
        ...cards.filter((card) => card.type === 'RESTAURANT').map((card) => card.id),
        ...cards.flatMap((card) => [card.bestVenue?.id, card.tryAt?.id]).filter(Boolean),
        ...menuLinks.map((link) => link.venueId),
      ])] as string[];
      const venueTraits = await loadVenueTraits(this.prisma, venueIds);

      return cards
        .map((c, i) => {
          const aff = catAffinity.get((c.category ?? '').toLowerCase().trim()) ?? 0;
          const displayedVenueId = c.bestVenue?.id ?? c.tryAt?.id;
          let candidateLinks = c.type === 'RESTAURANT'
            ? [{ venueId: c.id, price: venueTraits.get(c.id)?.menuMedian ?? null }]
            : (linksByItem.get(c.id) ?? []).filter((link) => !displayedVenueId || link.venueId === displayedVenueId);
          if (!candidateLinks.length && displayedVenueId) {
            candidateLinks = [{
              venueId: displayedVenueId,
              price: c.bestVenue?.price ?? c.tryAt?.price ?? venueTraits.get(displayedVenueId)?.menuMedian ?? null,
            }];
          }
          let bestServingScore = -Infinity;
          for (const link of candidateLinks) {
            const traits = venueTraits.get(link.venueId);
            const vAff = venueAffinity.get(link.venueId) ?? 0;
            const priceFit = scorePriceSegment(priceSegmentAffinity, link.price ?? traits?.menuMedian);
            const tierFit = scoreVenueTier(venueTierAffinity, traits);
            bestServingScore = Math.max(bestServingScore, vAff * 2.5 + priceFit * 3.25 + tierFit * 3.5);
          }
          // base keeps the original (quality) order as a small stabilizer
          return { c, s: aff * 3 + (Number.isFinite(bestServingScore) ? bestServingScore : 0) - i * 0.01 };
        })
        .sort((a, b) => b.s - a.s)
        .map((x) => x.c);
    } catch {
      return cards;
    }
  }

  /**
   * Adds card extras: ONE highlighted review snippet (best with text) and a stock
   * placeholder photo for venues that have no real photo yet. Used by all the
   * list/card endpoints so the home feed looks populated.
   */
  async enrichCards<T extends { id: string; type?: string; category?: string | null; photoUrl?: string | null }>(
    rows: T[],
  ): Promise<T[]> {
    if (rows.length === 0) return rows;
    const ids = rows.map((r) => r.id);
    const reviews = await this.prisma.review.findMany({
      where: { listingId: { in: ids }, text: { not: null }, status: 'APPROVED' },
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
      select: { listingId: true, text: true, rating: true },
    });
    const snippetByListing = new Map<string, { text: string; rating: number }>();
    for (const r of reviews) {
      if (!snippetByListing.has(r.listingId) && r.text) {
        snippetByListing.set(r.listingId, { text: r.text, rating: r.rating });
      }
    }

    // for dishes/drinks: the venue where this item scores highest — shown on the
    // card WITH that venue's own photo (the image follows «Лучшее в:» too)
    const itemIds = rows.filter((r) => r.type === 'DISH' || r.type === 'DRINK').map((r) => r.id);
    const bestByItem = new Map<string, { id: string; name: string; rating: number; photoUrl?: string | null }>();
    if (itemIds.length) {
      const agg = await this.prisma.$queryRaw<
        { listing_id: string; vid: string; avg: number }[]
      >`
        SELECT listing_id, attributes->>'venueId' AS vid, AVG(rating)::float AS avg
        FROM reviews
        WHERE status = 'APPROVED' AND listing_id IN (${Prisma.join(itemIds)})
          AND attributes->>'venueId' IS NOT NULL
        GROUP BY listing_id, attributes->>'venueId'
      `;
      const topByItem = new Map<string, { vid: string; avg: number }>();
      for (const a of agg) {
        const cur = topByItem.get(a.listing_id);
        if (!cur || a.avg > cur.avg) topByItem.set(a.listing_id, { vid: a.vid, avg: a.avg });
      }
      const vids = [...new Set([...topByItem.values()].map((v) => v.vid))];
      if (vids.length) {
        const vs = await this.prisma.listing.findMany({
          where: { id: { in: vids } },
          select: { id: true, name: true },
        });
        const nameById = new Map(vs.map((v) => [v.id, v.name]));
        // the best (venue, item)'s own generated photo, if any
        const bestLinks = await this.prisma.menuLink.findMany({
          where: { OR: [...topByItem.entries()].map(([lid, t]) => ({ itemId: lid, venueId: t.vid })) },
          select: { itemId: true, venueId: true, photoUrl: true },
        });
        const linkPhoto = new Map(bestLinks.map((l) => [`${l.itemId}|${l.venueId}`, l.photoUrl]));
        for (const [lid, t] of topByItem) {
          const name = nameById.get(t.vid);
          if (name) bestByItem.set(lid, { id: t.vid, name, rating: t.avg, photoUrl: linkPhoto.get(`${lid}|${t.vid}`) });
        }
      }
    }

    // OWNER RULE 18.07.2026: a VENUE card shows a nice random photo of ONE of its
    // OWN dishes/drinks (a generated aigen photo), not a name tile or building shot.
    const venueIds = rows.filter((r) => r.type === 'RESTAURANT').map((r) => r.id);
    const venueDishPhoto = new Map<string, string>();
    if (venueIds.length) {
      const links = await this.prisma.menuLink.findMany({
        where: { venueId: { in: venueIds }, status: 'APPROVED', photoUrl: { not: null } },
        select: { venueId: true, photoUrl: true },
      });
      const byVenue = new Map<string, string[]>();
      for (const l of links) {
        if (!l.photoUrl) continue;
        (byVenue.get(l.venueId) ?? byVenue.set(l.venueId, []).get(l.venueId)!).push(l.photoUrl);
      }
      for (const [vid, photos] of byVenue) {
        // deterministic per-venue pick so the card photo is stable across reloads
        let h = 0; for (const c of vid) h = (h * 31 + c.charCodeAt(0)) >>> 0;
        venueDishPhoto.set(vid, photos[h % photos.length]);
      }
    }

    // social proof for cards with NO reviews yet: how many people are watching /
    // want to try it ("вы не первый, кто присматривается")
    const zeroIds = rows.filter((r) => (r as any).reviewCount === 0).map((r) => r.id);
    // «Попробуйте в:» — any dish WITHOUT a computed best venue names a RANDOM
    // venue that serves it (rated-but-venueless reviews included)
    const tryAtIds = rows
      .filter((r) => (r.type === 'DISH' || r.type === 'DRINK') && !bestByItem.has(r.id))
      .map((r) => r.id);
    // «Попробуйте в:» carries the venue AND that venue's own AI photo of the
    // dish — rotating the venue rotates the photo (owner rule 12.07.2026)
    const tryAtByItem = new Map<string, { id: string; name: string; photoUrl?: string | null }>();
    if (tryAtIds.length) {
      const linkRows = await this.prisma.menuLink.findMany({
        where: { itemId: { in: tryAtIds }, status: 'APPROVED' },
        select: { itemId: true, photoUrl: true, price: true, venue: { select: { id: true, name: true } } },
      });
      const byItem = new Map<string, { id: string; name: string; photoUrl?: string | null; price?: number | null }[]>();
      for (const l of linkRows) {
        if (!l.venue) continue;
        if (!byItem.has(l.itemId)) byItem.set(l.itemId, []);
        byItem.get(l.itemId)!.push({ ...l.venue, photoUrl: l.photoUrl, price: l.price });
      }
      for (const [itemId, vs] of byItem) {
        // prefer a venue that actually HAS its own generated photo, so the card
        // shows a venue-specific image rather than the generic shared one
        const withPhoto = vs.filter((v) => v.photoUrl);
        const pool = withPhoto.length ? withPhoto : vs;
        tryAtByItem.set(itemId, pool[Math.floor(Math.random() * pool.length)]);
      }
    }
    const wantByListing = new Map<string, number>();
    const viewsByListing = new Map<string, number>();
    if (zeroIds.length) {
      const favs = await this.prisma.favorite.groupBy({
        by: ['listingId'],
        where: { listingId: { in: zeroIds } },
        _count: true,
      });
      for (const f of favs) wantByListing.set(f.listingId, f._count);
      const views = await this.prisma.interaction.groupBy({
        by: ['listingId'],
        where: { listingId: { in: zeroIds }, type: 'VIEW' },
        _count: true,
      });
      for (const v of views) viewsByListing.set(v.listingId, v._count);
    }

    return rows.map((r) => {
      const best = bestByItem.get(r.id);
      const tryAt = tryAtByItem.get(r.id);
      // the photo follows the venue the card is attributed to: «Лучшее в:» first,
      // then «Попробуйте в:». User photos always win; venue photo only when no
      // real user photo exists yet.
      const isUserPhoto = (r as any).photoUrl?.startsWith('/api/files/') && !(r as any).photoUrl?.startsWith('/api/files/aigen-');
      const venuePhoto = !isUserPhoto ? (best?.photoUrl || tryAt?.photoUrl || null) : null;
      return {
      ...r,
      photoUrl: venuePhoto ?? (r as any).photoUrl,
      // venue card face: a random own-dish photo (owner 18.07.2026)
      dishPhoto: r.type === 'RESTAURANT' ? venueDishPhoto.get(r.id) ?? null : undefined,
      snippet: snippetByListing.get(r.id) ?? null,
      bestVenue: best ?? null,
      wantCount: wantByListing.get(r.id) ?? undefined,
      viewCount: viewsByListing.get(r.id) ?? undefined,
      tryAt: tryAt ?? undefined,
      // show at least the city when there's no street address yet
      cityLabel: inMoscow((r as any).lat, (r as any).lng) ? 'Москва' : undefined,
      metro: nearestMetro((r as any).lat, (r as any).lng), // nearest metro → "м. …" label
      // always provide a stock fallback so even a broken/missing photoUrl shows
      // an appetizing photo instead of a monogram tile.
      placeholderPhoto: `/api/stock/${placeholderKeys(r.type ?? 'RESTAURANT', r.category, (r as any).name, r.id, 1)[0]}`,
      };
    });
  }

  /** All branches of a chain (by group_key) + aggregated rating, for the map. */
  async group(key: string, type?: ListingType) {
    const branches = await this.prisma.listing.findMany({
      // match by group_key, or (for OSM chains w/o a key) by identical name
      where: {
        OR: [{ groupKey: key }, { groupKey: null, name: { equals: key, mode: 'insensitive' } }],
        ...(type ? { type } : {}),
      },
      select: {
        id: true,
        name: true,
        address: true,
        lat: true,
        lng: true,
        avgRating: true,
        reviewCount: true,
        type: true,
        photoUrl: true,
        website: true,
      },
      orderBy: { reviewCount: 'desc' },
    });
    const reviewCount = branches.reduce((s, b) => s + b.reviewCount, 0);
    const weighted = branches.reduce((s, b) => s + b.avgRating * b.reviewCount, 0);
    return {
      key,
      name: branches[0]?.name ?? '',
      type: branches[0]?.type ?? 'RESTAURANT',
      website: branches[0]?.website ?? null,
      branchCount: branches.length,
      avgRating: reviewCount ? weighted / reviewCount : 0,
      reviewCount,
      branches,
    };
  }

  /**
   * "Вам понравится" — random cards for now (no analytics/personalization yet,
   * per product decision). Real personalization is a Phase 2 concern.
   */
  async recommended(take = 12) {
    const limit = Math.max(1, Number(take) || 12);

    // Prefer cards that can say "try this at <venue>". After a fresh Railway DB
    // restore/migration, links can be sparse, so keep a no-link fallback below.
    const linked = await this.prisma.listing.findMany({
      where: {
        type: { in: ['DISH', 'DRINK'] },
        servedAt: { some: { status: 'APPROVED' } },
      },
      include: {
        servedAt: {
          where: { status: 'APPROVED' },
          select: { venue: { select: { id: true, name: true } }, price: true },
          take: 30,
        },
      },
      orderBy: [{ reviewCount: 'desc' }, { avgRating: 'desc' }],
      take: Math.max(limit * 8, 80),
    });

    const shuffle = <T>(arr: T[]) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    if (linked.length) {
      const seenName = new Set<string>();
      const pick = shuffle(linked).filter((it) => {
        const n = it.name.toLowerCase().trim();
        if (seenName.has(n)) return false;
        seenName.add(n);
        return true;
      }).slice(0, limit);
      const cards = await this.enrichCards(pick);
      return cards.map((c, i) => {
        const links = ((pick[i] as any).servedAt ?? []).filter((l: any) => l.venue);
        const link = links.length ? links[Math.floor(Math.random() * links.length)] : undefined;
        const recVenue = link ? { ...link.venue, price: link.price ?? null } : undefined;
        return { ...c, recReason: 'popular now', recVenue };
      });
    }

    // Last resort: still show real items instead of leaving the home screen empty.
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM listings WHERE type::text IN ('DISH', 'DRINK')
      ORDER BY RANDOM() LIMIT ${limit}
    `;
    const ids = rows.map((r) => r.id);
    const items = await this.prisma.listing.findMany({ where: { id: { in: ids } } });
    const byId = new Map(items.map((i) => [i.id, i]));
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as typeof items;
    return this.enrichCards(ordered);
  }

  /**
   * Instagram-grade ranked feed. Score = Quality × TasteMatch × Freshness × Boosts:
   *  • Quality — text depth + engagement (useful×3, comments×2, reactions ×1);
   *  • TasteMatch — the post's category vs the VIEWER's own taste profile;
   *  • Freshness — exp(-age/7d);
   *  • FIRST-POST BOOST ×5 (72h) — the author's first-ever review gets real reach;
   *  • follow boost ×2 — people you follow rank higher in the same list.
   * Delivery is ONE-TIME per viewer: served posts are recorded in feed_impressions
   * and never returned to that viewer again ("Показать ещё" pages the next batch).
   */
  async feedRanked(viewerId: string | null, take = 20) {
    if (!viewerId) return this.feed(take); // anonymous → public recency feed
    const seenRows = await this.prisma.feedImpression.findMany({
      where: { userId: viewerId },
      select: { reviewId: true },
    });
    const seen = new Set(seenRows.map((x) => x.reviewId));
    const candidates = await this.prisma.review.findMany({
      where: {
        status: 'APPROVED',
        // a post is a photo OR a written note — bare star-only ratings stay out
        OR: [{ photoUrls: { isEmpty: false } }, { text: { gt: '' } }],
        userId: { not: viewerId },
      },
      include: { user: true, listing: true },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    // unseen posts lead; when they run out the feed RECYCLES already-seen posts
    // (friends' and strangers' alike, ranked) so the wall is never empty — the
    // client stops only when literally every post in the app has been shown
    let fresh = candidates.filter((r) => !seen.has(r.id));
    let recycled = false;
    if (!fresh.length) {
      fresh = candidates;
      recycled = true;
    }
    if (!fresh.length) {
      // no other people's posts exist at all (tiny community) → the viewer's own
      // posts keep the wall alive rather than showing an empty feed
      fresh = await this.prisma.review.findMany({
        where: { status: 'APPROVED', OR: [{ photoUrls: { isEmpty: false } }, { text: { gt: '' } }], userId: viewerId },
        include: { user: true, listing: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      recycled = true;
    }
    if (!fresh.length) return [];

    // engagement, batched: useful×3, other reactions ×1, comments ×2
    const ids = fresh.map((r) => r.id);
    const votes = await this.prisma.reviewVote.groupBy({
      by: ['reviewId', 'type'],
      where: { reviewId: { in: ids } },
      _count: true,
    });
    const eng = new Map<string, number>();
    for (const v of votes) {
      const w = v.type === 'USEFUL' ? 3 : 1;
      eng.set(v.reviewId, (eng.get(v.reviewId) ?? 0) + w * v._count);
    }
    const cms = await this.prisma.comment.groupBy({
      by: ['reviewId'],
      where: { reviewId: { in: ids } },
      _count: true,
    });
    for (const c of cms) eng.set(c.reviewId, (eng.get(c.reviewId) ?? 0) + 2 * c._count);

    // is this the author's FIRST post ever? (cold-start reach rule)
    const authorIds = [...new Set(fresh.map((r) => r.userId))];
    const authorCounts = await this.prisma.review.groupBy({
      by: ['userId'],
      where: { userId: { in: authorIds } },
      _count: true,
    });
    const postCount = new Map(authorCounts.map((a) => [a.userId, a._count]));

    // viewer's taste: top categories from their own ratings + onboarding quiz
    const mine = await this.prisma.review.findMany({
      where: { userId: viewerId },
      select: { listing: { select: { category: true } } },
    });
    const catCnt = new Map<string, number>();
    for (const m of mine) {
      const cat = m.listing?.category?.toLowerCase();
      if (cat) catCnt.set(cat, (catCnt.get(cat) ?? 0) + 1);
    }
    const viewer = await this.prisma.user.findUnique({
      where: { id: viewerId },
      select: { preferences: true },
    });
    for (const k of (((viewer?.preferences as any)?.categories ?? []) as string[])) {
      catCnt.set(k.toLowerCase(), (catCnt.get(k.toLowerCase()) ?? 0) + 2);
    }
    const topCats = new Set(
      [...catCnt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k),
    );
    const followed = new Set(
      (
        await this.prisma.follow.findMany({
          where: { followerId: viewerId },
          select: { followingId: true },
        })
      ).map((f) => f.followingId),
    );

    const now = Date.now();
    const scored = fresh
      .map((r) => {
        const textQ = Math.min(1, (r.text?.trim().length ?? 0) / 200) * 0.5;
        const engQ = Math.min(1, Math.log1p(eng.get(r.id) ?? 0) / Math.log1p(20)) * 0.5;
        const quality = 0.25 + textQ + engQ; // photo is guaranteed here → base 0.25
        const cat = (r.listing?.category ?? '').toLowerCase();
        const taste = topCats.size === 0 ? 1 : topCats.has(cat) ? 1.5 : 0.8;
        const ageDays = (now - r.createdAt.getTime()) / 86_400_000;
        const freshness = Math.exp(-ageDays / 7) + 0.05; // old posts never hit exactly 0
        const firstPost = (postCount.get(r.userId) ?? 99) === 1 && ageDays < 3 ? 5 : 1;
        const isFriend = followed.has(r.userId);
        const follow = isFriend ? 2 : 1;
        return { r, isFriend, score: quality * taste * freshness * firstPost * follow };
      })
      // FRIENDS STRICTLY FIRST, then everyone else by the recommendation score
      // (owner rule 13.07.2026: сначала друзей, потом рандомные по рекомендациям)
      .sort((a, b) => Number(b.isFriend) - Number(a.isFriend) || b.score - a.score);

    if (recycled) {
      for (let i = scored.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [scored[i], scored[j]] = [scored[j], scored[i]];
      }
    }
    const maxScore = Math.max(1e-9, ...scored.map((x) => x.score));
    const page = scored.slice(0, recycled ? 100 : Number(take)).map((x) => {
      (x.r as any).isFriend = x.isFriend;
      // unified 0..1 score — rec CARDS compete with posts on equal footing
      // (owner 17.07.2026: если карточка подходит больше — она выше поста друга)
      (x.r as any).normScore = x.score / maxScore;
      return x.r;
    });
    for (const r of page) (r as any).recycled = recycled; // client-side session dedupe hint
    // record the delivery — these will never be served to this viewer again
    // (recycled pages are already recorded — skip the write)
    if (page.length && !recycled) {
      await this.prisma.feedImpression
        .createMany({
          data: page.map((r) => ({ userId: viewerId, reviewId: r.id })),
          skipDuplicates: true,
        })
        .catch(() => {});
    }
    await this.attachVenuesToReviews(page);
    await this.attachCommentPreview(page);
    await this.attachVoteCounts(page, viewerId);
    // text-only posts fall back to the ITEM's card photo; after the stock purge
    // that may be null while the menu LINKS still hold the venue's aigen photo —
    // use it (prefer the venue the review was tasted at) so posts never go blank
    const needPhoto = page.filter((r: any) => !(r.photoUrls?.length) && r.listing && !r.listing.photoUrl);
    if (needPhoto.length) {
      const itemIds = [...new Set(needPhoto.map((r: any) => r.listingId))];
      const links = await this.prisma.menuLink.findMany({
        where: { itemId: { in: itemIds }, photoUrl: { not: null } },
        select: { itemId: true, venueId: true, photoUrl: true },
      });
      const byItem = new Map<string, { venueId: string; photoUrl: string | null }[]>();
      for (const l of links) (byItem.get(l.itemId) ?? byItem.set(l.itemId, []).get(l.itemId)!).push(l);
      for (const r of needPhoto as any[]) {
        const ls = byItem.get(r.listingId);
        if (!ls?.length) continue;
        const vid = (r.attributes as any)?.venueId;
        r.listing.photoUrl = (vid && ls.find((l) => l.venueId === vid)?.photoUrl) || ls[0].photoUrl;
      }
    }
    return page;
  }

  /** Activity wall: recent user posts. ONLY reviews where the user uploaded their OWN
   *  photo — a rating without a photo never shows in the recommendation feed. (The
   *  item's own internet-sourced photo is for its card, not the feed.) */
  async feed(take = 20) {
    const list = await this.prisma.review.findMany({
      where: {
        status: 'APPROVED',
        photoUrls: { isEmpty: false },
      },
      include: { user: true, listing: true },
      orderBy: { createdAt: 'desc' },
      take: Number(take),
    });
    await this.attachVenuesToReviews(list);
    await this.attachCommentPreview(list);
    await this.attachVoteCounts(list);
    return list;
  }

  /** Adds reaction counts (👍😄😎🙀) to each review so the feed shows them. */
  async attachVoteCounts(reviews: any[], viewerId?: string | null) {
    const ids = reviews.map((r) => r.id);
    if (!ids.length) return;
    const [grouped, mine] = await Promise.all([
      this.prisma.reviewVote.groupBy({
        by: ['reviewId', 'type'],
        where: { reviewId: { in: ids } },
        _count: true,
      }),
      // the viewer's OWN votes ride along, so hearts/likes are lit on first
      // render — no lazy per-review fetch (Codex P0: лайк «не показан» до тапа)
      viewerId
        ? this.prisma.reviewVote.findMany({
            where: { reviewId: { in: ids }, userId: viewerId },
            select: { reviewId: true, type: true },
          })
        : Promise.resolve([] as { reviewId: string; type: string }[]),
    ]);
    const vmap: Record<string, Record<string, number>> = {};
    for (const g of grouped) {
      (vmap[g.reviewId] ??= { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 })[g.type] = g._count;
    }
    const mineMap = new Map<string, string[]>();
    for (const m of mine) (mineMap.get(m.reviewId) ?? mineMap.set(m.reviewId, []).get(m.reviewId)!).push(m.type);
    for (const r of reviews) {
      r.voteCounts = vmap[r.id] ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 };
      r.myVotes = mineMap.get(r.id) ?? [];
    }
  }

  /** Adds commentCount + the first comment to each review (feed preview). */
  async attachCommentPreview(reviews: any[]) {
    const ids = reviews.map((r) => r.id);
    if (!ids.length) return;
    const comments = await this.prisma.comment.findMany({
      // held comments never reach the feed preview either
      where: { reviewId: { in: ids }, status: 'APPROVED' },
      include: { user: { select: { id: true, firstName: true, username: true, photoUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const byReview = new Map<string, any[]>();
    for (const c of comments) {
      if (!byReview.has(c.reviewId)) byReview.set(c.reviewId, []);
      byReview.get(c.reviewId)!.push(c);
    }
    for (const r of reviews) {
      const arr = byReview.get(r.id) ?? [];
      r.commentCount = arr.length;
      r.topComment = arr[0] ?? null;
    }
  }

  /** Tags each dish/drink review with the venue the user tasted at (or a menu link). */
  private async attachVenuesToReviews(reviews: any[]) {
    const items = reviews.filter((r) => r.listing && r.listing.type !== 'RESTAURANT');
    if (items.length === 0) return;
    const explicitIds = [
      ...new Set(items.map((r) => (r.attributes as any)?.venueId).filter(Boolean)),
    ] as string[];
    const venueById = new Map<string, { id: string; name: string }>();
    if (explicitIds.length) {
      const vs = await this.prisma.listing.findMany({
        where: { id: { in: explicitIds } },
        select: { id: true, name: true },
      });
      for (const v of vs) venueById.set(v.id, v);
    }
    const links = await this.prisma.menuLink.findMany({
      where: { itemId: { in: items.map((r) => r.listing.id) } },
      include: { venue: true },
    });
    const venueByItem = new Map<string, { id: string; name: string }>();
    const photosByItem = new Map<string, { venueId: string; photoUrl: string }[]>();
    for (const l of links) {
      if (l.venue && !venueByItem.has(l.itemId)) {
        venueByItem.set(l.itemId, { id: l.venue.id, name: l.venue.name });
      }
      if (l.photoUrl) {
        const photos = photosByItem.get(l.itemId) ?? [];
        photos.push({ venueId: l.venueId, photoUrl: l.photoUrl });
        photosByItem.set(l.itemId, photos);
      }
    }
    for (const r of reviews) {
      const vid = (r.attributes as any)?.venueId;
      if (vid && venueById.has(vid)) r.venue = venueById.get(vid);
      else if (r.listing && venueByItem.has(r.listing.id)) r.venue = venueByItem.get(r.listing.id);
      if (r.listing && !r.listing.photoUrl) {
        const photos = photosByItem.get(r.listing.id) ?? [];
        const picked =
          (vid && photos.find((photo) => photo.venueId === vid)) ||
          photos.find((photo) => photo.photoUrl.startsWith('/api/files/aigen-')) ||
          photos[0];
        if (picked) r.listing.photoUrl = picked.photoUrl;
      }
    }
  }

  private esc(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Reverse-geocode coords → "street, house" via OSM Nominatim (free, no key).
  private async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=1&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'togomoscow/1.0 (tasting club; reznik.kiri@gmail.com)' },
      });
      if (!res.ok) return null;
      const d: any = await res.json();
      const a = d.address ?? {};
      const line = [a.road, a.house_number].filter(Boolean).join(', ');
      return line || (d.display_name ?? '').split(',').slice(0, 2).join(',').trim() || null;
    } catch {
      return null;
    }
  }

  // Backfill street addresses for a chain's points, throttled to respect the
  // Nominatim usage policy (~1 req/sec). Fire-and-forget; persists for next time.
  private async fillBranchAddresses(branches: any[]) {
    const missing = branches.filter((b) => !b.address && b.lat != null && b.lng != null).slice(0, 25);
    for (const b of missing) {
      const addr = await this.reverseGeocode(b.lat, b.lng);
      if (addr) {
        b.address = addr;
        await this.prisma.listing.update({ where: { id: b.id }, data: { address: addr } }).catch(() => {});
      }
      await new Promise((r) => setTimeout(r, 1100));
    }
  }

  // one regex per query word, each across RU↔EN transliterations.
  //  • long words (≥5 chars, e.g. "капуч", "эспре") → word-START prefix, so "капуч"
  //    still finds "Матча капучино".
  //  • short words (≤4 chars, e.g. "раф", "чай") → only a WHOLE word or the NAME's
  //    leading word. This stops "раф" from hitting the inner prefix of an unrelated
  //    word — "рафаэлло" or "гРАФ Орлов" — while still matching "Раф", "Раф кофе".
  //  NB: we build boundaries from an explicit Cyrillic+Latin letter class (WORD_CH),
  //  NOT Postgres's \m/\M — those are treated as literal m/M here (their regex
  //  word-char class is ASCII-only), which silently broke Cyrillic word matching.
  private wordRegexes(q: string): string[] {
    const words = (q ?? '')
      .toLowerCase()
      .replace(NAME_STRIP_RE, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const B = `[^${WORD_CH}]`; // a non-word char (word boundary)
    return words.map((w) => {
      const variants = [...new Set([w, ruToLat(w), latToRu(w)].filter(Boolean))];
      const short = w.length <= 4;
      const parts = variants.map((v) => {
        const e = this.esc(v);
        // whole word anywhere: (start|non-word) word (non-word|end)
        const whole = `(^|${B})${e}(${B}|$)`;
        // word-start prefix anywhere: (start|non-word) word
        const prefix = `(^|${B})${e}`;
        // short → leading word of the name (^word) OR a whole word; long → any word-start
        return short ? `(^${e}|${whole})` : prefix;
      });
      return '(' + parts.join('|') + ')';
    });
  }

  // SQL condition: name (and optionally aliases) matches the query words.
  // join='AND' → all words (precise); join='OR' → any word (fallback).
  private matchCond(query: string, join: 'AND' | 'OR' = 'AND', withAliases = true): Prisma.Sql | null {
    const regs = this.wordRegexes(query);
    if (!regs.length) return null;
    const nm = Prisma.sql`regexp_replace(lower(name), ${NAME_STRIP_SQL}, '', 'g')`;
    const al = Prisma.sql`regexp_replace(lower(coalesce(aliases, '')), ${NAME_STRIP_SQL}, '', 'g')`;
    const conds = regs.map((rx) =>
      withAliases ? Prisma.sql`(${nm} ~* ${rx} OR ${al} ~* ${rx})` : Prisma.sql`${nm} ~* ${rx}`,
    );
    return Prisma.join(conds, ` ${join} `);
  }

  /** Listing ids matching every query word; with allowOr, falls back to ANY word,
   *  then to FUZZY trigram similarity (typos: "капучинно"→"Капучино", "еспрессо"→…). */
  private async matchingItemIds(types: string[], query: string, allowOr = true): Promise<string[]> {
    const run = async (join: 'AND' | 'OR') => {
      const cond = this.matchCond(query, join);
      if (!cond) return [] as { id: string }[];
      return this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM listings
        WHERE type::text = ANY(${types}) AND (${cond})
        LIMIT 300
      `;
    };
    let rows = await run('AND');
    if (rows.length === 0 && allowOr) rows = await run('OR'); // e.g. "пицца римская" → pizzas
    if (rows.length === 0) rows = await this.fuzzyIds(types, query); // typo tolerance
    return rows.map((r) => r.id);
  }

  /** Trigram-similarity fallback (pg_trgm) — catches misspellings the regex misses.
   *  Ranked by closeness; used ONLY when exact/partial matching finds nothing. */
  private async fuzzyIds(types: string[], query: string, limit = 60): Promise<{ id: string }[]> {
    const q = query.toLowerCase().trim();
    if (q.length < 3) return [];
    // also try RU↔EN transliterations so "cappuccino"→"капучино" fuzzy-matches too
    const a = latToRu(q); // Latin query → Cyrillic
    const b = ruToLat(q); // Cyrillic query → Latin
    try {
      return await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM listings
        WHERE type::text = ANY(${types})
          AND GREATEST(similarity(lower(name), ${q}), similarity(lower(name), ${a}), similarity(lower(name), ${b})) > 0.3
        ORDER BY GREATEST(similarity(lower(name), ${q}), similarity(lower(name), ${a}), similarity(lower(name), ${b})) DESC
        LIMIT ${limit}
      `;
    } catch {
      return [];
    }
  }

  /**
   * Smart personal feed: ranks dishes/drinks by what the user actually engages
   * with — categories they rate highly (weighted), recently viewed, quiz tastes —
   * minus what they rated already or swiped away. Content-based, works at 0 users.
   */
  async recommendedSmart(userId: string, recentCats: string[] = [], take = 30) {
    const [user, reviews, dislikes] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } }),
      this.prisma.review.findMany({
        where: { userId },
        select: { rating: true, listingId: true, listing: { select: { category: true, name: true } } },
      }),
      this.prisma.dislike.findMany({ where: { userId }, select: { itemId: true, category: true } }),
    ]);

    const quizKeys = (((user?.preferences as any)?.categories ?? []) as string[]).map((k) =>
      k.toLowerCase(),
    );
    const score = new Map<string, number>();
    const bump = (c: string | null | undefined, n: number) => {
      if (c) score.set(c, (score.get(c) ?? 0) + n);
    };
    for (const r of reviews) bump(r.listing?.category, r.rating >= 4 ? 3 : r.rating >= 3 ? 1 : 0);
    for (const c of recentCats) bump(c, 2); // recently viewed → boost
    for (const d of dislikes) bump(d.category, -2); // swiped away → penalise

    const exclude = [...new Set([...reviews.map((r) => r.listingId), ...dislikes.map((d) => d.itemId)])];
    const prefCats = [...score.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([c]) => c);

    // taste-cluster affinity: which clusters the user's well-rated items fall into
    const clusterScore = TASTE_CLUSTERS.map(() => 0);
    for (const r of reviews) {
      if (r.rating < 4 || !r.listing?.name) continue;
      const k = normKind(r.listing.name);
      const ci = TASTE_CLUSTERS.findIndex((c) => c.includes(k));
      if (ci >= 0) clusterScore[ci] += 1;
    }
    const clusterBonus = (name: string) => {
      const k = normKind(name);
      const ci = TASTE_CLUSTERS.findIndex((c) => c.includes(k));
      return ci >= 0 ? clusterScore[ci] * 2 : 0;
    };

    const or: Prisma.ListingWhereInput[] = [];
    if (prefCats.length) or.push({ category: { in: prefCats } });
    for (const k of quizKeys) {
      or.push({ category: { contains: k, mode: 'insensitive' } });
      or.push({ name: { contains: k, mode: 'insensitive' } });
    }
    const candidates = await this.prisma.listing.findMany({
      where: {
        type: { in: ['DISH', 'DRINK'] },
        id: { notIn: exclude },
        ...(or.length ? { OR: or } : {}),
      },
      take: 150,
    });
    // quiz-chosen categories get a baseline boost so they surface even with no reviews yet
    const quizBonus = (c: { category: string | null; name: string }) =>
      quizKeys.some(
        (k) =>
          (c.category ?? '').toLowerCase().includes(k) || (c.name ?? '').toLowerCase().includes(k),
      )
        ? 2
        : 0;
    const scored = candidates
      .map((c) => ({
        c,
        s: (score.get(c.category ?? '') ?? 0) + clusterBonus(c.name) + quizBonus(c) + Math.random(),
      }))
      .sort((a, b) => b.s - a.s);

    // diversity: round-robin across categories (best first) so the deck isn't all one thing
    const byCat = new Map<string, typeof candidates>();
    for (const x of scored) {
      const k = x.c.category ?? '';
      if (!byCat.has(k)) byCat.set(k, []);
      byCat.get(k)!.push(x.c);
    }
    const cats = [...byCat.keys()];
    const out: typeof candidates = [];
    while (out.length < take) {
      let added = false;
      for (const k of cats) {
        const arr = byCat.get(k)!;
        if (arr.length) {
          out.push(arr.shift()!);
          added = true;
          if (out.length >= take) break;
        }
      }
      if (!added) break;
    }
    return this.enrichCards(out);
  }

  /** Personalized picks: random dishes/drinks from the user's chosen categories. */
  async recommendedFor(cats: string[], take = 12) {
    const keys = cats.map((c) => c.trim().toLowerCase()).filter(Boolean);
    if (keys.length === 0) return [];
    const patterns = keys.map((k) => `%${k}%`);
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM listings
      WHERE type::text IN ('DISH', 'DRINK')
        AND (
          ${Prisma.join(
            patterns.map((p) => Prisma.sql`category ILIKE ${p} OR name ILIKE ${p}`),
            ' OR ',
          )}
        )
      ORDER BY RANDOM() LIMIT ${Number(take)}
    `;
    if (rows.length === 0) return [];
    const items = await this.prisma.listing.findMany({ where: { id: { in: rows.map((r) => r.id) } } });
    return this.enrichCards(items);
  }

  /**
   * Real places to taste a given dish/drink: explicit menu links first, then
   * venues matched by cuisine (or bar-type for drinks). Menu links are sparse,
   * so cuisine matching makes the catalog item feel grounded in real places.
   */
  async placesForItem(id: string, take = 4) {
    const item = await this.prisma.listing.findUnique({ where: { id } });
    if (!item) return [];

    const venues = new Map<string, any>();
    // 1) explicit, user-confirmed links
    const links = await this.prisma.menuLink.findMany({
      where: { status: 'APPROVED', itemId: id },
      include: { venue: true },
      take: 10,
    });
    for (const l of links) if (l.venue) venues.set(l.venue.id, l.venue);

    // 2) cuisine / bar-type matching
    const cfg = LISTINGS_CUISINE_FOR[(item.category ?? '').toLowerCase()];
    if (venues.size < take && cfg) {
      const conds: Prisma.Sql[] = [];
      for (const k of cfg.cuisine ?? []) conds.push(Prisma.sql`cuisine ILIKE ${`%${k}%`}`);
      if (cfg.barLike) conds.push(Prisma.sql`category IN ('Бар', 'Паб', 'Пивной сад')`);
      if (conds.length) {
        const rows = await this.prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM listings
          WHERE type = 'RESTAURANT'::"ListingType" AND (${Prisma.join(conds, ' OR ')})
          ORDER BY RANDOM() LIMIT ${Number(take) * 3}
        `;
        const more = await this.prisma.listing.findMany({ where: { id: { in: rows.map((r) => r.id) } } });
        for (const v of more) if (venues.size < take && !venues.has(v.id)) venues.set(v.id, v);
      }
    }
    return this.enrichCards([...venues.values()].slice(0, take));
  }

  /** Venues (restaurants) that serve a dish/drink matching the query (by word start). */
  async venuesServing(itemType: 'DISH' | 'DRINK', q?: string, take = 150) {
    const query = (q ?? '').trim();
    let where: Prisma.MenuLinkWhereInput;
    if (query) {
      const ids = await this.matchingItemIds([itemType], query);
      if (ids.length === 0) return [];
      where = { status: 'APPROVED', itemId: { in: ids } };
    } else {
      where = { status: 'APPROVED', item: { type: itemType } };
    }
    const links = await this.prisma.menuLink.findMany({ where, include: { venue: true }, take: 500 });
    const map = new Map<string, (typeof links)[number]['venue']>();
    for (const l of links) {
      if (l.venue && !map.has(l.venueId)) map.set(l.venueId, l.venue);
    }
    return this.enrichCards([...map.values()].slice(0, take));
  }

  /** Unified venue search: restaurants by name OR serving a matching dish/drink (word-start). */
  async searchVenues(q?: string, take = 50) {
    const query = (q ?? '').trim();
    if (!query) return [];
    const cond = this.matchCond(query);
    // a tag like "Бургеры" → match venues by cuisine (whole word, so "bar" ≠
    // "barbecue") or by category ("Бар"/"Паб"/"Фастфуд" are categories, not cuisines)
    const token = cuisineToken(query);
    const tagSql = token
      ? Prisma.sql`(cuisine ~* ${`(^|[^${WORD_CH}])${token}([^${WORD_CH}]|$)`} OR category ILIKE ${query})`
      : null;
    const nameOrCuisine = tagSql
      ? Prisma.sql`((${cond ?? Prisma.sql`false`}) OR ${tagSql})`
      : cond;
    const [byNameRows, itemIds] = await Promise.all([
      nameOrCuisine
        ? this.prisma.$queryRaw<{ id: string }[]>`
            SELECT id FROM listings
            WHERE type = 'RESTAURANT'::"ListingType" AND (${nameOrCuisine})
            LIMIT 60
          `
        : Promise.resolve([] as { id: string }[]),
      this.matchingItemIds(['DISH', 'DRINK'], query, false),
    ]);
    // nothing matched by name or by a served item → fuzzy-match venue names (typos)
    let venueNameIds = byNameRows.map((r) => r.id);
    if (venueNameIds.length === 0 && itemIds.length === 0) {
      venueNameIds = (await this.fuzzyIds(['RESTAURANT'], query, 30)).map((r) => r.id);
    }
    const byName = await this.prisma.listing.findMany({
      where: { id: { in: venueNameIds } },
    });
    const links = itemIds.length
      ? await this.prisma.menuLink.findMany({
          where: { status: 'APPROVED', itemId: { in: itemIds } },
          include: { venue: true },
          take: 300,
        })
      : [];
    const map = new Map<string, (typeof byName)[number]>();
    for (const v of byName) map.set(v.id, v);
    for (const l of links) if (l.venue && !map.has(l.venueId)) map.set(l.venueId, l.venue);

    // collapse chain branches into ONE card (keep best-rated as representative)
    const chains = new Map<string, any>();
    for (const v of map.values()) {
      const key = (v.groupKey || v.name).toLowerCase().trim();
      const ex = chains.get(key);
      if (ex) {
        ex.branchCount = (ex.branchCount ?? 1) + 1;
        if (v.reviewCount > ex.reviewCount) {
          ex.id = v.id; // representative = most-reviewed branch
          ex.address = v.address;
        }
      } else {
        chains.set(key, { ...v, groupKey: v.groupKey || key, branchCount: 1 });
      }
    }
    const cards = await this.enrichCards([...chains.values()].slice(0, take));
    // badge venues that serve a matching dish/drink with THAT item's rating,
    // so the Рестораны tab shows "Раф ★ …" (the "с пометкой" requirement).
    if (itemIds.length) {
      const items = await this.prisma.listing.findMany({
        where: { id: { in: itemIds } },
        select: { id: true, name: true },
      });
      await this.attachMatchedItem(cards, items, query.toLowerCase().trim());
    }
    return cards;
  }

  /**
   * Unified search (no category chosen): the matching dish/drink itself comes
   * FIRST, then venues (by name or that serve a matching item). So "Stella
   * Artois" returns the beer, then bars that pour it.
   */
  async searchAll(q?: string, take = 50) {
    const query = (q ?? '').trim();
    if (!query) return [];
    // 1) exact matches first: items matching ALL words + venues by name
    let [itemIds, venues] = await Promise.all([
      this.matchingItemIds(['DISH', 'DRINK'], query, false), // strict (no OR)
      this.searchVenues(query),
    ]);
    // 2) only if NOTHING exact, fall back to loose (any-word) item matches
    if (itemIds.length === 0 && venues.length === 0) {
      itemIds = await this.matchingItemIds(['DISH', 'DRINK'], query, true);
    }
    const items = itemIds.length
      ? await this.prisma.listing.findMany({ where: { id: { in: itemIds } } })
      : [];
    const itemCards = await this.enrichCards(items);
    const venueIds = new Set(venues.map((v) => v.id));
    const combined = [...venues, ...itemCards.filter((i) => !venueIds.has(i.id))];
    // rank by how closely the NAME matches the query, so the EXACT card wins first
    // (search "пепперони" → the Пепперони dish, THEN venues that merely serve it;
    //  search "Кофемания" → the venue, then its dishes). Venues get a small tiebreak
    // at equal name-match so a venue named X beats a dish named X.
    const ql = query.toLowerCase().trim();
    const nameScore = (name?: string | null) => {
      const n = (name ?? '').toLowerCase().trim();
      if (n === ql) return 3;
      if (n.startsWith(ql)) return 2;
      if (n.includes(ql)) return 1;
      return 0; // matched only via relation (e.g. venue serving the dish)
    };
    // INTENT by type (priority #2): if the query name-matches more items than venues,
    // it's a dish/drink query → items lead even when a venue is *named* after the dish
    // ("Матча"/"Цезарь"/"Стейк" venues no longer bury the dish). Vice-versa for venues.
    const strong = (c: any) => nameScore(c.name) >= 2; // exact or prefix
    const itemHits = combined.filter((c) => c.type !== 'RESTAURANT' && strong(c)).length;
    const venueHits = combined.filter((c) => c.type === 'RESTAURANT' && strong(c)).length;
    const intent: 'item' | 'venue' | null = itemHits > venueHits ? 'item' : venueHits > itemHits ? 'venue' : null;

    // composite relevance: exact name ≫ intent-type ≫ fuzzy similarity ≫ popularity ≫ rating
    const rank = (c: any) => {
      const isVenue = c.type === 'RESTAURANT';
      const exact = nameScore(c.name); // 0..3
      const sim = nameSim(c.name ?? '', ql); // 0..1 — surfaces the typo'd item card first
      const pop = Math.log1p(c.reviewCount ?? 0);
      const rat = (c.avgRating ?? 0) / 5;
      const intentBonus = intent ? (((intent === 'venue') === isVenue) ? 15 : 0) : isVenue ? 0.2 : 0;
      return exact * 100 + intentBonus + sim * 45 + pop * 2 + rat;
    };
    combined.sort((a, b) => rank(b) - rank(a));
    const result = combined.slice(0, take);

    // Attach the SEARCHED item's rating AT each venue (the "с пометкой" badge).
    if (items.length) await this.attachMatchedItem(result, items, ql);
    return result;
  }

  /**
   * For a list of venue cards + the dish/drink items a query matched, attach to each
   * venue the SEARCHED item's rating AT that venue: `matchedItem = {name, rating, count}`
   * (rating null when nobody rated it there yet → the card shows an empty template).
   * Used by both searchAll and searchVenues so the badge appears in every search path.
   */
  private async attachMatchedItem(venues: any[], items: { id: string; name: string }[], ql: string) {
    const ids = items.map((i) => i.id);
    if (!ids.length || !venues.length) return;
    const nameById = new Map(items.map((i) => [i.id, i.name]));
    const [links, agg] = await Promise.all([
      this.prisma.menuLink.findMany({
        where: { status: 'APPROVED', itemId: { in: ids } },
        select: { venueId: true, itemId: true },
      }),
      this.prisma.$queryRaw<{ vid: string; lid: string; avg: number; c: number }[]>`
        SELECT attributes->>'venueId' AS vid, listing_id AS lid, AVG(rating)::float AS avg, COUNT(*)::int AS c
        FROM reviews
        WHERE status = 'APPROVED' AND listing_id IN (${Prisma.join(ids)}) AND attributes->>'venueId' IS NOT NULL
        GROUP BY attributes->>'venueId', listing_id`,
    ]);
    const rateAt = new Map<string, { avg: number; c: number }>();
    for (const a of agg) rateAt.set(`${a.vid}|${a.lid}`, { avg: a.avg, c: a.c });
    // candidate (venue → item) pairs from BOTH the menu links AND actual ratings
    // (a venue rated for an item clearly serves it, even without an approved link)
    const pairs = new Map<string, Set<string>>();
    const addPair = (vid: string, itemId: string) => {
      (pairs.get(vid) ?? pairs.set(vid, new Set()).get(vid))!.add(itemId);
    };
    for (const l of links) addPair(l.venueId, l.itemId);
    for (const a of agg) addPair(a.vid, a.lid);
    // per venue, pick the item that best matches the QUERY name, then the most-rated
    const venueItem = new Map<string, { itemId: string; avg: number | null; c: number }>();
    for (const [vid, set] of pairs) {
      let best: { itemId: string; avg: number | null; c: number; score: number } | null = null;
      for (const itemId of set) {
        const r = rateAt.get(`${vid}|${itemId}`);
        const score = nameSim(nameById.get(itemId) ?? '', ql) * 10 + (r?.c ?? 0);
        if (!best || score > best.score) best = { itemId, avg: r?.avg ?? null, c: r?.c ?? 0, score };
      }
      if (best) venueItem.set(vid, best);
    }
    for (const c of venues as any[]) {
      if (c.type !== 'RESTAURANT') continue;
      const vi = venueItem.get(c.id);
      // only badge a venue that actually maps to one of the matched items
      if (vi) c.matchedItem = { name: nameById.get(vi.itemId) ?? '', rating: vi.avg, count: vi.c };
    }
  }

  /** Photo-recognition hook: item ids whose name matches a (translated) query.
   *  Reuses the same RU/EN/typo-tolerant matcher as search. Returns [{id}]. */
  async recognizeSearch(query: string, type?: 'DISH' | 'DRINK', limit = 20): Promise<{ id: string }[]> {
    const q = (query ?? '').trim();
    if (!q) return [];
    const types = type ? [type] : ['DISH', 'DRINK'];
    const ids = await this.matchingItemIds(types, q, true);
    return ids.slice(0, limit).map((id) => ({ id }));
  }

  /** Search dishes/drinks by name (word-start), e.g. "Блюда" + query. */
  async searchItems(type: 'DISH' | 'DRINK', q?: string, take = 50) {
    const query = (q ?? '').trim();
    if (!query) return [];
    const ids = await this.matchingItemIds([type], query);
    if (ids.length === 0) return [];
    const items = await this.prisma.listing.findMany({ where: { id: { in: ids } }, take });
    return this.enrichCards(items);
  }

  /** Beers whose reviews carry the given flavor/serving tags (JSONB ?| any-of). */
  async beerByTags(tags: string[], take = 60) {
    if (!tags.length) return [];
    // reviews that used the beer template and whose flavor OR serving tags overlap
    const rows = await this.prisma.$queryRaw<{ listing_id: string }[]>`
      SELECT DISTINCT listing_id FROM reviews
      WHERE status = 'APPROVED'
        AND attributes->>'template' = 'beer'
        AND (
          attributes->'choices'->'flavor' ?| ${tags}::text[]
          OR attributes->'choices'->'serving' ?| ${tags}::text[]
        )
      LIMIT ${Number(take)}`;
    const ids = rows.map((r) => r.listing_id);
    if (!ids.length) return [];
    const items = await this.prisma.listing.findMany({ where: { id: { in: ids } } });
    return this.enrichCards(items);
  }

  /** Search-bar autocomplete: venue + dish/drink name suggestions (word-start).
   *  Returns a specific `icon` kind (coffee/wine/beer/drink/dish/cafe/bar/restaurant)
   *  so the UI can show the right entity emoji next to each suggestion. */
  async suggest(q?: string) {
    const query = (q ?? '').trim();
    const empty = [] as { name: string; kind: string; icon: string }[];
    if (query.length < 1) return empty;
    const cond = this.matchCond(query);
    if (!cond) return empty;
    const [venues, items] = await Promise.all([
      this.prisma.$queryRaw<{ name: string; category: string | null }[]>`
        SELECT DISTINCT name, category FROM listings
        WHERE type = 'RESTAURANT'::"ListingType" AND (${cond}) LIMIT 6`,
      this.prisma.$queryRaw<{ name: string; type: string; category: string | null }[]>`
        SELECT DISTINCT name, type::text AS type, category FROM listings
        WHERE type::text IN ('DISH', 'DRINK') AND (${cond}) LIMIT 6`,
    ]);
    const venueIcon = (c?: string | null) =>
      /кофейн|coffee/i.test(c ?? '') ? 'coffee' : /кафе|cafe/i.test(c ?? '') ? 'cafe' : /бар|паб|\bbar\b|pub/i.test(c ?? '') ? 'bar' : 'restaurant';
    const itemIcon = (t: string, c?: string | null) =>
      t === 'DRINK'
        ? (/кофе|coffee|латте|капучино|эспрессо|раф|американо/i.test(c ?? '') ? 'coffee'
          : /вино|wine/i.test(c ?? '') ? 'wine'
          : /пиво|beer|эль|лагер/i.test(c ?? '') ? 'beer'
          : /чай|tea|матч/i.test(c ?? '') ? 'tea' : 'drink')
        : 'dish';
    const out: { name: string; kind: string; icon: string }[] = [];
    const seen = new Set<string>();
    for (const v of venues) {
      if (!seen.has(v.name)) { seen.add(v.name); out.push({ name: v.name, kind: 'venue', icon: venueIcon(v.category) }); }
    }
    for (const i of items) {
      if (!seen.has(i.name)) { seen.add(i.name); out.push({ name: i.name, kind: 'item', icon: itemIcon(i.type, i.category) }); }
    }
    return out.slice(0, 8);
  }

  /** Name suggestions for the add-item autocomplete (word-start match). */
  async suggestItems(type: 'DISH' | 'DRINK', q?: string) {
    const query = (q ?? '').trim();
    if (query.length < 1) return [];
    const cond = this.matchCond(query);
    if (!cond) return [];
    const rows = await this.prisma.$queryRaw<{ name: string }[]>`
      SELECT DISTINCT name FROM listings
      WHERE type = ${type}::"ListingType" AND (${cond})
      LIMIT 8
    `;
    return rows.map((r) => r.name);
  }

  /** Lightweight points for the map: only id/name/coords/type, coords present. */
  geo() {
    return this.prisma.listing.findMany({
      where: { lat: { not: null }, lng: { not: null } },
      select: { id: true, name: true, lat: true, lng: true, type: true },
    });
  }

  /** Items with ZERO user reviews — "станьте первым дегустатором" (gamification).
   *  Only real cards: with a photo and served somewhere; random pick per visit. */
  async firstTasterItems(take = 8) {
    // hard rules from the owner: venue attachment AND a price — no exceptions;
    // plus the permanent non-standalone ban (sauces/bread/ingredients never here)
    const rows = await this.prisma.$queryRaw<{ id: string; name: string }[]>`
      SELECT l.id, l.name FROM listings l
      WHERE l.type::text IN ('DISH','DRINK')
        AND l.review_count = 0
        AND l.photo_url IS NOT NULL
        AND EXISTS (SELECT 1 FROM menu_links m WHERE m.item_id = l.id AND m.status = 'APPROVED' AND m.price IS NOT NULL)
      ORDER BY RANDOM() LIMIT ${Number(take) * 4}`;
    const picked = rows.filter((r) => !isNonStandalone(r.name)).slice(0, Number(take));
    if (!picked.length) return [];
    const items = await this.prisma.listing.findMany({
      where: { id: { in: picked.map((r) => r.id) } },
      include: {
        servedAt: {
          where: { status: 'APPROVED', price: { not: null } },
          select: { venue: { select: { id: true, name: true } }, price: true },
          take: 1,
        },
      },
    });
    const enriched = await this.enrichCards(items);
    // zero-review cards have no bestVenue — surface the menu-link venue + price
    // (the owner's rule: every discovery card names its place and its price)
    return enriched.map((l: any) => ({
      ...l,
      recVenue: l.servedAt?.[0]
        ? { id: l.servedAt[0].venue.id, name: l.servedAt[0].venue.name, price: l.servedAt[0].price }
        : null,
      servedAt: undefined,
    }));
  }

  /** "Топ-10 мест за неделю" — restaurants ranked by rating. */
  async topWeekly(take = 10) {
    const rows = await this.prisma.listing.findMany({
      where: { type: 'RESTAURANT' },
      orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
      take,
    });
    return this.enrichCards(rows);
  }

  async byId(id: string, viewerId?: string | null) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        reviews: {
          where: { status: 'APPROVED' },
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!listing) return null;

    // count a profile view (fire-and-forget — owner analytics)
    this.prisma.listing
      .update({ where: { id }, data: { views: { increment: 1 } } })
      .catch(() => {});

    // lazily resolve a street address from coords (OSM has only ~10% of them).
    // Done on open + persisted, so it's policy-friendly (only viewed venues).
    if (listing.type === 'RESTAURANT' && !listing.address && listing.lat != null && listing.lng != null) {
      const addr = await this.reverseGeocode(listing.lat, listing.lng);
      if (addr) {
        listing.address = addr;
        this.prisma.listing.update({ where: { id }, data: { address: addr } }).catch(() => {});
      }
    }

    let topDishes: unknown[] = [];
    let topDrinks: unknown[] = [];
    let venues: unknown[] = [];
    let pendingItems: unknown[] = [];
    let itemLinks: { venueId: string; photoUrl: string | null }[] = [];

    if (listing.type === 'RESTAURANT') {
      const links = await this.prisma.menuLink.findMany({
        where: { venueId: id },
        include: { item: true },
      });
      const approved = links.filter((l) => l.status === 'APPROVED');
      // a chain shares one menu AND one set of ratings: count reviews tasted at
      // ANY branch of the chain, not just this point.
      const chainWhere = listing.groupKey
        ? { groupKey: listing.groupKey, type: 'RESTAURANT' as const }
        : { groupKey: null, name: { equals: listing.name, mode: 'insensitive' as const }, type: 'RESTAURANT' as const };
      const chainVenueIds = new Set(
        (await this.prisma.listing.findMany({ where: chainWhere, select: { id: true } })).map((b) => b.id),
      );
      chainVenueIds.add(id);
      // community price/count: from APPROVED reviews left at this chain
      const itemIds = approved.map((l) => l.item.id);
      const venueReviews = itemIds.length
        ? await this.prisma.review.findMany({
            where: { status: 'APPROVED', listingId: { in: itemIds } },
            select: { listingId: true, attributes: true, rating: true },
            orderBy: { createdAt: 'desc' },
          })
        : [];
      const priceByItem = new Map<string, number>();
      const countByItem = new Map<string, number>();
      const sumByItem = new Map<string, number>();
      for (const r of venueReviews) {
        const a = r.attributes as any;
        if (!chainVenueIds.has(a?.venueId)) continue; // reviews tasted at this chain
        countByItem.set(r.listingId, (countByItem.get(r.listingId) ?? 0) + 1);
        sumByItem.set(r.listingId, (sumByItem.get(r.listingId) ?? 0) + (r as any).rating);
        if (a?.price && !priceByItem.has(r.listingId)) priceByItem.set(r.listingId, Number(a.price));
      }
      const linkPrice = new Map(approved.map((l) => [l.item.id, l.price]));
      const buildItems = async (t: string) => {
        // pre-trim by global rating, then re-rank by rating AT THIS VENUE
        const raw = approved
          .filter((l) => l.item.type === t)
          .map((l) => l.item)
          .sort((a, b) => b.avgRating - a.avgRating)
          .slice(0, 20);
        const cards = await this.enrichCards(raw);
        const withRating = cards.map((c) => {
          const cnt = countByItem.get(c.id) ?? 0;
          return {
            ...c,
            // moderator/owner-set price wins; otherwise community price from reviews
            price: linkPrice.get(c.id) ?? priceByItem.get(c.id) ?? null,
            venueReviews: cnt,
            // average rating of THIS item AT THIS venue (not the global average)
            venueRating: cnt ? (sumByItem.get(c.id) ?? 0) / cnt : null,
          };
        });
        // carousel sorted by rating — best on the LEFT, descending (venue rating first,
        // then the item's global rating as a tiebreaker)
        withRating.sort(
          (a, b) => (b.venueRating ?? b.avgRating ?? 0) - (a.venueRating ?? a.avgRating ?? 0),
        );
        return withRating.slice(0, 8);
      };
      topDishes = await buildItems('DISH');
      topDrinks = await buildItems('DRINK');
      // user-proposed items awaiting owner approval (still reviewable)
      pendingItems = links.filter((l) => l.status === 'PENDING').map((l) => l.item);
    } else {
      const links = await this.prisma.menuLink.findMany({
        where: { itemId: id, status: 'APPROVED' },
        include: { venue: true },
      });
      itemLinks = links; // kept for the venue-photo rule below
      venues = links
        // keep the menu price so "Где попробовать" shows how much the item costs there
        .map((l) => ({ ...l.venue, menuPrice: l.price }))
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 8);
    }

    // attach vote counts (useful/funny/cool) to each review
    const reviewIds = listing.reviews.map((r) => r.id);
    const [grouped, mineVotes] = reviewIds.length
      ? await Promise.all([
          this.prisma.reviewVote.groupBy({
            by: ['reviewId', 'type'],
            where: { reviewId: { in: reviewIds } },
            _count: true,
          }),
          viewerId
            ? this.prisma.reviewVote.findMany({
                where: { reviewId: { in: reviewIds }, userId: viewerId },
                select: { reviewId: true, type: true },
              })
            : Promise.resolve([]),
        ])
      : [[], []];
    const vmap: Record<string, Record<string, number>> = {};
    for (const g of grouped as any[]) {
      (vmap[g.reviewId] ??= { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 })[g.type] = g._count;
    }
    const mineMap = new Map<string, string[]>();
    for (const m of mineVotes as any[]) (mineMap.get(m.reviewId) ?? mineMap.set(m.reviewId, []).get(m.reviewId)!).push(m.type);
    const reviews: any[] = listing.reviews.map((r) => ({
      ...r,
      voteCounts: vmap[r.id] ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
      myVotes: mineMap.get(r.id) ?? [],
    }));
    // the most USEFUL reviews lead (community-curated), recency breaks ties
    reviews.sort(
      (a, b) =>
        b.voteCounts.USEFUL - a.voteCounts.USEFUL ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // for a dish/drink, tag each review with the place the user tasted it at
    let tastedAt: any[] = [];
    let bestVenue: { name: string; rating: number; count: number } | null = null;
    if (listing.type !== 'RESTAURANT') {
      const venueIds = [
        ...new Set(reviews.map((r) => (r.attributes as any)?.venueId).filter(Boolean)),
      ] as string[];
      const vById = new Map<string, any>();
      if (venueIds.length) {
        const vs = await this.prisma.listing.findMany({ where: { id: { in: venueIds } } });
        for (const v of vs) vById.set(v.id, v);
      }
      const onlyVenue = (venues as any[]).length === 1 ? (venues[0] as any) : null;
      for (const r of reviews) {
        const vid = (r.attributes as any)?.venueId;
        const vname = (r.attributes as any)?.venueName;
        r.venue =
          (vid && vById.get(vid)) ||
          (vname ? { id: null, name: vname, pending: true } : null) ||
          onlyVenue;
      }

      // "Пробовали в" = full venue cards (rating + address + the price paid)
      const seenT = new Set<string>();
      const withId: any[] = [];
      for (const r of reviews) {
        const v = r.venue;
        if (!v) continue;
        const key = v.id ?? v.name;
        if (seenT.has(key)) continue;
        seenT.add(key);
        const price = (r.attributes as any)?.price ?? null;
        if (v.id) withId.push({ ...v, menuPrice: price });
        else tastedAt.push({ ...v, menuPrice: price });
      }
      const enriched = await this.enrichCards(withId);
      tastedAt = [...enriched, ...tastedAt];
      const tastedIds = new Set(tastedAt.map((v) => v.id).filter(Boolean));
      venues = (venues as { id: string }[]).filter((v) => !tastedIds.has(v.id));

      // best place to have this item — the venue where it's rated highest
      const byVenue = new Map<string, { sum: number; c: number }>();
      for (const r of reviews) {
        const vid = (r.attributes as any)?.venueId;
        if (!vid) continue;
        const e = byVenue.get(vid) ?? { sum: 0, c: 0 };
        e.sum += r.rating;
        e.c++;
        byVenue.set(vid, e);
      }
      // "Лучшие места": rate each venue by THIS item's rating there (not the venue's
      // general rating) and sort best-first — the core of the redesigned search.
      for (const v of tastedAt as any[]) {
        const e = v.id ? byVenue.get(v.id) : null;
        v.itemRating = e ? e.sum / e.c : null;
        v.itemReviewCount = e ? e.c : 0;
      }
      (tastedAt as any[]).sort(
        (a, b) => (b.itemRating ?? -1) - (a.itemRating ?? -1) || (b.itemReviewCount ?? 0) - (a.itemReviewCount ?? 0),
      );
      let top: { vid: string; avg: number; c: number } | null = null;
      for (const [vid, e] of byVenue) {
        const avg = e.sum / e.c;
        if (!top || avg > top.avg) top = { vid, avg, c: e.c };
      }
      if (top && vById.get(top.vid)) {
        bestVenue = { name: vById.get(top.vid).name, rating: top.avg, count: top.c };
      }
      // fallback: no per-item review data yet → the highest-rated venue serving it
      if (!bestVenue) {
        const ranked = [...(venues as any[]), ...tastedAt]
          .filter((v) => v && v.name && (v.reviewCount ?? 0) > 0)
          .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
        if (ranked.length) bestVenue = { name: ranked[0].name, rating: ranked[0].avgRating, count: ranked[0].reviewCount };
      }
      // OWNER RULE 16.07.2026: the detail photo is the photo of THIS venue's menu
      // link — exactly what the outer card shows. Priority: best venue's link,
      // then any link with a photo. Different venue → its own photo, by design.
      const linkByVenue = new Map(itemLinks.map((l) => [l.venueId, l.photoUrl]));
      const venuePhoto =
        (top && linkByVenue.get(top.vid)) ||
        (venues as any[]).map((v) => linkByVenue.get(v.id)).find(Boolean) ||
        itemLinks.map((l) => l.photoUrl).find(Boolean) ||
        null;
      if (venuePhoto) (listing as any).photoUrl = venuePhoto;
    }

    let openNow: boolean | null = null;
    if (listing.hours) {
      try {
        const oh = new (OpeningHours as any)(listing.hours);
        openNow = oh.getState(new Date());
      } catch {
        openNow = null;
      }
    }

    // chain aggregate (weighted) — so a branch can show both its own and the
    // network rating; the chain rating is the aggregate of all its points.
    // events: for a venue → its own posts; for a dish/drink → posts (from any
    // venue) that mention THIS item, shown as a carousel on the item card.
    let events: any[] = [];
    if (listing.type === 'RESTAURANT') {
      events = await this.prisma.venueEvent.findMany({
        where: { venueId: id },
        orderBy: { publishedAt: 'desc' },
        take: 12,
      });
    } else {
      const key = listing.name
        .split(/\s+/)
        .sort((a, b) => b.length - a.length)[0]
        ?.toLowerCase();
      if (key && key.length >= 4) {
        events = await this.prisma.venueEvent.findMany({
          where: {
            kind: 'dish',
            aiProcessed: true,
            // match on the new dish's NAME (title), so the item card only shows
            // venues where THIS dish is the new menu position — not any post that
            // happens to mention the word somewhere in its text
            title: { contains: key, mode: 'insensitive' },
            // only real post photos of the dish, never fetched stock images
            photoUrl: { not: null },
            NOT: [
              { photoUrl: { contains: 'pexels' } },
              { photoUrl: { contains: 'unsplash' } },
              { photoUrl: { contains: 'wikimedia' } },
              { photoUrl: { contains: 'pixabay' } },
            ],
          },
          orderBy: { publishedAt: 'desc' },
          take: 12,
          include: { venue: { select: { id: true, name: true, address: true, lat: true, lng: true } } },
        });
      }
    }
    // short location for each event's venue (address, else "Москва") — the item card
    // shows WHERE to try it, not the dish name again
    for (const e of events) {
      if (e.venue) e.venue.cityLabel = inMoscow(e.venue.lat, e.venue.lng) ? 'Москва' : undefined;
    }

    let chain: { avgRating: number; reviewCount: number; branchCount: number } | null = null;
    let branches: any[] = [];
    if (listing.type === 'RESTAURANT') {
      // siblings of the chain: by group_key, else by identical name (OSM chains)
      const where = listing.groupKey
        ? { groupKey: listing.groupKey }
        : { groupKey: null, name: { equals: listing.name, mode: 'insensitive' as const } };
      const all = await this.prisma.listing.findMany({
        where: { ...where, type: 'RESTAURANT' },
        orderBy: { reviewCount: 'desc' },
      });
      if (all.length > 1) {
        const rc = all.reduce((s, b) => s + b.reviewCount, 0);
        const w = all.reduce((s, b) => s + b.avgRating * b.reviewCount, 0);
        chain = { avgRating: rc ? w / rc : 0, reviewCount: rc, branchCount: all.length };
        // enrichCards adds cityLabel + placeholder photo so points render as full cards
        branches = await this.enrichCards(all.filter((b) => b.id !== id));
        // backfill missing street addresses in the background (throttled, persisted)
        if (branches.some((b: any) => !b.address)) void this.fillBranchAddresses(branches);
      }
    }

    // tags from category + cuisine (cuisine tokens normalized to readable RU labels)
    const tags = Array.from(
      new Set(
        [
          listing.category,
          ...(listing.cuisine
            ? listing.cuisine.split(',').map((s) => cuisineLabel(s.trim()))
            : []),
        ].filter((t): t is string => !!t),
      ),
    );

    // normalize the auto-generated "Кухня: <token>" description to readable labels
    let cleanDescription = listing.description;
    if (cleanDescription) {
      const m = cleanDescription.match(/^Кухня:\s*(.+)$/i);
      if (m) {
        cleanDescription =
          'Кухня: ' + m[1].split(',').map((s) => cuisineLabel(s.trim())).join(', ');
      }
    }

    // city label from coordinates (Moscow bounding box)
    const isMoscowVenue =
      listing.lat != null &&
      listing.lng != null &&
      listing.lat > 55.4 &&
      listing.lat < 56.05 &&
      listing.lng > 37.2 &&
      listing.lng < 37.95;
    const cityLabel = isMoscowVenue ? 'Москва' : listing.lat != null ? 'Не Москва' : null;

    // lightweight summary from available data (real AI summary = future, needs reviews + LLM)
    let summary: string | null = null;
    if (listing.reviewCount > 0) {
      const kind =
        listing.type === 'RESTAURANT' ? 'Заведение' : listing.type === 'DRINK' ? 'Напиток' : 'Блюдо';
      summary =
        `${kind} с оценкой ${listing.avgRating.toFixed(1)} по ${listing.reviewCount} отзыв.` +
        (tags.length ? ` Профиль: ${tags.join(', ')}.` : '');
    }

    // check-ins: count + recent real photos (used to replace stock placeholders)
    const checkinCount = await this.prisma.checkIn.count({ where: { listingId: id } });
    const checkinPhotoRows = await this.prisma.checkIn.findMany({
      where: { listingId: id, photoUrl: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: { photoUrl: true },
    });
    const checkinPhotos = checkinPhotoRows
      .map((r) => r.photoUrl)
      .filter((u): u is string => !!u);

    // illustrative stock placeholders — shown until REAL user photos exist
    // (seeded photoUrl is usually just a brand logo, so it doesn't count).
    const hasRealPhotos =
      checkinPhotos.length > 0 || reviews.some((r) => (r.photoUrls?.length ?? 0) > 0);
    const placeholderPhotos = hasRealPhotos
      ? []
      : placeholderKeys(listing.type, listing.category, listing.name, listing.id).map((k) => `/api/stock/${k}`);

    // "Похожие" — other venues with the same category/cuisine (People also viewed)
    let similar: unknown[] = [];
    if (listing.type === 'RESTAURANT') {
      const ors: Prisma.ListingWhereInput[] = [];
      if (listing.category) ors.push({ category: listing.category });
      if (listing.cuisine) {
        ors.push({
          cuisine: { contains: listing.cuisine.split(',')[0].trim(), mode: 'insensitive' },
        });
      }
      if (ors.length) {
        const sim = await this.prisma.listing.findMany({
          where: {
            type: 'RESTAURANT',
            id: { not: listing.id },
            ...(listing.groupKey ? { NOT: { groupKey: listing.groupKey } } : {}),
            OR: ors,
          },
          orderBy: [{ reviewCount: 'desc' }, { avgRating: 'desc' }],
          take: 8,
        });
        similar = await this.enrichCards(sim);
      }
    }

    // a random highlighted review (prefer the best ones with text) — shown as the
    // card's "featured" quote. Random so a different one pops up on each open.
    const withText = reviews.filter((r) => r.text && r.text.trim().length > 0);
    const best = withText.filter((r) => r.rating >= 4);
    const pool = best.length ? best : withText;
    const featuredReview = pool.length
      ? (() => {
          const r = pool[Math.floor(Math.random() * pool.length)];
          return {
            text: r.text,
            rating: r.rating,
            user: { firstName: r.user?.firstName ?? null, username: r.user?.username ?? null },
            venue: r.venue ?? null,
          };
        })()
      : null;

    // website / Telegram / VK links shown on the card
    const sources = await this.prisma.venueSource.findMany({
      where: { venueId: listing.id },
      select: { type: true, url: true },
    });
    const links: { website?: string; telegram?: string; vk?: string } = {};
    for (const s of sources) {
      if (s.type === 'telegram' && !links.telegram) links.telegram = s.url;
      else if (s.type === 'vk' && !links.vk) links.vk = s.url;
      else if (s.type === 'website' && !links.website) links.website = s.url;
    }
    if (!links.website && listing.website) links.website = listing.website;

    return {
      ...listing,
      description: cleanDescription,
      links,
      reviews,
      openNow,
      topDishes,
      topDrinks,
      venues,
      pendingItems,
      chain,
      branches,
      events,
      tags,
      cityLabel,
      summary,
      checkinCount,
      checkinPhotos,
      placeholderPhotos,
      featuredReview,
      tastedAt,
      bestVenue,
      similar,
    };
  }

  /** Link an existing dish/drink to a venue the user picked ("я пробовал это здесь"). */
  async linkItemToVenue(userId: string, itemId: string, venueId: string) {
    // a chain shares one menu — link the item to ALL branches (same group_key)
    const venue = await this.prisma.listing.findUnique({
      where: { id: venueId },
      select: { groupKey: true, name: true },
    });
    // branches of the chain: by group_key, else by identical name
    const where = venue?.groupKey
      ? { groupKey: venue.groupKey, type: 'RESTAURANT' as const }
      : { name: { equals: venue?.name ?? '', mode: 'insensitive' as const }, type: 'RESTAURANT' as const };
    const branchIds = (
      await this.prisma.listing.findMany({ where, select: { id: true } })
    ).map((b) => b.id);
    if (branchIds.length === 0) branchIds.push(venueId);
    for (const vid of branchIds) {
      await this.prisma.menuLink.upsert({
        where: { venueId_itemId: { venueId: vid, itemId } },
        create: { venueId: vid, itemId, status: 'APPROVED', addedByUserId: userId },
        update: {},
      });
    }
    return { ok: true };
  }

  // ---- Q&A (ask the community) ----
  questions(listingId: string) {
    return this.prisma.question.findMany({
      where: { listingId },
      include: {
        user: true,
        answers: { include: { user: true }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  askQuestion(userId: string, listingId: string, text: string) {
    return this.prisma.question.create({ data: { listingId, userId, text } });
  }

  answerQuestion(userId: string, questionId: string, text: string) {
    return this.prisma.answer.create({ data: { questionId, userId, text } });
  }

  // ---- check-in (geolocation-verified visit) ----
  async checkin(
    userId: string,
    listingId: string,
    dto: { lat?: number; lng?: number; photoUrl?: string; note?: string },
  ) {
    const venue = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { lat: true, lng: true },
    });
    if (!venue) throw new NotFoundException('Listing not found');

    // verify proximity when the client supplied coordinates and the venue is geo-located
    let distance: number | null = null;
    let verified = false;
    if (dto.lat != null && dto.lng != null && venue.lat != null && venue.lng != null) {
      distance = Math.round(haversineMeters(dto.lat, dto.lng, venue.lat, venue.lng));
      verified = distance <= CHECKIN_RADIUS_M;
    }

    const checkin = await this.prisma.checkIn.create({
      data: {
        listingId,
        userId,
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        photoUrl: dto.photoUrl ?? null,
        note: dto.note ?? null,
        verified,
      },
    });
    return { ...checkin, distance, verified, radius: CHECKIN_RADIUS_M };
  }

  /** A regular user proposes a dish/drink for a venue (PENDING until owner OKs). */
  // Fetch a real photo for a new item from Pexels (free, commercial use).
  private async fetchPexelsPhoto(query: string, locale?: string): Promise<string | null> {
    const key = process.env.PEXELS_API_KEY;
    if (!key) return null;
    try {
      const url =
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}` +
        `&per_page=1&orientation=landscape${locale ? `&locale=${locale}` : ''}`;
      const res = await fetch(url, { headers: { Authorization: key } });
      if (!res.ok) return null;
      const data: any = await res.json();
      const p = data.photos?.[0];
      return p?.src?.large ?? p?.src?.medium ?? null;
    } catch {
      return null;
    }
  }

  /** Ask the local LLM (Ollama) which category a dish/drink belongs to — handles
   *  brands (Corona Extra → Пиво) that keyword rules can't know. Graceful fallback. */
  private async ollamaCategory(name: string, type: 'DISH' | 'DRINK'): Promise<string | null> {
    const url = process.env.OLLAMA_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
    const cats =
      type === 'DRINK'
        ? 'Кофе, Чай, Коктейли, Вино, Пиво, Крепкие напитки, Безалкогольные, Смузи, Соки'
        : 'Завтраки, Супы, Салаты, Паста, Пицца, Бургеры, Стейки, Гриль, Морепродукты, Десерты, Выпечка, Фастфуд, Закуски, Японская, Грузинская, Русская, Итальянская';
    try {
      const res = await fetch(`${url}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          format: 'json',
          stream: false,
          options: { temperature: 0 },
          prompt: `Определи категорию позиции «${name}» (${type === 'DRINK' ? 'напиток' : 'блюдо'}) строго из списка: ${cats}. Учитывай известные бренды (Corona Extra — Пиво, Сибирская корона — Пиво). Верни СТРОГО JSON: {"category":"одно значение из списка"}`,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) return null;
      const d: any = await res.json();
      const c = JSON.parse(d.response)?.category;
      return typeof c === 'string' && c.trim() ? c.trim() : null;
    } catch {
      return null;
    }
  }

  /** Auto-category: fast keyword rules first, then the LLM for brands/unknowns. */
  private async inferCategory(name: string, type: 'DISH' | 'DRINK'): Promise<string> {
    const s = name.toLowerCase();
    const drink: [RegExp, string][] = [
      [/латте|капучин|эспрессо|американо|\bраф\b|макиато|кортадо|флэт.?уайт|\bкофе\b|мокко/, 'Кофе'],
      [/\bчай\b|матч|улун|пуэр/, 'Чай'],
      [/коктейл|мохито|маргарит|негрони|апероль|мартини|дайкири|спритц/, 'Коктейли'],
      [/вино|каберне|мерло|шардоне|совиньон|просекко|шампанск|рислинг|пино/, 'Вино'],
      [/пиво|лагер|\bэль\b|\bipa\b|стаут|портер|пилснер|вайс|пшеничн|сидр|корона/, 'Пиво'],
      [/виски|водка|\bром\b|\bджин\b|текил|коньяк|ликёр|бренди|самбука/, 'Крепкие напитки'],
      [/лимонад|\bсок\b|морс|компот|кола|вода|тоник/, 'Безалкогольные'],
      [/смузи|шейк/, 'Смузи'],
    ];
    const dish: [RegExp, string][] = [
      [/бургер/, 'Бургеры'], [/пицц/, 'Пицца'], [/паст|спагетти|карбонар|болонье|лазань/, 'Паста'],
      [/суши|ролл|сашими|поке/, 'Японская'], [/стейк|рибай|миньон/, 'Стейки'],
      [/салат|винегрет|цезарь/, 'Салаты'], [/\bсуп\b|борщ|солянк|окрошк|том.?ям/, 'Супы'],
      [/десерт|торт|чизкейк|тирамису|эклер|мороже|панна.?котт/, 'Десерты'],
      [/хачапур|хинкал/, 'Грузинская'], [/шаурм|шаверм|хот.?дог|наггетс|картофель фри/, 'Фастфуд'],
    ];
    for (const [re, c] of type === 'DRINK' ? drink : dish) if (re.test(s)) return c;
    return (await this.ollamaCategory(name, type)) || (type === 'DRINK' ? 'Напиток' : 'Блюдо');
  }

  async addItem(
    userId: string,
    venueId: string,
    dto: { type: 'DISH' | 'DRINK'; name: string; description?: string; photoUrl?: string; category?: string },
  ) {
    const type: ListingType = dto.type === 'DRINK' ? 'DRINK' : 'DISH';
    // names always start with a capital letter, whatever the user typed
    let name = dto.name.trim().replace(/\s+/g, ' ');
    name = name.charAt(0).toUpperCase() + name.slice(1);
    // sanity gate for user-added names: no profanity, no links/handles, must
    // contain letters, not a bare number/emoji ("Шефбургер" is fine)
    const BAD_NAME = /(?:\bхуй|хуё|пизд|\bебат|ебан|бляд|мудак|пидор|гандон|шлюх|наркот|героин|кокаин|марихуан)/i;
    const LINKY = /https?:\/\/|www\.|t\.me\/|@[a-z0-9_]{4,}/i;
    if (name.length < 2 || name.length > 60) throw new BadRequestException('Название: от 2 до 60 символов');
    if (!/[а-яёa-z]/i.test(name)) throw new BadRequestException('Название должно содержать буквы');
    if (BAD_NAME.test(name)) throw new BadRequestException('Недопустимое название');
    if (LINKY.test(name)) throw new BadRequestException('Ссылки в названии запрещены');
    // find-or-create: reuse an existing same-name item (e.g. tapping a "новинка"
    // twice, or a dish already in the catalog) instead of making duplicates.
    let item = await this.prisma.listing.findFirst({
      where: { type, name: { equals: name, mode: 'insensitive' } },
      orderBy: { reviewCount: 'desc' },
    });
    if (!item) {
      const category = dto.category?.trim() || (await this.inferCategory(name, type));
      let photoUrl = dto.photoUrl ?? null;
      if (!photoUrl) {
        photoUrl =
          (await this.fetchPexelsPhoto(name, 'ru-RU')) ??
          (await this.fetchPexelsPhoto(type === 'DRINK' ? 'drink' : 'food'));
      }
      item = await this.prisma.listing.create({
        data: { type, name, description: dto.description ?? null, photoUrl, category, groupKey: name.toLowerCase() },
      });
      // auto-generate its recognition embedding so photo-scan finds it immediately
      this.embedItemFireAndForget(item.id, [name, category].filter(Boolean).join('. '));
    }
    // ensure the venue↔item link exists (idempotent)
    await this.prisma.menuLink.upsert({
      where: { venueId_itemId: { venueId, itemId: item.id } },
      create: { venueId, itemId: item.id, status: 'PENDING', addedByUserId: userId },
      update: {},
    });
    return item;
  }

  /** Auto-generate a new item's recognition embedding (fire-and-forget, local Ollama).
   *  Inline to avoid a module cycle with VisionModule; the vision index picks it up. */
  private embedItemFireAndForget(id: string, text: string) {
    const url = process.env.OLLAMA_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
    fetch(`${url}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: text }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: any) => {
        const v = j?.embedding;
        if (Array.isArray(v) && v.length) {
          return this.prisma.listing.update({ where: { id }, data: { embedding: v, embeddingModel: model } });
        }
      })
      .catch(() => {});
  }
}
