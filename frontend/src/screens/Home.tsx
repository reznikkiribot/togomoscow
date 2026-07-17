import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { ListingCard } from '../components/ListingCard';
import { TasteHero } from '../components/TasteHero';
import { ListRow } from '../components/ListRow';
import { Stars } from '../components/Stars';
import { preloadListingPhotos, VenuePhoto } from '../components/VenuePhoto';
import { FeedPost } from '../components/FeedPost';
import { PhotoPostModal } from '../components/PhotoPostModal';
import { CommentsModal } from '../components/CommentsModal';
import { hasOpenModal } from '../modalEsc';
import { UserProfileModal } from '../components/People';
const ListingDetailModal = lazy(() => import('../components/ListingDetail').then((m) => ({ default: m.ListingDetailModal })));
import { Filters, type FilterState } from '../components/Filters';
import type { BrowseCat } from '../components/MapBrowse';
const MapBrowse = lazy(() => import('../components/MapBrowse').then((m) => ({ default: m.MapBrowse })));
const AddBusiness = lazy(() => import('../components/AddBusiness').then((m) => ({ default: m.AddBusiness })));
import { VenuePicker } from '../components/VenuePicker';
import { useFavorites } from '../hooks/useFavorites';
import { getRecent } from '../recent';
import { TrainingScale } from '../components/TrainingScale';
import { loadCategoryProgress } from '../categoryGate';
import { haptic } from '../telegram';
import { useSwipeBack } from '../swipeBack';
import { IcRestaurant, IcCoffee, IcCake, IcBar, IcDish, IcWine } from '../components/Icons';
import type { Listing, ListingType, Review, VenueEvent } from '../types';

type Cat = ListingType | 'ALL' | 'BAR' | 'CAFE' | 'COFFEE';

// non-standalone add-ons (sauces/bread/honey…) — the backend bans them
// permanently; this client net also catches stale cached decks (hc_feed_queue)
const NONSTD = /^соус([^а-яёa-z0-9]|$)|соус\)?$|кетчуп|майонез|горчиц|васаби|сироп|топпинг|посыпк|варень|сгущ[её]нк|сметан|гарнир|халапень|лаваш|гренк|сухарик|приправ|заправк|минеральн|аква минерале|бонаква|боржоми|нарзан|пеллегрино|(^|[^а-яёa-z0-9])(м[её]д|хлеб|зелень|лимон|лайм|молоко|сливки|сахар|л[её]д|рис|пюре|сыр|яйцо|бекон|вод[аы])([^а-яёa-z0-9]|$)/i;

// deterministic shuffle for a given seed → stable within a session, fresh per mount
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// one card per venue NAME and per dish title (collapses chains + identical posts
// shared across a restaurant group's channel)
function dedupeByVenue(events: VenueEvent[]): VenueEvent[] {
  const seenV = new Set<string>();
  const seenT = new Set<string>();
  return events.filter((e) => {
    const v = (e.venue?.name ?? e.venueId).toLowerCase();
    const t = (e.title ?? '').toLowerCase().trim();
    if (seenV.has(v) || (t && seenT.has(t))) return false;
    seenV.add(v);
    if (t) seenT.add(t);
    return true;
  });
}

type Sugg = { name: string; kind: string; icon?: string };
// entity emoji for autocomplete rows
const SUGG_EMOJI: Record<string, string> = {
  coffee: '☕', cafe: '🍰', bar: '🍸', restaurant: '🍽', wine: '🍷', beer: '🍺',
  tea: '🍵', drink: '🥤', dish: '🍔', venue: '🍽', item: '🍽', history: '🕘',
};
const suggEmoji = (s: Sugg) => SUGG_EMOJI[s.icon ?? s.kind] ?? '🔍';

const HISTORY_KEY = 'searchHistory';
function readHistory(): string[] {
  try { const a = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); return Array.isArray(a) ? a.slice(0, 8) : []; } catch { return []; }
}
function pushHistory(q: string) {
  const s = q.trim();
  if (s.length < 2) return;
  const next = [s, ...readHistory().filter((x) => x.toLowerCase() !== s.toLowerCase())].slice(0, 8);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* quota */ }
}

// Stale-while-revalidate WITHOUT a live swap: the cached copy paints instantly and
// STAYS on screen — the fresh fetch is stored silently for the NEXT visit. Cards
// visibly reshuffling under the user's finger read as a "missed opportunity"
// (loss aversion), so the on-screen set must never change after first paint.
function cachedLoad<T>(key: string, fetcher: () => Promise<T>, setter: (v: T) => void, after?: () => void) {
  let painted = false;
  try {
    const c = localStorage.getItem('hc_' + key);
    if (c) { setter(JSON.parse(c)); painted = true; after?.(); }
  } catch { /* ignore bad cache */ }
  fetcher()
    .then((r) => {
      if (!painted) setter(r); // first-ever visit: nothing on screen yet → render
      try { localStorage.setItem('hc_' + key, JSON.stringify(r)); } catch { /* quota */ }
    })
    .catch(() => {})
    .finally(() => after?.());
}

// ---- one-time feed queue ----
// The server hands each post to a viewer ONCE (impressions). Fetched batches wait
// in this local queue until actually displayed, so background refreshes never
// burn posts the user hasn't seen. Each home visit advances to the next posts.
const FEEDQ_KEY = 'hc_feed_queue';
function readFeedQueue(): Review[] {
  try { const a = JSON.parse(localStorage.getItem(FEEDQ_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch { return []; }
}
function writeFeedQueue(q: Review[]) {
  try { localStorage.setItem(FEEDQ_KEY, JSON.stringify(q.slice(0, 60))); } catch { /* quota */ }
}

const TILE_ICON: Record<string, JSX.Element> = {
  RESTAURANT: <IcRestaurant />, COFFEE: <IcCoffee />, CAFE: <IcCake />,
  BAR: <IcBar />, DISH: <IcDish />, DRINK: <IcWine />,
};
const TILES: { key: Cat; icon: string; label: string }[] = [
  // dishes & drinks lead — that's the core "что попробовать" loop
  { key: 'DISH', icon: '🍝', label: 'Блюда' },
  { key: 'DRINK', icon: '🍷', label: 'Напитки' },
  { key: 'RESTAURANT', icon: '🍽️', label: 'Рестораны' },
  { key: 'COFFEE', icon: '☕', label: 'Кофейни' },
  { key: 'CAFE', icon: '🍰', label: 'Кафе' },
  { key: 'BAR', icon: '🍸', label: 'Бары' },
];

export default function Home() {
  const [recommended, setRecommended] = useState<Listing[]>([]);
  const [topDrinks, setTopDrinks] = useState<Listing[]>([]);
  const [topDishes, setTopDishes] = useState<Listing[]>([]);
  const [smart, setSmart] = useState<Listing[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [feedLoaded, setFeedLoaded] = useState(false);
  const [commentsReview, setCommentsReview] = useState<string | null>(null);
  const [photoReview, setPhotoReview] = useState<Review | null>(null); // tap feed photo → the review
  const [openUser, setOpenUser] = useState<string | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  // pin: opening the hero card must NOT advance the deck — the same card is
  // waiting when the user comes back (it leaves only after a rating/skip)
  const [heroPinId, setHeroPinId] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  // changes every mount → home cards reshuffle each time you open / switch tabs
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [autoRate, setAutoRate] = useState<number | undefined>(undefined);
  // server-ranked one-time feed: displayed posts + "all caught up" flag
  const [wallPosts, setWallPosts] = useState<Review[]>([]);
  // taste-based recommendation cards that keep the feed infinite once the
  // one-time user posts run out («показать ещё» loads more of these)
  const [recCards, setRecCards] = useState<Listing[]>([]);
  const recSeen = useRef(new Set<string>());
  const recFetching = useRef(false);
  // frozen feed layout: entries never move once shown; new batches append below
  const feedOrderRef = useRef<string[]>([]);
  const feedMountTs = useRef(Date.now());
  // swipe left→right returns from a category/search view to the home feed (iOS
  // interactive-pop pattern) — active ONLY while a filter/category is on screen
  const homeRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null); // the category/search results overlay layer
  const homeScrollY = useRef(0); // home scroll position saved when entering a category
  const [loadingMore, setLoadingMore] = useState(false); // «показать ещё» spinner
  // «наверх»: auto-appears once you scroll INTO the feed section, auto-hides
  // when tapped or when you rise back above the feed (owner spec 16.07.2026)
  const feedTopRef = useRef<HTMLDivElement>(null); // the «Лента» section title
  const [inFeed, setInFeed] = useState(false);
  const [topDismissed, setTopDismissed] = useState(false);
  const showScrollTop = inFeed && !topDismissed;
  useEffect(() => {
    const onScroll = () => {
      const top = feedTopRef.current ? feedTopRef.current.getBoundingClientRect().top + window.scrollY : Infinity;
      const past = window.scrollY > top - window.innerHeight * 0.5;
      setInFeed(past);
      if (!past) setTopDismissed(false); // rose above the feed → re-arm
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<Sugg[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [history, setHistory] = useState<string[]>(() => readHistory());
  const [cat, setCat] = useState<Cat>('ALL');
  const [results, setResults] = useState<Listing[] | null>(null);
  const [showAdd, setShowAdd] = useState(false); // "не нашли? добавьте" — choice sheet
  const [showAddBiz, setShowAddBiz] = useState(false); // add a venue (AddBusiness)
  const [pickVenueForItem, setPickVenueForItem] = useState(false); // add a dish/drink → pick venue
  const [active, setActive] = useState<Listing | null>(null);
  const [deepId, setDeepId] = useState<string | null>(null);
  const [deepVenue, setDeepVenue] = useState<{ id: string; name: string } | null>(null);
  const [events, setEvents] = useState<VenueEvent[]>([]);
  const [firstTaster, setFirstTaster] = useState<Listing[]>([]);
  // taste-personalized new dishes — re-fetched by loadFeeds so they refresh on
  // every return to home (a fresh shuffled set), not only on first mount.
  const loadEvents = useCallback(() => {
    api
      .eventsFeed(20)
      .then((e) => (e.length ? setEvents(e) : api.events(20).then(setEvents)))
      .catch(() => api.events(20).then(setEvents).catch(() => {}));
  }, []);
  // story / shared deep link: ?startapp=l_<listingId> → open that card
  useEffect(() => {
    const sp = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param as string | undefined;
    if (sp && sp.startsWith('l_')) setDeepId(sp.slice(2));
  }, []);
  const [browse, setBrowse] = useState<BrowseCat | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    sort: 'recommended',
    price: 0,
    openNow: false,
    cuisine: '',
  });
  const { ids, toggle } = useFavorites();

  const setRecommendedFast = useCallback((items: Listing[]) => {
    preloadListingPhotos(items, 12);
    setRecommended(items);
  }, []);
  const setTopDishesFast = useCallback((items: Listing[]) => {
    preloadListingPhotos(items, 8);
    setTopDishes(items);
  }, []);
  const setTopDrinksFast = useCallback((items: Listing[]) => {
    preloadListingPhotos(items, 8);
    setTopDrinks(items);
  }, []);
  const setSmartFast = useCallback((items: Listing[]) => {
    preloadListingPhotos(items, 8);
    setSmart(items);
  }, []);

  const openListing = (l: Listing) => {
    // chains open as a full card too (points are listed inside, at the bottom)
    setDeepId(null); // never stack two detail modals (their backdrops overlap → dead taps)
    setDeepVenue(null);
    setActive(l);
  };

  // tapping a "новинка" opens the DISH/DRINK at THAT venue (find-or-create it there),
  // with the venue as context so the card says "Оценить в «…»" and links to it.
  const openNewDish = (ev: { title?: string | null; venueId: string; photoUrl?: string | null; venue?: { name?: string | null } | null }) => {
    const drink = /кофе|латте|капучин|эспрессо|американо|раф|какао|чай|матч|тоник|лимонад|смузи|сок|морс|коктейл|вино|пиво|глинтвейн|напиток|кола|шейк/i.test(ev.title ?? '');
    if (ev.venue?.name) setDeepVenue({ id: ev.venueId, name: ev.venue.name });
    api
      .addItem(ev.venueId, { type: drink ? 'DRINK' : 'DISH', name: (ev.title || 'Новинка').slice(0, 60), photoUrl: ev.photoUrl ?? undefined })
      .then((item) => setDeepId(item.id))
      .catch(() => { setDeepVenue(null); setDeepId(ev.venueId); }); // fallback: open the venue
  };

  // (re)loads the recommendation feed; called on mount and after every review. Every
  // feed renders from its cache instantly, then refreshes in the background.
  const loadFeeds = useCallback(() => {
    loadCategoryProgress(true); // refresh the unlock scale after a new review
    const recentCats = [
      ...new Set(getRecent().map((l) => l.category).filter((c): c is string => !!c)),
    ].slice(0, 8);
    cachedLoad('recsys', () => api.recsysFeed(30).catch(() => api.recommended()), setRecommendedFast, () => setFeedLoaded(true));
    cachedLoad('firstTaster', () => api.firstTasterItems(8), setFirstTaster);
    cachedLoad('topDish', () => api.listings('DISH', undefined, { sort: 'rating', take: 12 }), setTopDishesFast);
    cachedLoad('topDrink', () => api.listings('DRINK', undefined, { sort: 'rating', take: 12 }), setTopDrinksFast);
    cachedLoad('smart', () => api.recommendedSmart(recentCats), setSmartFast);
    cachedLoad('myrev', () => api.myReviews(), setMyReviews);
    // «Новинки под ваш вкус» temporarily disabled (parsing paused) — see loadEvents
  }, [loadEvents, setRecommendedFast, setSmartFast, setTopDishesFast, setTopDrinksFast]);

  useEffect(() => {
    loadFeeds();
    api.me().then((u) => setMyId(u?.id ?? null)).catch(() => {});
    api.skips().then((ids) => setSkipped(new Set(ids))).catch(() => {});
  }, [loadFeeds]);

  // re-shuffle + reload the recommendation rows (new positions every time you
  // arrive at home — on app launch, on "Главная" tap, on returning from a section)
  const refreshHome = useCallback(() => {
    setSeed(Math.floor(Math.random() * 1e9));
    loadFeeds();
  }, [loadFeeds]);

  // latest filter state for the Esc handler (avoids stale closure)
  const escStateRef = useRef({ cat, search, results });
  escStateRef.current = { cat, search, results };

  // a category/search view is on screen → enable swipe-back to the home feed
  // swipe the RESULTS overlay away → the home feed beneath is revealed (iOS pop)
  useSwipeBack(
    catRef,
    () => window.dispatchEvent(new Event('home-back')), // light return, no reload
    !!results,
  );

  // tapping "Главная" in the nav clears search and returns to the start screen
  useEffect(() => {
    const reset = () => {
      setSearch('');
      setCat('ALL');
      setResults(null);
      setFilters({ sort: 'recommended', price: 0, openNow: false, cuisine: '' });
      setActive(null);
      setBrowse(null);
      refreshHome();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    // Esc also exits a filtered view (category/search) → back to the start screen,
    // unless a modal is open (its own Esc handler closes it first).
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (hasOpenModal()) return; // a modal/overlay is up → its own Esc handler steps back
      (document.activeElement as HTMLElement | null)?.blur?.(); // drop the focus outline box
      const { cat, search, results } = escStateRef.current;
      if (cat !== 'ALL' || search.trim() || results) reset();
    };
    // LIGHT return (swipe-back): just clear the category/search and restore the
    // home scroll position — DON'T reload/reshuffle the already-loaded feed
    const back = () => {
      setSearch('');
      setCat('ALL');
      setResults(null);
      setFilters({ sort: 'recommended', price: 0, openNow: false, cuisine: '' });
      setActive(null);
      setBrowse(null);
      const y = homeScrollY.current;
      requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'auto' }));
    };
    window.addEventListener('home-reset', reset);
    window.addEventListener('home-back', back);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('home-reset', reset);
      window.removeEventListener('home-back', back);
      window.removeEventListener('keydown', onKey);
    };
  }, [refreshHome]);

  // search-bar autocomplete suggestions (debounced)
  useEffect(() => {
    const q = search.trim();
    if (q.length < 1) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      api.suggest(q).then(setSuggestions).catch(() => {});
    }, 120);
    return () => clearTimeout(t);
  }, [search]);

  // empty box → recent searches (history); typing → live suggestions filtered to the tab
  const commitSearch = (q: string) => {
    pushHistory(q);
    setHistory(readHistory());
    setSearch(q);
    setSuggestions([]);
  };
  const shownSuggestions: Sugg[] = !search.trim()
    ? history.map((h) => ({ name: h, kind: 'history', icon: 'history' }))
    : cat === 'DISH' || cat === 'DRINK'
      ? suggestions.filter((s) => s.kind === 'item')
      : cat === 'RESTAURANT' || cat === 'BAR'
        ? suggestions.filter((s) => s.kind === 'venue')
        : suggestions;

  // one-time feed: pull the next posts from the local queue onto the screen and
  // top the queue up from the server (which never re-serves what it already gave).
  const wallIds = useRef(new Set<string>());
  const wallFetching = useRef(false);
  const topUpQueue = useCallback(async () => {
    if (wallFetching.current) return 0;
    wallFetching.current = true;
    try {
      const batch = await api.feed();
      const q = readFeedQueue();
      const known = new Set([...q.map((r) => r.id), ...wallIds.current]);
      const add = batch.filter((r) => !known.has(r.id)); // the server decides whose posts show
      if (add.length) writeFeedQueue([...q, ...add]);
      return add.length;
    } catch {
      return 0;
    } finally {
      wallFetching.current = false;
    }
  }, [myId]);
  const showNextPosts = useCallback((count = 5) => {
    const q = readFeedQueue();
    const next = q.filter((r) => !wallIds.current.has(r.id)).slice(0, count);
    if (next.length) {
      for (const r of next) wallIds.current.add(r.id);
      writeFeedQueue(q.filter((r) => !wallIds.current.has(r.id)));
      setWallPosts((p) => [...p, ...next]);
    }
    return next.length;
  }, []);
  // taste-based rec cards: loaded when user posts run out so the feed never ends.
  // recsysFeed shuffles a wide pool → each call returns fresh items; dedup here.
  const loadMoreRec = useCallback(async (count = 6) => {
    if (recFetching.current) return 0;
    recFetching.current = true;
    try {
      // recsys already excludes items the user rated/disliked, server-side
      const pool = await api.recsysFeed(30).catch(() => [] as Listing[]);
      const fresh = pool.filter((l) => !recSeen.current.has(l.id) && !skipped.has(l.id));
      const add = fresh.slice(0, count);
      for (const l of add) recSeen.current.add(l.id);
      if (add.length) setRecCards((p) => [...p, ...add]);
      return add.length;
    } finally {
      recFetching.current = false;
    }
  }, [skipped]);
  // the single "load more of the wall" action: user posts first, then — when
  // those run out — an endless stream of taste-based recommendation cards.
  const extendFeed = useCallback(async (count = 5) => {
    if (showNextPosts(count) > 0) return;
    const added = await topUpQueue();
    if (added > 0 && showNextPosts(count) > 0) return;
    await loadMoreRec(count + 1); // no more posts → recommendations keep it alive
  }, [showNextPosts, topUpQueue, loadMoreRec]);
  useEffect(() => {
    extendFeed(5);
    // rec cards join the FIRST screen of the feed (owner 17.07.2026) — the
    // score merge needs them present before any «показать ещё» tap
    loadMoreRec(4);
    // clip telemetry: measure a real card once per session — if the footer is
    // clipped on THIS device, the exact numbers land in server logs
    const t = setTimeout(() => {
      try {
        if (sessionStorage.getItem('clipProbe')) return;
        const btn = document.querySelector('.feed .card .fav-btn') as HTMLElement | null;
        const card = btn?.closest('.card') as HTMLElement | null;
        if (!btn || !card) return;
        sessionStorage.setItem('clipProbe', '1');
        const b = btn.getBoundingClientRect();
        const cr = card.getBoundingClientRect();
        const clip = Math.round(b.bottom - cr.bottom);
        { // always report once — real numbers beat guessing
          const cs = (el: Element) => {
            const s = getComputedStyle(el);
            return { h: s.height, mh: s.minHeight, d: s.display, o: s.overflow, f: s.flex };
          };
          fetch('/api/health/client-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              where: 'card-clip', clip, btnH: Math.round(b.height), cardH: Math.round(cr.height),
              card: cs(card),
              wrap: card.parentElement ? cs(card.parentElement) : null,
              cbody: card.querySelector('.body') ? cs(card.querySelector('.body')!) : null,
              ua: navigator.userAgent.slice(0, 80),
            }),
          }).catch(() => {});
        }
      } catch { /* diagnostics only */ }
    }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ratedIds = new Set(
    myReviews.map((r) => r.listing?.id).filter((x): x is string => !!x),
  );

  // pool of dishes/drinks to quick-rate. Round-robin across the chosen
  // categories so every taste shows up early (not buried by the first one),
  // then fill with the general pools. Drinks lead — the core loop is tasting drinks.
  const ratePool = (() => {
    const seen = new Set<string>();
    const seenName = new Set<string>();
    const out: Listing[] = [];
    const add = (l?: Listing) => {
      const nm = l?.name?.toLowerCase().trim();
      // no breakfast and no alcohol in the deck — only "rich" food & non-alcoholic drinks
      const SKIP_CAT = /завтрак|выпечк|гриль|сэндвич|сендвич/i;
      const ALCOHOL = /пиво|вино|коктейл|крепк|сидр|виски|водк|ликёр|ликер|\bром\b|джин|текил|коньяк|бренди|шампанск|игрист|глинтвейн|сангри|вермут|абсент|\bсаке\b|лагер|\bэль\b|\bipa\b|стаут|портер|пилснер|просекко|мохито|негрони|апероль|мартини/i;
      // "народные"/everyday dishes — not "дорого-богато"
      const FOLK = /уха|борщ|окрошк|солянк|рассольник|пельмен|вареник|холодец|студень|винегрет|селёдк|сельдь|гречк|каша|оладь|драник|заливн|квашен|кисель|квас|морс/i;
      const RUSSIAN = /русск/i; // only restaurant-grade cuisine — no Russian/folk cuisine
      const tags = `${l?.category ?? ''} ${l?.name ?? ''}`;
      // Keep venue-attached cards first. If Railway has items but no menu links after
      // a DB move, allow that explicit fallback so the home screen is not empty.
      // OWNER RULE: no venue attachment → the card never enters the deck
      const hasVenue = !!(l && ((l as any).recVenue || l.bestVenue));
      if (
        l &&
        hasVenue &&
        (l.type === 'DISH' || l.type === 'DRINK') &&
        !SKIP_CAT.test(l.category ?? '') &&
        !ALCOHOL.test(tags) &&
        !FOLK.test(l.name ?? '') &&
        !NONSTD.test(l.name ?? '') &&
        !RUSSIAN.test(`${l.category ?? ''} ${l.cuisine ?? ''}`) &&
        !seen.has(l.id) &&
        !(nm && seenName.has(nm)) && // no duplicate dish names (e.g. two "Глинтвейн")
        !skipped.has(l.id) &&
        !ratedIds.has(l.id) // already rated → leaves the deck (visible progress)
      ) {
        seen.add(l.id);
        if (nm) seenName.add(nm);
        out.push(l);
      }
    };
    // recsys feed (dishes with a real venue attached) leads. Shuffle per-visit so the
    // deck isn't the same order every launch (even from cache). The "plain" pools below
    // have NO venue attachment, so we only add them AFTER the recsys feed has loaded —
    // otherwise they flash first as venue-less cards, then get replaced a second later.
    seededShuffle(recommended, seed).forEach(add);
    if (feedLoaded) {
      smart.forEach(add);
      seededShuffle([...topDrinks, ...topDishes], seed).forEach(add);
    }
    return out;
  })();
  const pinned = heroPinId ? ratePool.find((l) => l.id === heroPinId) : undefined;
  const heroItem = pinned ?? (ratePool.length ? ratePool[heroIdx % ratePool.length] : null);

  useEffect(() => {
    const q = search.trim();
    const { sort, price, openNow, cuisine } = filters;
    const filtersActive =
      !!q || cat !== 'ALL' || sort !== 'recommended' || price > 0 || openNow || !!cuisine;
    if (!filtersActive) {
      setResults(null);
      return;
    }
    const t = setTimeout(() => {
      const opts = { sort, price: price || undefined, openNow, cuisine: cuisine || undefined };
      if (cat === 'DISH' || cat === 'DRINK') {
        // search WITHIN the items themselves (word-start match)
        if (q) api.searchItems(cat, q).then(setResults).catch(() => {});
        else api.listings(cat, undefined, opts).then(setResults).catch(() => {});
      } else if (cat === 'RESTAURANT' || cat === 'BAR') {
        // venues by name OR serving the typed dish/drink; bars filtered to category
        if (q) {
          api
            .searchVenues(q)
            .then((list) => setResults(cat === 'BAR' ? list.filter((l) => l.category === 'Бар') : list))
            .catch(() => {});
        } else {
          api
            .listings('RESTAURANT', undefined, { ...opts, category: cat === 'BAR' ? 'Бар' : undefined })
            .then(setResults)
            .catch(() => {});
        }
      } else if (q) {
        // no category selected → item first, then venues
        api.searchAll(q).then(setResults).catch(() => {});
      } else {
        api.listings(undefined, undefined, opts).then(setResults).catch(() => {});
      }
    }, 250);
    return () => clearTimeout(t);
  }, [search, cat, filters]);


  // «Не интересно» (YouTube-style): hide the card everywhere it shows AND send a
  // negative signal so the recommender learns to show less of this category
  const notInterested = (l: Listing) => {
    api.skip(l.id, l.category ?? undefined).catch(() => {});
    // optimistic: the card vanishes from EVERY section the moment you tap
    setSkipped((s) => new Set(s).add(l.id));
    setRecCards((p) => p.filter((x) => x.id !== l.id));
    setFirstTaster((p) => p.filter((x) => x.id !== l.id));
  };

  const card = (l: Listing) => (
    <ListingCard
      key={l.id}
      listing={l}
      favorite={ids.has(l.id)}
      onToggleFavorite={() => toggle(l.id)}
      onNotInterested={() => notInterested(l)}
      onClick={() => {
        setAutoRate(undefined);
        openListing(l);
      }}
      onRate={(n) => {
        setAutoRate(n);
        setActive(l);
      }}
    />
  );

  const row = (l: Listing, rank?: number) => (
    <ListRow
      key={l.id}
      listing={l}
      rank={rank}
      favorite={ids.has(l.id)}
      onToggleFavorite={() => toggle(l.id)}
      onNotInterested={() => notInterested(l)}
      onClick={() => openListing(l)}
      onTagClick={(tag) => {
        // tapping a tag → put it in the search bar; venue search matches the cuisine
        setCat('RESTAURANT');
        setSearch(tag);
      }}
    />
  );

  return (
    <div ref={homeRef}>
      <div className="cat-bar">
        {TILES.map((t) => (
          <button
            key={t.key}
            className={'cat-tile' + (cat === t.key ? ' active' : '')}
            onClick={() => {
              // tapping the already-active category deselects it → back to the start screen
              if (cat === t.key) {
                window.dispatchEvent(new Event('home-back'));
                return;
              }
              // remember where we were so swipe-back restores the home scroll
              if (cat === 'ALL' && !search.trim()) homeScrollY.current = window.scrollY;
              setCat(t.key as Cat);
              // places → map; dishes/drinks → list (item first, then venues)
              if (t.key === 'RESTAURANT' || t.key === 'BAR' || t.key === 'CAFE' || t.key === 'COFFEE')
                setBrowse(t.key as BrowseCat);
            }}
          >
            <span className="cat-ico">{TILE_ICON[t.key] ?? null}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="search">
        <div className="search-wrap">
          <div className="search-bar">
            {search || cat !== 'ALL' ? (
              // one step back: from a search → clear it; from a category (Напитки,
              // Блюда…) → back to the main screen
              <button
                className="search-ico back"
                onClick={() => {
                  setSearch('');
                  setCat('ALL');
                  setResults(null);
                }}
                aria-label="Назад"
              >
                ←
              </button>
            ) : (
              <span className="search-ico">🔍</span>
            )}
            <input
              placeholder={
                cat === 'DISH'
                  ? 'Поиск блюд'
                  : cat === 'DRINK'
                    ? 'Поиск напитков'
                    : cat === 'RESTAURANT'
                      ? 'Ресторан или блюдо в нём'
                      : cat === 'BAR'
                        ? 'Бар или напиток в нём'
                        : 'Поиск: рестораны, блюда, напитки'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => { if (cat === 'ALL' && !search.trim()) homeScrollY.current = window.scrollY; setSearchFocused(true); }}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (search.trim()) { pushHistory(search); setHistory(readHistory()); }
                  setSearchFocused(false);
                  (e.target as HTMLInputElement).blur(); // commit search, hide suggestions
                }
              }}
            />
            {/* search icon on the right once the user has typed something */}
            {search && (
              <button
                className="search-ico right"
                onClick={() => setSearchFocused(false)}
                aria-label="Искать"
              >
                🔍
              </button>
            )}
          </div>
          {searchFocused && shownSuggestions.length > 0 && (
            <div className="search-sugg">
              {!search.trim() && (
                <div className="ss-head">
                  Недавние запросы
                  <button
                    className="ss-clear"
                    onMouseDown={(e) => { e.preventDefault(); localStorage.removeItem(HISTORY_KEY); setHistory([]); }}
                  >
                    Очистить
                  </button>
                </div>
              )}
              {shownSuggestions.map((s) => (
                <button
                  key={s.kind + s.name}
                  className="search-sugg-item"
                  onMouseDown={(e) => { e.preventDefault(); commitSearch(s.name); }}
                >
                  <span className="ss-ico">{suggEmoji(s)}</span>
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* filters only in a category context: full for venues, sort-only for items */}
        {(cat === 'RESTAURANT' || cat === 'BAR') && (
          <Filters
            state={filters}
            onChange={(n) => setFilters((f) => ({ ...f, ...n }))}
          />
        )}
        {(cat === 'DISH' || cat === 'DRINK') && (
          <Filters
            variant="item"
            state={filters}
            onChange={(n) => setFilters((f) => ({ ...f, ...n }))}
          />
        )}
      </div>

      <div className="home-content">
      {/* category/search results OVERLAY the home feed (iOS interactive-pop):
          swiping this layer away reveals the already-loaded home beneath it */}
      {results && (
        <div ref={catRef} className="cat-results-layer">
          <div className="section-title">Результаты</div>
          {results.length === 0 ? (
            <div className="empty">Ничего не найдено</div>
          ) : (
            <div className="list">
              {(() => {
                const cards = results.map((l) => row(l));
                const cta = (
                  <button key="add-cta" className="btn rate-cta" onClick={() => setShowAdd(true)}>
                    ➕ Не нашли то, что искали? Добавьте в один клик
                  </button>
                );
                // between the 9th and 10th card; shorter lists → at the end
                if (cards.length >= 10) cards.splice(9, 0, cta);
                else cards.push(cta);
                return cards;
              })()}
            </div>
          )}
        </div>
      )}
      {/* base layer: the home feed, always mounted so it shows behind a swipe */}
      {!feedLoaded && ratePool.length === 0 && myReviews.length === 0 && wallPosts.length === 0 ? (
        <div style={{ padding: '4px 2px' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="sk-card">
              <div className="sk sk-photo" />
              <div className="sk-lines">
                <div className="sk sk-line w70" />
                <div className="sk sk-line w40" />
                <div className="sk sk-line btn" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <TrainingScale />
          {/* "Ваши оценки" lives in the Profile only — removed from the home feed. */}
          {events.length > 0 && (
            <>
              <div className="section-title">🆕 Новинки под ваш вкус</div>
              <div className="feed">
                {dedupeByVenue(events).map((ev) => (
                  <button
                    key={ev.id}
                    className="myrate-card"
                    onClick={() => openNewDish(ev)}
                  >
                    <div className="newdish-media">
                      <img className="myrate-photo" src={ev.photoUrl!} alt="" loading="lazy" />
                      <span className="ev-badge">🆕 Новинка</span>
                      {ev.price ? <span className="newdish-price">{ev.price} ₽</span> : null}
                    </div>
                    <div className="myrate-name">{(ev.title || 'Новинка меню').slice(0, 40)}</div>
                    <div className="myrate-place">📍 {ev.venue?.name}</div>
                  </button>
                ))}
              </div>
            </>
          )}
          {heroItem && (
            <>
              <div className="section-title">Что пробуем?</div>
              <TasteHero
                key={heroItem.id}
                item={heroItem}
                favorite={ids.has(heroItem.id)}
                onFavorite={() => {
                  // swipe right / ♥ → add to favorites, then next card
                  if (!ids.has(heroItem.id)) toggle(heroItem.id);
                  setHeroIdx((i) => i + 1);
                }}
                onSkip={() => {
                  // "не люблю" — negative taste signal
                  api.skip(heroItem.id, heroItem.category).catch(() => {});
                  setSkipped((s) => new Set(s).add(heroItem.id));
                  setHeroIdx((i) => i + 1);
                }}
                onShuffle={() => { setHeroPinId(null); setHeroIdx((i) => i + 1); }}
                onOpenItem={() => {
                  setAutoRate(undefined);
                  openListing(heroItem);
                }}
                onRate={(n) => {
                  setAutoRate(n);
                  openListing(heroItem);
                }}
              />
            </>
          )}
          {(() => {
            const ft = firstTaster.filter((l) => (l as any).recVenue && !skipped.has(l.id) && !NONSTD.test(l.name ?? ''));
            return ft.length > 0 && (
              <>
                <div className="section-title">🏅 Станьте первым дегустатором</div>
                <p className="ft-sub">Ваш отзыв станет частью истории карточки</p>
                <div className="feed ft-feed">{ft.map(card)}</div>
              </>
            );
          })()}
          {/* «Ещё на оценку» removed (owner 17.07.2026) — the deck lives in the hero */}
          {(wallPosts.length > 0 || recCards.length > 0) && (
            <>
              <div className="section-title" ref={feedTopRef}>Лента</div>
              {/* ONE ranked feed (owner rules 17.07.2026): posts and rec cards
                  compete on a unified 0..1 score — a better-fitting rec card may
                  stand ABOVE a friend's post. But once something is ON SCREEN its
                  position is frozen: «показать ещё» only APPENDS below, sorted
                  within the new batch — never reshuffles what the user has seen. */}
              {(() => {
                const byKey = new Map<string, { s: number; el: JSX.Element }>();
                wallPosts.forEach((r, i) => {
                  byKey.set('p:' + r.id, {
                    s: Number((r as any).normScore ?? Math.max(0.05, 1 - i * 0.04)),
                    el: (
                      <FeedPost
                        key={r.id}
                        review={r}
                        onOpen={() => r.listing && openListing(r.listing)}
                        onComments={() => setCommentsReview(r.id)}
                        onOpenUser={(uid) => setOpenUser(uid)}
                        onOpenPhoto={() => setPhotoReview(r)}
                        onOpenVenue={() => r.venue?.id && openListing({ id: r.venue.id, name: r.venue.name } as Listing)}
                      />
                    ),
                  });
                });
                recCards.forEach((l, i) => {
                  byKey.set('r:' + l.id, {
                    s: Number((l as any).normScore ?? Math.max(0.05, 0.9 - i * 0.04)),
                    el: (
                      <div key={'rec-' + l.id} className="rec-wrap">
                        <div className="rec-tag">✨ Вам может понравиться</div>
                        {card(l)}
                      </div>
                    ),
                  });
                });
                const bySc = (a: string, b: string) => byKey.get(b)!.s - byKey.get(a)!.s;
                if (Date.now() - feedMountTs.current < 2500) {
                  // first paint window: full score merge (recs may lead)
                  feedOrderRef.current = [...byKey.keys()].sort(bySc);
                } else {
                  const known = new Set(feedOrderRef.current);
                  const fresh = [...byKey.keys()].filter((k) => !known.has(k)).sort(bySc);
                  if (fresh.length) feedOrderRef.current = [...feedOrderRef.current, ...fresh];
                }
                return feedOrderRef.current.map((k) => byKey.get(k)?.el).filter(Boolean);
              })()}
              {/* the feed never ends: «показать ещё» always loads more. Premium
                  feedback — the button shows a spinner while the next batch loads */}
              <button
                className="btn secondary show-more"
                disabled={loadingMore}
                onClick={async () => {
                  if (loadingMore) return;
                  haptic('light');
                  setLoadingMore(true);
                  // min 400ms so the spinner is always felt (premium — no jarring flash)
                  try { await Promise.all([extendFeed(5), new Promise((r) => setTimeout(r, 400))]); }
                  finally { setLoadingMore(false); }
                }}
              >
                {loadingMore ? <span className="btn-spinner" /> : 'Показать ещё'}
              </button>
            </>
          )}
        </>
      )}
      </div>
      {/* frosted "up" button above the camera fab: auto-appears in the feed,
          hides on tap or when you rise back above the feed */}
      {showScrollTop && (
        <button
          className="scroll-top-btn"
          aria-label="Наверх"
          onClick={() => { haptic('light'); setTopDismissed(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      )}

      {commentsReview && (
        <CommentsModal
          reviewId={commentsReview}
          onClose={() => setCommentsReview(null)}
          onOpenUser={(uid) => {
            setCommentsReview(null);
            setOpenUser(uid);
          }}
        />
      )}
      {photoReview && (
        <PhotoPostModal
          review={photoReview}
          onClose={() => setPhotoReview(null)}
          onOpenUser={(uid) => { setPhotoReview(null); setOpenUser(uid); }}
          onOpenListing={() => {
            const l = photoReview.listing;
            setPhotoReview(null);
            if (l) openListing(l as Listing);
          }}
          onOpenVenue={() => {
            const v = photoReview.venue;
            setPhotoReview(null);
            if (v?.id) openListing({ id: v.id, name: v.name } as Listing);
          }}
        />
      )}
      {openUser && <UserProfileModal id={openUser} onClose={() => setOpenUser(null)} />}
      {browse && (
        <Suspense fallback={null}>
        <MapBrowse
          cat={browse}
          onClose={() => {
            setBrowse(null);
            // fully return to the home feed — otherwise the category's stale
            // "Результаты" list stays on screen instead of the main page
            setCat('ALL');
            setResults(null);
            setSearch('');
            refreshHome(); // returning to home from a section → fresh positions
          }}
        />
        </Suspense>
      )}
      {/* choice: add a venue or add a dish/drink (label follows the search category) */}
      {showAdd && (
        <div className="modal-backdrop" style={{ zIndex: 3200 }} onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Не нашли «{search.trim()}»?</h3>
            <div className="meta" style={{ color: 'var(--hint)', marginBottom: 12 }}>
              Добавьте в каталог — это займёт минуту.
            </div>
            <button
              className="btn rate-cta"
              onClick={() => { setShowAdd(false); setShowAddBiz(true); }}
            >
              🏠 Добавить заведение
            </button>
            <button
              className="btn rate-cta"
              style={{ marginTop: 8 }}
              onClick={() => { setShowAdd(false); setPickVenueForItem(true); }}
            >
              {cat === 'DRINK' ? '🍷 Добавить напиток' : cat === 'DISH' ? '🍽 Добавить блюдо' : '🍽 Добавить блюдо или напиток'}
            </button>
          </div>
        </div>
      )}
      {showAddBiz && (
        <div className="modal-backdrop" style={{ zIndex: 3200 }} onClick={() => setShowAddBiz(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <Suspense fallback={null}><AddBusiness onClose={() => setShowAddBiz(false)} initialName={search.trim()} /></Suspense>
          </div>
        </div>
      )}
      {pickVenueForItem && (
        <VenuePicker
          onClose={() => setPickVenueForItem(false)}
          onPick={(v) => { setPickVenueForItem(false); if (v.id) setDeepId(v.id); }} // open the venue → add item there
          onAdded={() => setPickVenueForItem(false)}
        />
      )}
      {active && (
        <Suspense fallback={null}>
        <ListingDetailModal
          id={active.id}
          autoRate={autoRate}
          originVenue={active.recVenue ?? undefined} // check-in attaches to the recommended place
          onChanged={loadFeeds} // a new review → rebuild the recommendation feed
          onClose={() => {
            setActive(null);
            if (autoRate != null) {
              setAutoRate(undefined);
              setHeroIdx((i) => i + 1); // move to the next item to rate
            }
            // stay where the card was opened — never jump back to the top
          }}
        />
        </Suspense>
      )}
      {deepId && !active && (
        <Suspense fallback={null}>
        <ListingDetailModal
          id={deepId}
          originVenue={deepVenue ?? undefined}
          onChanged={loadFeeds}
          onClose={() => { setDeepId(null); setDeepVenue(null); }}
        />
        </Suspense>
      )}
    </div>
  );
}
