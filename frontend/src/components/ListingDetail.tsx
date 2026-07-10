import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import type { Listing, ListingDetail, Question, Review, VoteState, VoteType } from '../types';
import { CorrectionModal } from './CorrectionModal';
import { SimilarItems } from './SimilarItems';
import { ReviewAttrs } from './ReviewAttrs';
import { VenuePicker } from './VenuePicker';
import { ListRow } from './ListRow';
import { ReviewForm } from './ReviewForm';
import { TasteResult } from './TasteResult';
import { Stars } from './Stars';
import { VenuePhoto } from './VenuePhoto';
import { MapView } from './MapView';
import { openExternal, telHref, callPhone, shareToStory, shareToChat, shareMessage } from '../telegram';
import { ratingsWord, openStatus } from '../plural';
import { useEscClose } from '../modalEsc';
import { useSwipeDismiss } from '../swipeDismiss';
import { pushRecent } from '../recent';
import { cuisineTags } from '../cuisine';
import { beerStyle } from '../tasting';
import { useCategoryProgress } from '../categoryGate';
import { composeStoryImage } from '../storyImage';

const TYPE_LABEL: Record<Listing['type'], string> = {
  RESTAURANT: 'Ресторан',
  DISH: 'Блюдо',
  DRINK: 'Напиток',
};

function MiniRow({
  items,
  onPick,
}: {
  items: Listing[];
  onPick: (l: Listing) => void;
}) {
  return (
    <div className="feed">
      {items.map((l) => {
        const isChain = !!(l.branchCount && l.branchCount > 1) || !!l.groupKey;
        return (
          <div key={l.id || l.name} className="mini" onClick={() => onPick(l)}>
            <VenuePhoto listing={l} className="mini-img" />
            <div className="mini-name">{l.name}</div>
            {(l as any).menuPrice != null && (
              <div className="mini-price">{(l as any).menuPrice} ₽</div>
            )}
            {/* item's rating AT THIS venue (why it's ranked here), else venue's own rating */}
            {(l as any).itemRating != null ? (
              <div className="mini-meta item-rating">
                ★ {(l as any).itemRating.toFixed(1)} · {(l as any).itemReviewCount} {ratingsWord((l as any).itemReviewCount)}
              </div>
            ) : (
              l.reviewCount > 0 && (
                <div className="mini-meta">★ {l.avgRating.toFixed(1)} ({l.reviewCount} {ratingsWord(l.reviewCount)})</div>
              )
            )}
            {isChain ? (
              <div className="mini-addr" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                {l.branchCount && l.branchCount > 1 ? `Сеть · ${l.branchCount} точек` : 'Сеть'}
              </div>
            ) : (
              (l.address || l.cityLabel) && (
                <div className="mini-addr">📍 {l.address || l.cityLabel}</div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}

function AddItemModal({
  venueId,
  venueName,
  onClose,
  onAdded,
}: {
  venueId: string;
  venueName: string;
  onClose: () => void;
  onAdded: (item: Listing) => void;
}) {
  const [type, setType] = useState<'DISH' | 'DRINK'>('DISH');
  const [name, setName] = useState('');
  const [sugg, setSugg] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const q = name.trim();
    if (q.length < 2) {
      setSugg([]);
      return;
    }
    const t = setTimeout(() => {
      api
        .itemSuggest(type, q)
        .then((s) => setSugg(s.filter((x) => x.toLowerCase() !== q.toLowerCase())))
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [name, type]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  const addPhoto = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    setUploading(true);
    try {
      setPhotoUrl(await api.upload(files[0]));
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    if (!name.trim()) return;
    setBusy(true);
    api
      .addItem(venueId, {
        type,
        name: name.trim(),
        description: description.trim() || undefined,
        photoUrl: photoUrl ?? undefined,
      })
      .then(onAdded)
      .catch(() => setBusy(false));
  };

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 2700 }}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Добавить позицию</h3>
        <button className="addto" onClick={onClose}>
          Добавляем в: <b>{venueName}</b> →
        </button>
        <div className="field">
          <label>Что это?</label>
          <div className="chips">
            <button
              className={'chip' + (type === 'DISH' ? ' active' : '')}
              onClick={() => setType('DISH')}
            >
              Блюдо
            </button>
            <button
              className={'chip' + (type === 'DRINK' ? ' active' : '')}
              onClick={() => setType('DRINK')}
            >
              Напиток
            </button>
          </div>
        </div>
        <div className="field">
          <label>Название</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === 'DISH' ? 'Борщ' : 'Раф кофе'}
          />
          {sugg.length > 0 && (
            <div className="suggest">
              {sugg.map((s) => (
                <button
                  key={s}
                  className="suggest-item"
                  onClick={() => {
                    setName(s);
                    setSugg([]);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="field">
          <label>Описание (необязательно)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="field">
          <label>Фото (необязательно)</label>
          <label className="upload-btn">
            <span className="up-ico">📷</span>
            {photoUrl ? 'Заменить фото' : 'Добавить фото'}
            <input type="file" accept="image/*" hidden onChange={(e) => addPhoto(e.target.files)} />
          </label>
          {uploading && <span className="meta"> Загрузка…</span>}
          {photoUrl && (
            <img
              src={photoUrl}
              alt=""
              style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8, marginTop: 6 }}
            />
          )}
        </div>
        <p className="meta" style={{ color: 'var(--hint)', fontSize: 13 }}>
          Позиция появится в меню после подтверждения владельцем, но оценить её можно сразу.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button className="btn secondary" onClick={onClose} disabled={busy}>
            Отмена
          </button>
          <button className="btn" onClick={submit} disabled={busy}>
            {busy ? 'Добавление…' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ListingDetailModal({
  id: initialId,
  onClose,
  onChanged,
  autoRate,
  originVenue: initialOriginVenue,
}: {
  id: string;
  onClose: () => void;
  onChanged?: () => void;
  autoRate?: number; // when set, immediately start the rate flow (ask where → card)
  originVenue?: { id: string; name: string; price?: number | null } | null; // recommended place → check-in attaches here
}) {
  const [id, setId] = useState(initialId);
  const [data, setData] = useState<ListingDetail | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState<number | undefined>(undefined);
  const [reviewTarget, setReviewTarget] = useState<Listing | null>(null);
  const [reviewVenue, setReviewVenue] = useState<{
    id?: string;
    name: string;
    pending?: boolean;
  } | null>(null);
  // when a dish/drink is opened FROM a restaurant menu (or a recommended place),
  // rating auto-attaches there — no "pick a venue" step.
  const [originVenue, setOriginVenue] = useState<{ id: string; name: string; price?: number | null } | null>(
    initialOriginVenue ?? null,
  );
  const { isUnlocked, countFor, threshold } = useCategoryProgress();
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setUserLoc([p.coords.latitude, p.coords.longitude]),
      () => {},
      { timeout: 8000, maximumAge: 120000 },
    );
  }, []);

  // recommender signals: log OPEN now, VIEW if they linger >15s; fetch probability
  const [likeProb, setLikeProb] = useState<{ probability: number | null; reason: string } | null>(null);
  useEffect(() => {
    api.logEvent(id, 'OPEN');
    const t = setTimeout(() => api.logEvent(id, 'VIEW'), 15000);
    api.likeProbability(id).then(setLikeProb).catch(() => {});
    return () => clearTimeout(t);
  }, [id]);
  const [tasteResult, setTasteResult] = useState<{
    data: import('../types').TasteRanking;
    itemId: string;
  } | null>(null);
  const [votes, setVotes] = useState<Record<string, VoteState>>({});
  const [claimed, setClaimed] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [hoverRate, setHoverRate] = useState(0);
  const [fav, setFav] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [showVenuePicker, setShowVenuePicker] = useState(false);
  const [pendingRating, setPendingRating] = useState<number | undefined>(undefined);
  const requestClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };
  useEscClose(requestClose);

  // pull-to-dismiss: from the top of the card, a strong drag down (anywhere)
  // closes it. Uses native non-passive touch events so we can preventDefault the
  // browser's overscroll and take over (pointer events get eaten by native scroll
  // in the iOS Telegram webview).
  const sheetRef = useRef<HTMLDivElement>(null);
  // app-wide pattern: swipe down anywhere on the sheet (from its scroll top) closes —
  // complements the photo-handle drag below (which stays for gallery-area gestures)
  useSwipeDismiss(sheetRef, onClose);
  const mediaRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null); // "Добавить фото" (no review)
  const [photoBusy, setPhotoBusy] = useState(false);
  // human motivation after each rating — never "+10 XP" (gamification philosophy)
  const [rateToast, setRateToast] = useState('');
  const RATE_PHRASES = [
    '✨ Теперь приложение лучше понимает ваш вкус',
    '🎯 Ваш профиль стал точнее',
    '🤖 Точность рекомендаций увеличилась',
  ];
  const shareRef = useRef<{ photo?: string; text?: string }>({}); // last check-in's photo+note for "Отправить другу"
  const closeRef = useRef(requestClose);
  closeRef.current = requestClose;
  // pull the photo down to close the card. The handler lives ON the photo, which
  // has touch-action:none, so vertical gestures are fully ours (cancelable) and
  // don't get eaten by the card's native scroll — the only thing that works on iOS.
  useEffect(() => {
    const handle = mediaRef.current;
    const sheet = sheetRef.current;
    if (!handle || !sheet) return;
    let startX = 0;
    let startY = 0;
    let dy = 0;
    let active = false;
    const start = (e: TouchEvent) => {
      if (sheet.scrollTop > 0) { active = false; return; }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      dy = 0;
      active = true;
      sheet.style.transition = 'none';
    };
    const move = (e: TouchEvent) => {
      if (!active) return;
      const dx = e.touches[0].clientX - startX;
      dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy)) return; // horizontal → leave for gallery
      e.preventDefault();
      sheet.style.transform = `translateY(${Math.max(0, dy)}px)`;
    };
    const end = () => {
      if (!active) return;
      active = false;
      sheet.style.transition = 'transform 0.25s ease';
      if (dy > 100) closeRef.current();
      else sheet.style.transform = '';
    };
    handle.addEventListener('touchstart', start, { passive: true });
    handle.addEventListener('touchmove', move, { passive: false });
    handle.addEventListener('touchend', end, { passive: true });
    handle.addEventListener('touchcancel', end, { passive: true });
    return () => {
      handle.removeEventListener('touchstart', start);
      handle.removeEventListener('touchmove', move);
      handle.removeEventListener('touchend', end);
      handle.removeEventListener('touchcancel', end);
    };
  }, []);
  const [tab, setTab] = useState<'menu' | 'info' | 'reviews' | 'qa'>('menu');
  const menuRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const qaRef = useRef<HTMLDivElement>(null);
  const goTab = (k: 'menu' | 'info' | 'reviews' | 'qa') => {
    setTab(k);
    const ref = { menu: menuRef, info: infoRef, reviews: reviewsRef, qa: qaRef }[k];
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  // scroll-spy: highlight the tab of whichever section is currently under the header
  // as the user scrolls the card (root = the scrollable modal sheet).
  useEffect(() => {
    const root = sheetRef.current;
    if (!root) return;
    const sections: [React.RefObject<HTMLDivElement>, 'menu' | 'info' | 'reviews' | 'qa'][] = [
      [menuRef, 'menu'], [infoRef, 'info'], [reviewsRef, 'reviews'], [qaRef, 'qa'],
    ];
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const hit = vis[0] && sections.find(([r]) => r.current === vis[0].target);
        if (hit) setTab(hit[1]);
      },
      { root, rootMargin: '-46% 0px -50% 0px', threshold: 0 },
    );
    sections.forEach(([r]) => r.current && obs.observe(r.current));
    return () => obs.disconnect();
  }, [data]);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [qDraft, setQDraft] = useState('');
  const [aDraft, setADraft] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    api
      .listing(id)
      .then((d) => {
        setData(d);
        pushRecent({ ...(d as Listing), placeholderPhoto: d.placeholderPhotos?.[0] ?? null });
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    setData(null);
    setQuestions(null);
    setTab('menu');
    load();
  }, [load]);

  useEffect(() => {
    if (questions === null) {
      api.questions(id).then(setQuestions).catch(() => {});
    }
  }, [id, questions]);

  // when opened in "rate now" mode, kick off the rate flow once data is in
  const autoRatedRef = useRef(false);
  useEffect(() => {
    if (autoRate == null || !data || autoRatedRef.current) return;
    autoRatedRef.current = true;
    startRate(autoRate || undefined); // 0 = open the flow without a preselected star
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, autoRate]);

  // reflect whether this venue is already in the user's favorites
  useEffect(() => {
    api
      .favorites()
      .then((list) => setFav(list.some((f) => f.listingId === id)))
      .catch(() => {});
  }, [id]);
  const toggleFav = () => {
    const next = !fav;
    setFav(next);
    (next ? api.addFavorite(id) : api.removeFavorite(id)).catch(() => setFav(!next));
    onChanged?.();
  };

  const loadQuestions = () => api.questions(id).then(setQuestions).catch(() => {});
  const askQuestion = () => {
    const text = qDraft.trim();
    if (!text) return;
    api.askQuestion(id, text).then(() => {
      setQDraft('');
      loadQuestions();
    });
  };
  const answerQuestion = (qid: string) => {
    const text = aDraft[qid]?.trim();
    if (!text) return;
    api.answerQuestion(qid, text).then(() => {
      setADraft((d) => ({ ...d, [qid]: '' }));
      loadQuestions();
    });
  };

  if (!data) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          Загрузка…
        </div>
      </div>
    );
  }

  const isRestaurant = data.type === 'RESTAURANT';
  const hasGeo = typeof data.lat === 'number' && typeof data.lng === 'number';

  // collapse chains in "Где ещё попробовать" — one venue per name, with branch count
  const dedupedVenues = (() => {
    const counts = new Map<string, number>();
    for (const v of data.venues ?? []) {
      const k = (v.name ?? v.id).toLowerCase();
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const seen = new Set<string>();
    const out: Listing[] = [];
    for (const v of data.venues ?? []) {
      const k = (v.name ?? v.id).toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      const n = counts.get(k) ?? 1;
      out.push(n > 1 ? { ...v, branchCount: n } : v);
    }
    return out;
  })();

  // one card per venue NAME (collapses chains) in the item's "new dishes" carousel
  // «Новинки в заведениях» temporarily disabled (parsing paused). Restore by
  // returning the deduped data.events again.
  const dedupedItemEvents: NonNullable<typeof data.events> = [];

  // price of this item at the venue we'd rate it in (came from the card / recommendation,
  // or where the user tasted it) → shown on the photo + skips the price question in review
  const venuePrice: number | null =
    originVenue?.price ??
    (data.recVenue as any)?.price ??
    data.tastedAt?.find((x) => x.id === originVenue?.id)?.menuPrice ??
    null;

  // chain points sorted by distance (nearest first) when location is known
  const sortedBranches = (data.branches ?? []).slice().sort((a, b) => {
    if (!userLoc) return b.reviewCount - a.reviewCount;
    const dist = (x: { lat?: number | null; lng?: number | null }) => {
      if (x.lat == null || x.lng == null) return 1e9;
      const dx = x.lat - userLoc[0];
      const dy = x.lng - userLoc[1];
      return dx * dx + dy * dy;
    };
    return dist(a) - dist(b);
  });

  // context-aware place word for the "rate" CTA (coffee → кофейню, beer/wine → бар)
  const venueWord = (() => {
    const c = (data.category ?? '').toLowerCase();
    if (/кофе|coffee|эспрессо|латте|чай|tea/.test(c)) return 'кофейню';
    if (/пив|beer|ipa|лагер|эль|стаут|портер|вино|wine|коктейл|cocktail|шампан|игрист/.test(c))
      return 'бар';
    return 'ресторан';
  })();

  // Only REAL user photos populate the hero gallery; the seeded brand logo
  // (data.photoUrl) stays as the list thumbnail via VenuePhoto. When there are
  // no user photos, the backend supplies labeled stock placeholders instead.
  const galleryPhotos = Array.from(
    new Set([
      ...(data.checkinPhotos ?? []),
      ...(data.photos ?? []), // photos added straight to the card (no review)
      ...data.reviews.flatMap((r) => r.photoUrls ?? []),
    ]),
  );
  const galleryVideos = Array.from(new Set(data.reviews.flatMap((r) => r.videoUrls ?? [])));
  const media: { t: 'img' | 'video'; u: string }[] = [
    ...galleryPhotos.map((u) => ({ t: 'img' as const, u })),
    ...galleryVideos.map((u) => ({ t: 'video' as const, u })),
  ];

  const VOTE_LABEL: Record<VoteType, string> = {
    USEFUL: '👍 Полезно',
    FUNNY: '😄 Смешно',
    COOL: '😎 Круто',
    OHNO: '🙀 О нет',
  };
  const voteState = (r: Review): VoteState =>
    votes[r.id] ?? {
      counts: r.voteCounts ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
      mine: [],
    };
  const doVote = (reviewId: string, type: VoteType) => {
    api
      .vote(reviewId, type)
      .then((vs) => setVotes((prev) => ({ ...prev, [reviewId]: vs })))
      .catch(() => {});
  };
  const doClaim = () => {
    api
      .claim(data.id)
      .then(() => setClaimed(true))
      .catch(() => {});
  };

  function openRoute() {
    // Prefer exact COORDINATES (the venue's precise point) — a vague area address
    // like "мкр Пригородный Лес" resolves to the wrong spot / a 0 m route. Fall back
    // to the textual address only when the venue has no coordinates.
    const dest = hasGeo
      ? `${data.lat},${data.lng}`
      : data.address
        ? `${data.address}, Москва`
        : '';
    if (!dest) return;
    const open = (origin: string) =>
      openExternal(
        `https://yandex.ru/maps/?rtext=${encodeURIComponent(`${origin}~${dest}`)}&rtt=auto`,
      );
    // Ask for the user's current location to pre-fill "Откуда".
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => open(`${p.coords.latitude},${p.coords.longitude}`),
        () => open(''),
        { timeout: 5000, maximumAge: 60000 },
      );
    } else {
      open('');
    }
  }

  function openReview(rating?: number) {
    setReviewRating(rating);
    setShowReview(true);
  }

  // open a menu item from a restaurant — remember the venue so rating auto-attaches
  function openItemFromVenue(itemId: string) {
    if (data) setOriginVenue({ id: data.id, name: data.name });
    setId(itemId);
  }

  // Yelp-style menu card: big photo + price overlay + name + rating count
  const menuCard = (it: any) => (
    <button key={it.id} className="menu-card" onClick={() => openItemFromVenue(it.id)}>
      <div className="menu-card-media">
        <VenuePhoto listing={it} className="menu-card-photo" />
        {it.price ? <span className="menu-card-price">{it.price} ₽</span> : null}
      </div>
      <div className="menu-card-name">{it.name}</div>
      <div className="menu-card-meta">
        {it.venueReviews > 0 ? (
          <>
            <Stars value={it.venueRating ?? 0} />{' '}
            {(it.venueRating ?? 0).toFixed(1)} ({it.venueReviews})
          </>
        ) : (
          'Нет оценок'
        )}
      </div>
    </button>
  );

  // dishes/drinks are rated in the context of a venue → pick a restaurant first,
  // UNLESS we arrived from a specific restaurant's menu (then auto-attach there).
  function startRate(rating?: number) {
    if (isRestaurant) {
      openReview(rating);
      return;
    }
    if (originVenue) {
      api.linkItemToVenue(data.id, originVenue.id).catch(() => {});
      setReviewVenue(originVenue);
      openReview(rating);
      return;
    }
    setPendingRating(rating);
    setShowVenuePicker(true);
  }

  // tap a venue's "Новинка" card → add it to the menu and open it to rate (here)
  function rateNewDish(ev: { title?: string | null; photoUrl?: string | null }) {
    api
      .addItem(data.id, {
        type: 'DISH',
        name: (ev.title || 'Новинка').slice(0, 60),
        photoUrl: ev.photoUrl ?? undefined,
      })
      .then((item) => {
        const venue = { id: data.id, name: data.name };
        setOriginVenue(venue);
        setReviewVenue(venue);
        setId(item.id);
        setReviewTarget(item);
        setReviewRating(undefined);
        setShowReview(true);
      })
      .catch(() => {});
  }

  function share() {
    const link = 'https://t.me/togomoscow_bot';
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      nav.share({ title: data.name, url: link }).catch(() => {});
    } else {
      openExternal(
        `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(data.name)}`,
      );
    }
  }

  return (
    <div
      className={'modal-backdrop' + (closing ? ' closing' : '')}
      style={{ zIndex: 2500 }}
      onClick={requestClose}
    >
      <div className="modal" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
        <button className="card-back" onClick={requestClose} aria-label="Назад">
          ←
        </button>
        <div className="detail-media" ref={mediaRef}>
          <button
            className="heart heart-lg"
            onClick={toggleFav}
            aria-label="В избранное"
          >
            {fav ? '♥' : '♡'}
          </button>
          {/* price of this item at the venue → on the photo, bottom-left */}
          {!isRestaurant && venuePrice != null && (
            <span className="newdish-price detail-price-badge">{venuePrice} ₽</span>
          )}
          {/* rating right on the photo → visible without scrolling */}
          {!isRestaurant && (
            <div className="detail-rating-badge">
              {data.reviewCount > 0 ? `★ ${data.avgRating.toFixed(1)} (${data.reviewCount} ${ratingsWord(data.reviewCount)})` : 'Нет оценок'}
            </div>
          )}
          {media.length > 1 ? (
          <div className="gallery">
            {media.map((m, i) =>
              m.t === 'img' ? (
                <img key={i} className="gallery-img" src={m.u} alt="" loading="lazy" />
              ) : (
                <video key={i} className="gallery-img" src={m.u} controls playsInline />
              ),
            )}
          </div>
        ) : media.length === 1 ? (
          media[0].t === 'img' ? (
            <img className="detail-photo" src={media[0].u} alt={data.name} />
          ) : (
            <video className="detail-photo" src={media[0].u} controls playsInline />
          )
        ) : data.photoUrl ? (
          // no user photos yet → venue's own photo, marked illustrative (only here, inside the card)
          <div className={'stock-wrap' + (venuePrice != null ? ' has-price' : '')}>
            <VenuePhoto listing={data} className="detail-photo" />
            <span className="stock-badge">📷 Фото носит информационный характер · обновится после отзыва с фото</span>
          </div>
        ) : data.placeholderPhotos && data.placeholderPhotos.length === 1 ? (
          // single illustrative photo → fill the whole card width (equal margins)
          <div className={'stock-wrap' + (venuePrice != null ? ' has-price' : '')}>
            <img className="detail-photo" src={data.placeholderPhotos[0]} alt="" loading="lazy" />
            <span className="stock-badge">📷 Фото носит информационный характер · обновится после отзыва с фото</span>
          </div>
        ) : data.placeholderPhotos && data.placeholderPhotos.length > 0 ? (
          <div className="gallery">
            {data.placeholderPhotos.map((u, i) => (
              <div key={i} className="stock-wrap">
                <img className="gallery-img" src={u} alt="" loading="lazy" />
                <span className="stock-badge">📷 Фото носит информационный характер · обновится после отзыва с фото</span>
              </div>
            ))}
          </div>
          ) : (
            <VenuePhoto listing={data} className="detail-photo" />
          )}
        </div>
        <h3 style={{ marginTop: 12, fontSize: 24 }}>{data.name}</h3>

        <div className="rating-head">
          {data.reviewCount > 0 ? (
            <>
              <Stars value={data.avgRating} />
              <b>{data.avgRating.toFixed(1)}</b>
            </>
          ) : (
            <span className="no-rating">Нет оценок</span>
          )}
          <span className="meta" style={{ color: 'var(--hint)' }}>
            {data.reviewCount > 0 ? `(${data.reviewCount} ${ratingsWord(data.reviewCount)})` : ''}
            {data.chain ? ' · эта точка' : ''}
            {data.checkinCount ? ` · 📍 ${data.checkinCount} чек-инов` : ''}
          </span>
        </div>
        {data.chain && (
          <div className="meta" style={{ color: 'var(--hint)', marginTop: 4, fontSize: 13 }}>
            Рейтинг сети: <b style={{ color: 'var(--text)' }}>{data.chain.avgRating.toFixed(1)}</b> (
            {data.chain.reviewCount}) · {data.chain.branchCount} точек
          </div>
        )}

        <div className="info-line">
          {data.priceLevel ? <span>{'₽'.repeat(data.priceLevel)}</span> : null}
          <span>
            {[
              // "Блюдо"/"Напиток" is implied — show the cuisine/category instead
              isRestaurant ? TYPE_LABEL[data.type] : null,
              ...cuisineTags(data.cuisine),
              !isRestaurant && data.category && !/блюдо|напиток/i.test(data.category)
                ? data.category
                : null,
              // beer: show the derived style/type (Лагер, IPA, Стаут…)
              data.type === 'DRINK' && (data.category === 'Пиво' || beerStyle(data.name))
                ? `🍺 ${beerStyle(data.name) ?? 'Пиво'}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
          {data.openNow != null && (
            <span style={{ color: data.openNow ? '#2e7d32' : '#c62828', fontWeight: 700 }}>
              {data.openNow ? 'Открыто сейчас' : 'Закрыто'}
            </span>
          )}
        </div>

        {(data.cityLabel || (data.tags && data.tags.length > 0)) && (
          <div className="tags-row">
            {data.cityLabel && <span className="tag city">📍 {data.cityLabel}</span>}
            {data.tags
              ?.filter((t) => !/^(блюдо|напиток)$/i.test(t))
              .map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
          </div>
        )}
        {/* primary rate CTA — right under the category tag (Untappd-style).
            If the venue is already known (came from a recommendation), don't ask to pick one. */}
        {!isRestaurant && (
          <button className="btn rate-cta" onClick={() => startRate()}>
            {originVenue ? `⭐ Оценить в «${originVenue.name}»` : `⭐ Выбрать ${venueWord} и оценить`}
          </button>
        )}
        {/* restaurant: add-item CTA right after the tags, above Маршрут/Поделиться */}
        {isRestaurant && (
          <button className="btn rate-cta" onClick={() => setShowAddItem(true)}>
            ➕ Добавить блюдо или напиток и оценить
          </button>
        )}
        {!isRestaurant && likeProb?.probability != null && (
          <div className="like-prob">
            <div className="lp-row">
              <span className="lp-pct">🎯 {likeProb.probability}%</span>
              <span className="lp-label">вероятность, что вам понравится</span>
            </div>
            {likeProb.reason && <div className="lp-reason">{likeProb.reason}</div>}
          </div>
        )}
        {/* where this item is best — always visible (no unlock gate) */}
        {!isRestaurant && data.bestVenue && (
          <div className="best-venue">
            🏆 Лучше всего в: <b>{data.bestVenue.name}</b> — {data.bestVenue.rating.toFixed(1)}★
          </div>
        )}
        {!isRestaurant && !data.bestVenue && !isUnlocked(data.category) && data.category && (
          <div className="rank-locked">
            🔒 Рейтинг «лучшее место» по категории «{data.category}» откроется после{' '}
            {threshold} ваших оценок — это обучает рекомендации.{' '}
            <b>
              {countFor(data.category)}/{threshold}
            </b>
          </div>
        )}
        {!isRestaurant && data.tastedAt && data.tastedAt.length > 0 && (
          <>
            <div className="section-title big" style={{ marginTop: 8, marginBottom: 0 }}>🏆 Лучшие места</div>
            <div className="meta" style={{ color: 'var(--hint)', margin: '0 4px 6px' }}>
              где этот{data.type === 'DRINK' ? ' напиток' : ' блюдо'} вкуснее всего — по его рейтингу, а не рейтингу заведения
            </div>
            <MiniRow items={data.tastedAt as Listing[]} onPick={(l) => l.id && setId(l.id)} />
          </>
        )}
        {!isRestaurant && dedupedItemEvents.length > 0 && (
          <>
            <div className="section-title" style={{ marginTop: 8 }}>Новинки в заведениях</div>
            <div className="feed">
              {dedupedItemEvents.map((ev) => (
                <button
                  key={ev.id}
                  className="myrate-card"
                  onClick={() => ev.venue?.id && setId(ev.venue.id)}
                >
                  <div className="newdish-media">
                    {ev.photoUrl ? (
                      <img className="myrate-photo" src={ev.photoUrl} alt="" loading="lazy" />
                    ) : (
                      <div className="myrate-photo ph" style={{ background: '#caa' }}>🍽</div>
                    )}
                    {ev.price ? <span className="newdish-price">{ev.price} ₽</span> : null}
                  </div>
                  {/* already arrived via the новинка → show WHERE (venue + short address), not the dish name again */}
                  <div className="myrate-name">{ev.venue?.name}</div>
                  <div className="myrate-place">📍 {ev.venue?.address || ev.venue?.cityLabel || 'Москва'}</div>
                </button>
              ))}
            </div>
          </>
        )}
        {data.featuredReview && (
          <div className="featured-review">
            <div className="fr-head">
              <Stars value={data.featuredReview.rating} />
              <b>{data.featuredReview.user?.firstName ?? data.featuredReview.user?.username ?? 'Гость'}</b>
            </div>
            <div className="fr-text">«{data.featuredReview.text}»</div>
          </div>
        )}

        <div className="actions-row">
          {data.phone && (
            // native tel: link (best-effort call) + clipboard fallback (webview may block tel:)
            <a
              className="action"
              href={telHref(data.phone)}
              onClick={(e) => { e.preventDefault(); callPhone(data.phone!, data.name, `l_${data.id}`); }}
            >
              <span className="ico">📞</span>
              Позвонить
            </a>
          )}
          {(data.address || hasGeo) && (
            <button className="action" onClick={openRoute}>
              <span className="ico">🧭</span>
              Маршрут
            </button>
          )}
          {(data.links?.website || data.website) && (
            <button className="action" onClick={() => openExternal((data.links?.website || data.website) as string)}>
              <span className="ico">🌐</span>
              Сайт
            </button>
          )}
          {data.links?.telegram && (
            <button className="action" onClick={() => openExternal(data.links!.telegram as string)}>
              <span className="ico">✈️</span>
              Telegram
            </button>
          )}
          {data.links?.vk && (
            <button className="action" onClick={() => openExternal(data.links!.vk as string)}>
              <span className="ico">🅥</span>
              VK
            </button>
          )}
          <button className="action" onClick={share}>
            <span className="ico">↗</span>
            Поделиться
          </button>
          <button className="action" onClick={() => startRate()}>
            <span className="ico">✎</span>
            Оценить
          </button>
        </div>

        {isRestaurant && data.phone && (
          <a
            className="btn order-cta"
            href={telHref(data.phone)}
            onClick={(e) => { e.preventDefault(); callPhone(data.phone!, data.name, `l_${data.id}`); }}
          >
            📞 Забронировать
          </a>
        )}

        {(data.deliveryYandex || data.deliverySamokat || data.deliveryVk) && (
          <div className="delivery-row">
            <span className="meta" style={{ color: 'var(--hint)' }}>Доставка:</span>
            {data.deliveryYandex && (
              <button className="deliv-btn" onClick={() => openExternal(data.deliveryYandex as string)}>
                Яндекс Еда
              </button>
            )}
            {data.deliverySamokat && (
              <button className="deliv-btn" onClick={() => openExternal(data.deliverySamokat as string)}>
                Самокат
              </button>
            )}
            {data.deliveryVk && (
              <button className="deliv-btn" onClick={() => openExternal(data.deliveryVk as string)}>
                VK Еда
              </button>
            )}
          </div>
        )}

        {isRestaurant && (
          <div className="recommend">
            <span className="rec-q">Советуете это место?</span>
            <div className="rec-opts">
              <button className="chip" onClick={() => startRate(5)}>Да</button>
              <button className="chip" onClick={() => startRate(3)}>Возможно</button>
              <button className="chip" onClick={() => startRate(2)}>Нет</button>
            </div>
          </div>
        )}

        <div className="tabbar">
          {(
            [
              ['menu', 'Меню'],
              ['info', 'Инфо'],
              ['reviews', `Отзывы (${data.reviewCount})`],
              ['qa', 'Вопросы'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              className={'tab' + (tab === k ? ' active' : '')}
              onClick={() => goTab(k)}
            >
              {label}
            </button>
          ))}
        </div>

        <div ref={menuRef} className="feed-section">
          <div className="tab-pane">
            {isRestaurant ? (
              <>
                {data.topDishes.length > 0 && (
                  <>
                    <div className="section-title">Блюда</div>
                    <div className="feed">{(data.topDishes as any[]).map(menuCard)}</div>
                  </>
                )}
                {data.topDrinks.length > 0 && (
                  <>
                    <div className="section-title">Напитки</div>
                    <div className="feed">{(data.topDrinks as any[]).map(menuCard)}</div>
                  </>
                )}
                {data.pendingItems.length > 0 && (
                  <>
                    <div className="section-title">Предложено посетителями</div>
                    <MiniRow items={data.pendingItems} onPick={(l) => openItemFromVenue(l.id)} />
                  </>
                )}
                {data.topDishes.length === 0 &&
                  data.topDrinks.length === 0 &&
                  data.pendingItems.length === 0 && (
                    <div className="meta" style={{ color: 'var(--hint)', padding: '8px 2px' }}>
                      Меню пока пустое — добавьте первую позицию кнопкой выше.
                    </div>
                  )}
              </>
            ) : (
              <>
                {dedupedVenues.length > 0 ? (
                  <>
                    <div className="section-title">
                      {data.tastedAt && data.tastedAt.length > 0 ? 'Где ещё попробовать' : 'Где попробовать'}
                    </div>
                    <MiniRow
                      items={dedupedVenues}
                      onPick={(l) => {
                        setOriginVenue(null); // opening a venue, not coming from one
                        setId(l.id);
                      }}
                    />
                  </>
                ) : (
                  !(data.tastedAt && data.tastedAt.length > 0) && (
                    <div className="meta" style={{ color: 'var(--hint)', padding: '8px 2px' }}>
                      Ещё не отмечено ни в одном заведении.
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </div>

        <div ref={infoRef} className="feed-section">
          <div className="section-title big">Инфо</div>
          <div className="tab-pane">
            {/* clean row list (Yelp-style): hours · website · call · address.
                Render only when there's at least one row — otherwise the bordered
                box shows as an empty grey line (dishes/drinks have no such info). */}
            {(data.hours || data.links?.website || data.website || data.phone || data.address) && (
            <div className="info-list">
              {data.hours && (
                <div className="info-row">
                  <span className="ir-ico">🕒</span>
                  <div className="ir-body">
                    <div className="ir-title">Часы работы</div>
                    <div className="ir-sub">
                      {(() => {
                        const st = openStatus(data.hours);
                        return st ? (
                          <b style={{ color: st.open ? '#2e7d32' : 'var(--accent)' }}>{st.text}</b>
                        ) : null;
                      })()}
                      {openStatus(data.hours) ? ' · ' : ''}
                      {data.hours}
                    </div>
                  </div>
                </div>
              )}
              {(data.links?.website || data.website) && (
                <button className="info-row" onClick={() => openExternal((data.links?.website || data.website) as string)}>
                  <span className="ir-ico">🌐</span>
                  <div className="ir-body">
                    <div className="ir-title">Сайт</div>
                    <div className="ir-sub">
                      {String(data.links?.website || data.website).replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </div>
                  </div>
                  <span className="ir-chev">↗</span>
                </button>
              )}
              {data.phone && (
                <a
                  className="info-row"
                  href={telHref(data.phone)}
                  onClick={(e) => { e.preventDefault(); callPhone(data.phone!, data.name, `l_${data.id}`); }}
                >
                  <span className="ir-ico">📞</span>
                  <div className="ir-body">
                    <div className="ir-title">Позвонить</div>
                    <div className="ir-sub">{data.phone}</div>
                  </div>
                  <span className="ir-chev">›</span>
                </a>
              )}
              {data.address && (
                <button className="info-row" onClick={openRoute}>
                  <span className="ir-ico">📍</span>
                  <div className="ir-body">
                    <div className="ir-title">Адрес</div>
                    <div className="ir-sub">{data.address}</div>
                  </div>
                  <span className="ir-chev">›</span>
                </button>
              )}
            </div>
            )}
            {data.description && (
              <p style={{ color: 'var(--hint)', fontSize: 14, marginTop: 8 }}>{data.description}</p>
            )}
            {data.amenities &&
              (
                [
                  ['features', 'Особенности'],
                  ['accessibility', 'Доступность'],
                  ['payments', 'Оплата'],
                  ['diet', 'Питание'],
                ] as const
              ).map(([key, label]) => {
                const items = data.amenities?.[key];
                if (!items || items.length === 0) return null;
                return (
                  <div key={key} className="amenity-group">
                    <div className="section-title">{label}</div>
                    <div className="tags-row">
                      {items.map((a) => (
                        <span key={a} className="tag">
                          ✓ {a}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            {hasGeo && (
              <div style={{ marginTop: 12 }}>
                <MapView
                  points={[
                    {
                      id: data.id,
                      name: data.name,
                      lat: data.lat as number,
                      lng: data.lng as number,
                      type: data.type,
                    },
                  ]}
                  center={[data.lat as number, data.lng as number]}
                  zoom={15}
                  cluster={false}
                  height={180}
                />
              </div>
            )}
            <button
              className="link-btn report-line"
              onClick={() => setShowCorrection(true)}
            >
              ✏️ Сообщить о неточности / дополнить
            </button>
          </div>
        </div>

        {isRestaurant && data.events && data.events.some((e) => e.kind === 'dish') && (
          <div className="feed-section">
            <div className="section-title big">Новинки</div>
            <div className="feed">
              {data.events
                .filter((e) => e.kind === 'dish')
                .map((ev) => (
                  <button key={ev.id} className="menu-card" onClick={() => rateNewDish(ev)}>
                    <div className="menu-card-media">
                      {ev.photoUrl ? (
                        <img className="menu-card-photo" src={ev.photoUrl} alt="" loading="lazy" />
                      ) : (
                        <div className="menu-card-photo ph">🆕</div>
                      )}
                      {ev.price ? <span className="menu-card-price">{ev.price} ₽</span> : null}
                    </div>
                    <div className="menu-card-name">{ev.title || 'Новинка'}</div>
                    <div className="menu-card-meta">🆕 Новинка · оценить</div>
                  </button>
                ))}
            </div>
          </div>
        )}
        {isRestaurant && data.events && data.events.some((e) => e.kind === 'schedule') && (
          <div className="feed-section">
            <div className="section-title big">Изменения в работе</div>
            <div className="tab-pane">
              {data.events
                .filter((e) => e.kind === 'schedule')
                .slice(0, 4)
                .map((ev) => (
                  <div key={ev.id} className="sched-line">
                    🕒 {(ev.title || ev.text || '').slice(0, 110)}
                  </div>
                ))}
            </div>
          </div>
        )}

        {data.branches && data.branches.length > 0 && (
          <div className="feed-section">
            <div className="section-title big">Точки сети ({data.branches.length + 1})</div>
            {/* each branch is its own card WITH its address (no chain-collapse here) */}
            <div className="feed">
              {(sortedBranches as Listing[]).map((b) => (
                <button key={b.id} className="myrate-card" onClick={() => setId(b.id)}>
                  <div className="newdish-media">
                    <VenuePhoto listing={b} className="myrate-photo" />
                  </div>
                  <div className="myrate-name">{b.name}</div>
                  <div className="myrate-place">📍 {b.address || b.cityLabel || 'Москва'}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 🤖 Похожие — embedding neighbours; gated (hidden for new users) */}
        {!isRestaurant && <SimilarItems id={data.id} onOpen={(lid) => setId(lid)} />}

        <div ref={reviewsRef} className="feed-section">
          <div className="section-title big">Отзывы ({data.reviewCount})</div>
          <div className="tab-pane">
            <div className="rate-block">
              <div className="rb-head">
                <div className="rb-avatar">👤</div>
                <div>
                  <div className="rb-name">Оцените {isRestaurant ? 'заведение' : 'позицию'}</div>
                  <div className="rb-sub">Нажмите на звёзды или добавьте фото</div>
                </div>
              </div>
              <div className="rate-stars" onMouseLeave={() => setHoverRate(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={'rate-star' + (n <= hoverRate ? ' on' : '')}
                    onMouseEnter={() => setHoverRate(n)}
                    onClick={() => startRate(n)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div className="rate-actions">
                <button className="rate-act" onClick={() => photoInputRef.current?.click()} disabled={photoBusy}>
                  {photoBusy ? '⏳ Загрузка…' : '📷 Добавить фото'}
                </button>
                <button className="rate-act primary" onClick={() => startRate()}>
                  ⭐ Оценить
                </button>
              </div>
              {/* "Добавить фото" uploads a photo to this card WITHOUT a review/rating */}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  setPhotoBusy(true);
                  try {
                    const url = await api.upload(file);
                    await api.addPhoto(data.id, url);
                    load();
                  } catch { /* ignore */ }
                  setPhotoBusy(false);
                }}
              />
            </div>
            {data.reviews.length > 0 && (
              <div className="histogram">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = data.reviews.filter((r) => Math.round(r.rating) === star).length;
                  const pct = (count / data.reviews.length) * 100;
                  return (
                    <div key={star} className="hist-row">
                      <span className="hist-label">{star}★</span>
                      <div className="hist-bar">
                        <div className="hist-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="hist-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {data.reviews.length === 0 ? (
              <div className="meta" style={{ padding: '6px 2px', color: 'var(--hint)' }}>
                Пока нет отзывов. Будьте первым!
              </div>
            ) : (
              data.reviews.map((r) => (
                <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <b>{r.user?.firstName ?? r.user?.username ?? 'Гость'}</b>
                    <Stars value={r.rating} />
                  </div>
                  {!isRestaurant && r.venue && (
                    <div style={{ fontSize: 13, color: 'var(--hint)', marginTop: 2 }}>
                      📍 {r.venue.name}
                    </div>
                  )}
                  {r.text && <div style={{ fontSize: 14, marginTop: 2 }}>{r.text}</div>}
                  <ReviewAttrs attributes={r.attributes} />
                  {(r.photoUrls?.length > 0 || r.videoUrls?.length > 0) && (
                    <div className="photo-thumbs">
                      {r.photoUrls?.map((u) => (
                        <img key={u} src={u} alt="" />
                      ))}
                      {r.videoUrls?.map((u) => (
                        <video key={u} src={u} controls playsInline />
                      ))}
                    </div>
                  )}
                  <div className="vote-row">
                    {(['USEFUL', 'FUNNY', 'COOL', 'OHNO'] as VoteType[]).map((t) => {
                      const vs = voteState(r);
                      return (
                        <button
                          key={t}
                          className={'vote-btn' + (vs.mine.includes(t) ? ' active' : '')}
                          onClick={() => doVote(r.id, t)}
                        >
                          {VOTE_LABEL[t]}
                          {vs.counts[t] ? ` ${vs.counts[t]}` : ''}
                        </button>
                      );
                    })}
                  </div>
                  {r.ownerReply && (
                    <div className="owner-reply">
                      <b>Ответ заведения:</b> {r.ownerReply}
                    </div>
                  )}
                </div>
              ))
            )}
            {isRestaurant && (
              <div className="claim-line">
                {claimed ? (
                  <span style={{ color: 'var(--hint)' }}>
                    Заявка на владение отправлена на проверку ✓
                  </span>
                ) : (
                  <button className="link-btn" onClick={doClaim}>
                    Вы владелец этого места? Заявить права
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div ref={qaRef} className="feed-section">
          <div className="section-title big">Вопросы</div>
          <div className="tab-pane">
            <div className="qa-ask">
              <input
                placeholder="Спросить у сообщества…"
                value={qDraft}
                onChange={(e) => setQDraft(e.target.value)}
              />
              <button className="btn" style={{ width: 'auto' }} onClick={askQuestion}>
                Спросить
              </button>
            </div>
            {questions === null ? (
              <div className="meta" style={{ color: 'var(--hint)', padding: '8px 2px' }}>Загрузка…</div>
            ) : questions.length === 0 ? (
              <div className="meta" style={{ color: 'var(--hint)', padding: '8px 2px' }}>
                Вопросов пока нет. Задайте первый!
              </div>
            ) : (
              questions.map((q) => (
                <div key={q.id} className="qa-item">
                  <div className="qa-q">
                    <b>{q.user?.firstName ?? 'Гость'}:</b> {q.text}
                  </div>
                  {q.answers.map((a) => (
                    <div key={a.id} className="qa-a">
                      ↳ <b>{a.user?.firstName ?? 'Гость'}:</b> {a.text}
                    </div>
                  ))}
                  <div className="qa-answer">
                    <input
                      placeholder="Ответить…"
                      value={aDraft[q.id] ?? ''}
                      onChange={(e) => setADraft((d) => ({ ...d, [q.id]: e.target.value }))}
                    />
                    <button className="link-btn" onClick={() => answerQuestion(q.id)}>
                      Ответить
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {data.similar && data.similar.length > 0 && (
          <div className="feed-section">
            <div className="section-title big">Похожие места</div>
            {data.similar.map((l) => (
              <ListRow key={l.id} listing={l} onClick={() => setId(l.id)} />
            ))}
          </div>
        )}

        <button className="btn secondary" style={{ marginTop: 16 }} onClick={requestClose}>
          Закрыть
        </button>
      </div>

      {showReview && (
        <ReviewForm
          listing={reviewTarget ?? data}
          venue={reviewVenue}
          initialRating={reviewRating}
          // item already has a price at this venue → don't ask for it again in the review
          knownPrice={reviewTarget ? null : venuePrice}
          onClose={() => {
            setShowReview(false);
            setReviewTarget(null);
            setReviewVenue(null);
          }}
          onSaved={(media) => {
            const ratedId = reviewTarget?.id ?? data.id;
            setShowReview(false);
            // first review of the card → discovery phrase; else a rotating one
            const phrase = data.reviewCount === 0
              ? '🏅 Вы открыли это для сообщества — вы первый дегустатор!'
              : RATE_PHRASES[Math.floor(Math.random() * RATE_PHRASES.length)];
            setRateToast(phrase);
            setTimeout(() => setRateToast(''), 3200);
            setReviewTarget(null);
            setReviewVenue(null);
            load();
            onChanged?.();
            // share to story right after the review — ONLY the user's own photo/video,
            // and only if they actually attached one (no photo → don't offer).
            const myMedia = media?.photo ?? media?.video;
            // remember this check-in's own photo + note so "Отправить другу" sends them
            shareRef.current = { photo: media?.photo, text: media?.text };
            // setting "не выставлять оценки в сторис" (Профиль) disables the auto-story
            const noStory = localStorage.getItem('noStoryOnReview') === '1';
            if (myMedia && data.type !== 'RESTAURANT' && !noStory) {
              // the user's own note becomes the story caption; fall back to the name
              const caption = media?.text?.trim() || `${data.name} — пробую в togomoscow 🍽`;
              if (media?.photo) {
                // compose a real 9:16 slide: photo CONTAIN (horizontal shots no longer
                // stretched) + the app link pill bottom-right baked into the image
                composeStoryImage(media.photo).then((slide) =>
                  shareToStory(slide ?? myMedia, caption, `l_${data.id}`),
                );
              } else {
                shareToStory(myMedia, caption, `l_${data.id}`); // video → as-is
              }
            }
            // instant meaning: where this lands in your personal ranking + what to taste next
            if (data.type !== 'RESTAURANT') {
              api
                .tasteRanking(ratedId)
                .then((r) => {
                  if (r && r.total > 0) setTasteResult({ data: r, itemId: ratedId });
                })
                .catch(() => {});
            }
          }}
        />
      )}
      {rateToast && <div className="game-toast">{rateToast}</div>}
      {tasteResult && (
        <TasteResult
          data={tasteResult.data}
          itemId={tasteResult.itemId}
          onClose={() => setTasteResult(null)}
          onCompareNext={(next) => {
            setTasteResult(null);
            setId(next.id); // open the next item to taste & compare
          }}
          onShareFriend={async () => {
            const caption = shareRef.current.text?.trim() || `Зацени — ${data.name} в togomoscow 🍽`;
            const photo = shareRef.current.photo;
            try {
              // rich message: photo + caption + "Open" button, no raw long link
              const { id } = await api.preparePost({ listingId: data.id, text: caption, photoUrl: photo });
              if (shareMessage(id)) return;
            } catch { /* fall back below */ }
            shareToChat(caption, `l_${data.id}`, photo);
          }}
        />
      )}
      {showCorrection && (
        <CorrectionModal
          listingId={data.id}
          venueName={data.name}
          onClose={() => setShowCorrection(false)}
        />
      )}
      {showVenuePicker && (
        <VenuePicker
          onClose={() => setShowVenuePicker(false)}
          onPick={(venue) => {
            api.linkItemToVenue(data.id, venue.id).catch(() => {});
            setReviewVenue({ id: venue.id, name: venue.name });
            setShowVenuePicker(false);
            load(); // venue now appears in "Где попробовать"
            openReview(pendingRating); // …and rate it (with the star you tapped, if any)
            setPendingRating(undefined);
          }}
          onAdded={(placeName) => {
            // place is pending moderation — rate now, attach the name, link later
            setReviewVenue({ name: placeName, pending: true });
            setShowVenuePicker(false);
            openReview(pendingRating);
            setPendingRating(undefined);
          }}
        />
      )}
      {showAddItem && (
        <AddItemModal
          venueId={data.id}
          venueName={data.name}
          onClose={() => setShowAddItem(false)}
          onAdded={(item) => {
            // capture the venue we're adding it AT before setId swaps `data`
            const venue = { id: data.id, name: data.name };
            setShowAddItem(false);
            setOriginVenue(venue);
            setReviewVenue(venue); // so the rating attaches to THIS venue, not another
            setId(item.id); // jump to the new item
            setReviewTarget(item); // …and open its review form right away
            setReviewRating(undefined);
            setShowReview(true);
          }}
        />
      )}
    </div>
  );
}
