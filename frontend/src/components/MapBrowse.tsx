import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import type { GeoPoint, Listing, ListingType } from '../types';
import { Filters, type FilterState } from './Filters';
import { ListRow } from './ListRow';
import { ListingDetailModal } from './ListingDetail';
import { MapView } from './MapView';
import { useFavorites } from '../hooks/useFavorites';
import { useEscClose } from '../modalEsc';
import { useSwipeBack } from '../swipeBack';
import { cuisineToken } from '../cuisine';
import { lockVerticalSwipes, telegramWebApp } from '../telegram';

export type BrowseCat = 'RESTAURANT' | 'BAR' | 'CAFE' | 'COFFEE' | 'DISH' | 'DRINK';

const LABEL: Record<BrowseCat, string> = {
  RESTAURANT: 'Рестораны',
  BAR: 'Бары',
  CAFE: 'Кафе',
  COFFEE: 'Кофейни',
  DISH: 'Блюда',
  DRINK: 'Напитки',
};

const MOSCOW: [number, number] = [55.751, 37.618];

function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function MapBrowse({ cat, onClose }: { cat: BrowseCat; onClose: () => void }) {
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [results, setResults] = useState<Listing[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    sort: 'distance',
    price: 0,
    openNow: false,
    cuisine: '',
  });
  const [loaded, setLoaded] = useState(false);

  const isItem = cat === 'DISH' || cat === 'DRINK';
  const close = () => {
    setClosing(true);
    setTimeout(onClose, 260);
  };
  useEffect(() => lockVerticalSwipes(), []);
  const pageRef = useRef<HTMLDivElement>(null);
  useEscClose(close, pageRef);
  useSwipeBack(pageRef, close); // edge swipe → back to home
  const { ids, toggle } = useFavorites();

  // current location → blue dot + map centering
  const locate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setUserLoc([p.coords.latitude, p.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };
  useEffect(locate, []);

  // fetch results; for dishes/drinks we look up the VENUES that serve them
  useEffect(() => {
    const q = query.trim();
    const sort = filters.sort;
    const t = setTimeout(() => {
      // a cuisine tag (e.g. "Бургеры") filters by cuisine instead of by name
      const tagToken = cuisineToken(q);
      // keep only venues that belong to the browsed category (COFFEE/CAFE/BAR)
      const catFilter = (list: Listing[]) => {
        if (cat === 'COFFEE') return list.filter((l) => /кофе|coffee/i.test(l.category ?? ''));
        if (cat === 'CAFE')
          return list.filter(
            (l) =>
              /кафе|фастфуд|шаурм|шаверм|мороженое|фуд.?корт/i.test(l.category ?? '') ||
              /kebab|shawarma/i.test(l.cuisine ?? ''),
          );
        if (cat === 'BAR') return list.filter((l) => /бар|паб|pub/i.test(l.category ?? ''));
        return list;
      };
      const req = isItem
        ? api.venuesServing(cat as 'DISH' | 'DRINK', q || undefined)
        : q && !tagToken
          ? // free-text query in a venue category → match venue NAME *or* a dish/drink
            // it serves (so "айс латте" in Кофейни finds coffee shops that pour it),
            // then scope to the category being browsed.
            api.searchVenues(q).then(catFilter)
          : api.listings(
              cat === 'BAR' || cat === 'CAFE' || cat === 'COFFEE' ? 'RESTAURANT' : (cat as ListingType),
              tagToken ? undefined : q || undefined,
              {
                sort,
                price: filters.price || undefined,
                openNow: filters.openNow,
                cuisine: tagToken ?? filters.cuisine ?? undefined,
                category: cat === 'BAR' ? 'Бар' : cat === 'CAFE' ? 'Кафе' : cat === 'COFFEE' ? 'Кофейня' : undefined,
                take: 150,
              },
            );
      setLoaded(false);
      req
        .then((list) => {
          setLoaded(true);
          // distance sort (default for the map) — by distance to the user
          if (sort === 'distance' || isItem) {
            const origin = userLoc ?? MOSCOW;
            list = [...list].sort((a, b) => {
              const da = a.lat != null && a.lng != null ? distanceKm(origin, [a.lat, a.lng]) : 1e9;
              const db = b.lat != null && b.lng != null ? distanceKm(origin, [b.lat, b.lng]) : 1e9;
              return da - db;
            });
          }
          setResults(list);
        })
        .catch(() => setLoaded(true));
    }, 250);
    return () => clearTimeout(t);
  }, [cat, filters, userLoc, query, isItem]);

  const points: GeoPoint[] = useMemo(
    () =>
      results
        .filter((l) => l.lat != null && l.lng != null)
        .slice(0, 80)
        .map((l) => ({ id: l.id, name: l.name, lat: l.lat as number, lng: l.lng as number, type: l.type })),
    [results],
  );

  // drag handle → follow the finger live (document-level listeners = robust in
  // the Telegram webview), then snap open/closed on release.
  const sheetRef = useRef<HTMLDivElement>(null);
  const collapsedPx = () => (telegramWebApp()?.viewportStableHeight ?? window.innerHeight) * 0.86 - 220;
  // pull-down from INSIDE the list (feed-post logic): when the list is scrolled
  // to the top, dragging down grabs the whole sheet and collapses it to the map;
  // scrolled lists keep scrolling — the decision is made on the FIRST move.
  const listRef = useRef<HTMLDivElement>(null);
  const onListDown = (e: React.PointerEvent) => {
    if (!expanded) return; // collapsed sheet: the handle already does this
    const list = listRef.current;
    if (list && list.scrollTop > 0) return; // mid-scroll → native scrolling
    const startY = e.clientY;
    const startX = e.clientX;
    let decided = false;
    const sheet = sheetRef.current;
    const move = (ev: PointerEvent) => {
      const dy = ev.clientY - startY;
      const dx = ev.clientX - startX;
      if (!decided) {
        if (Math.abs(dy) < 4 && Math.abs(dx) < 4) return;
        // downward pull wins only when clearly vertical
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) { cleanup(); return; }
        decided = true;
        sheet?.classList.add('dragging');
      }
      ev.preventDefault();
      const t = Math.max(0, Math.min(collapsedPx(), dy));
      if (sheet) sheet.style.transform = `translateY(${t}px)`;
    };
    const up = (ev: PointerEvent) => {
      cleanup();
      if (!decided) return;
      if (sheet) {
        sheet.classList.remove('dragging');
        sheet.style.transform = '';
      }
      const dy = ev.clientY - startY;
      setExpanded(dy < collapsedPx() / 3); // a firm pull → the map
    };
    const cleanup = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
      if (!decided && sheet) { sheet.classList.remove('dragging'); sheet.style.transform = ''; }
    };
    document.addEventListener('pointermove', move, { passive: false });
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  };

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, a')) return; // let controls work
    const startY = e.clientY;
    const base = expanded ? 0 : collapsedPx();
    const sheet = sheetRef.current;
    sheet?.classList.add('dragging');
    const move = (ev: PointerEvent) => {
      if (!sheet) return;
      const t = Math.max(0, Math.min(collapsedPx(), base + (ev.clientY - startY)));
      sheet.style.transform = `translateY(${t}px)`;
    };
    const up = (ev: PointerEvent) => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
      if (sheet) {
        sheet.classList.remove('dragging');
        sheet.style.transform = '';
      }
      const dy = ev.clientY - startY;
      if (Math.abs(dy) < 6) setExpanded((x) => !x);
      else setExpanded(base + dy < collapsedPx() / 2);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  };

  return (
    <div ref={pageRef} className={'mapbrowse' + (closing ? ' closing' : '')}>
      <div className="mb-header">
        <button
          className="mb-back"
          onClick={() => {
            // when searching, ← returns to the map; otherwise it closes
            if (searching || query) {
              setSearching(false);
              setQuery('');
            } else {
              close();
            }
          }}
        >
          ←
        </button>
        {searching ? (
          <>
            <input
              className="mb-header-input"
              autoFocus
              placeholder={
                cat === 'DISH'
                  ? 'Найти блюдо…'
                  : cat === 'DRINK'
                    ? 'Найти напиток…'
                    : 'Найти заведение…'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => !query && setSearching(false)}
            />
            {query && (
              <button
                className="search-ico right"
                onMouseDown={(e) => e.preventDefault()}
                aria-label="Искать"
              >
                🔍
              </button>
            )}
          </>
        ) : (
          <button className="mb-title" onClick={() => setSearching(true)}>
            <b>{LABEL[cat]}</b>
            <span className="mb-loc">
              {query ? `«${query}»` : isItem ? 'Где попробовать' : userLoc ? 'Рядом с вами' : 'Москва'}
            </span>
          </button>
        )}
        <button
          className="mb-locate-h"
          onClick={() => setExpanded((x) => !x)}
          title="Список"
        >
          {expanded ? '🗺' : '☰'}
        </button>
        <button className="mb-locate-h" onClick={locate} title="Моё местоположение">
          📍
        </button>
      </div>

      <div className="mb-map">
        <MapView
          points={points}
          userLocation={userLoc}
          cluster
          height="100%"
          onSelect={setActiveId}
        />
      </div>
      {/* compass → jump the map to the user's current location */}
      <button className="mb-compass" onClick={locate} title="Моё местоположение" aria-label="Моё местоположение">
        🧭
      </button>

      <div ref={sheetRef} className={'mb-sheet' + (expanded ? ' exp' : '')}>
        <div className="mb-handle" onPointerDown={onDown}>
          <span className="mb-grip" />
        </div>

        {!isItem && (
          <div className="mb-filters" onPointerDown={onDown}>
            <Filters state={filters} onChange={(n) => setFilters((f) => ({ ...f, ...n }))} />
          </div>
        )}
        <div className="mb-count" onPointerDown={onDown}>
          {!loaded
            ? 'Загрузка…'
            : isItem
              ? results.length > 0
                ? `Подают в ${results.length} заведениях`
                : query
                  ? 'Такое блюдо не нашли — проверьте название или введите другое'
                  : 'Введите название блюда'
              : results.length > 0
                ? `Найдено: ${results.length}`
                : 'В этом районе ничего не нашли — передвиньте карту или измените фильтры'}
        </div>
        <div className="mb-list" ref={listRef} onPointerDown={onListDown}>
          {results.map((l) => (
            <ListRow
              key={l.id}
              listing={l}
              favorite={ids.has(l.id)}
              onToggleFavorite={() => toggle(l.id)}
              onClick={() => setActiveId(l.id)}
              onTagClick={(tag) => {
                setQuery(tag); // shows in the search bar; ← clears it
                setSearching(true);
              }}
            />
          ))}
        </div>
      </div>

      {activeId && (
        <ListingDetailModal id={activeId} onClose={() => setActiveId(null)} />
      )}
    </div>
  );
}
