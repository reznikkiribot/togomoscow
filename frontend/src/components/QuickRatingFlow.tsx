import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { useEscClose } from '../modalEsc';
import { getRecent } from '../recent';
import { useSwipeDismiss } from '../swipeDismiss';
import { templateFor } from '../tasting';
import { haptic } from '../telegram';
import type { Listing, Review } from '../types';
import { StarInput } from './StarInput';
import { Stars } from './Stars';

type VenueChoice = Pick<Listing, 'id' | 'name' | 'address' | 'lat' | 'lng' | 'groupKey'>;

function dedupeVenues(items: VenueChoice[]) {
  const seen = new Set<string>();
  return items.filter((venue) => {
    const key = (venue.groupKey || venue.name).trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function distanceSq(venue: VenueChoice, point: { lat: number; lng: number } | null) {
  if (!point || venue.lat == null || venue.lng == null) return Number.POSITIVE_INFINITY;
  const latScale = Math.cos((point.lat * Math.PI) / 180);
  return (venue.lat - point.lat) ** 2 + ((venue.lng - point.lng) * latScale) ** 2;
}

export function QuickRatingFlow({
  listing,
  initialRating = 0,
  onClose,
  onSaved,
}: {
  listing: Listing;
  initialRating?: number;
  onClose: () => void;
  onSaved?: (review: Review, listing: Listing) => void;
}) {
  const [item, setItem] = useState(listing);
  const [rating, setRating] = useState(initialRating);
  const [venue, setVenue] = useState<VenueChoice | null>(() =>
    listing.recVenue?.id ? { id: listing.recVenue.id, name: listing.recVenue.name } : null,
  );
  const [query, setQuery] = useState('');
  const [venues, setVenues] = useState<VenueChoice[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [text, setText] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [choices, setChoices] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    item: Listing;
    rating: number;
    total: number;
    next: Listing | null;
  } | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const tpl = useMemo(() => templateFor(item), [item]);
  const close = useCallback(() => {
    if (!busy) onClose();
  }, [busy, onClose]);

  useEscClose(close);
  useSwipeDismiss(sheetRef, close, { canDismiss: () => !busy, deps: [success] });

  const locate = useCallback(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => setPosition({ lat: coords.latitude, lng: coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 10 * 60_000 },
    );
  }, []);

  useEffect(() => {
    // Do not interrupt a just-tapped rating with a permission prompt. Reuse an
    // already granted location; otherwise location stays an explicit action.
    navigator.permissions?.query({ name: 'geolocation' }).then((permission) => {
      if (permission.state === 'granted') locate();
    }).catch(() => {});
  }, [locate]);

  useEffect(() => {
    if (success) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoadingVenues(true);
      try {
        const remote = query.trim()
          ? await api.searchVenues(query.trim())
          : await api.placesForItem(item.id)
              .then((items) => items.length ? items : api.listings('RESTAURANT', undefined, { take: 25 }))
              .catch(() => api.listings('RESTAURANT', undefined, { take: 25 }).catch(() => [] as Listing[]));
        const recent = query.trim() ? [] : getRecent().filter((entry) => entry.type === 'RESTAURANT');
        const recommended = item.recVenue?.id
          ? [{ id: item.recVenue.id, name: item.recVenue.name } as VenueChoice]
          : [];
        if (!cancelled) setVenues(dedupeVenues([...recommended, ...recent, ...remote]).slice(0, 30));
      } catch {
        if (!cancelled) setVenues([]);
      } finally {
        if (!cancelled) setLoadingVenues(false);
      }
    }, query.trim() ? 180 : 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [item, query, success]);

  const shownVenues = useMemo(() => {
    if (query.trim() || !position) return venues;
    return venues.slice().sort((a, b) => distanceSq(a, position) - distanceSq(b, position));
  }, [position, query, venues]);

  const pickChoice = (key: string, option: string, multi?: boolean) => {
    setChoices((current) => {
      const selected = current[key] ?? [];
      if (multi) {
        return { ...current, [key]: selected.includes(option) ? selected.filter((value) => value !== option) : [...selected, option] };
      }
      return { ...current, [key]: selected[0] === option ? [] : [option] };
    });
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length || busy) return;
    setBusy(true);
    setError(null);
    try {
      const uploaded = await Promise.all(Array.from(files).map((file) => api.upload(file)));
      setPhotoUrls((current) => [...current, ...uploaded]);
    } catch {
      setError('Не удалось загрузить фото. Оценку можно сохранить без него.');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (busy || rating <= 0 || !venue) return;
    setBusy(true);
    setError(null);
    try {
      const review = await api.createReview(item.id, {
        rating,
        text: text.trim() || undefined,
        photoUrls,
        attributes: {
          template: tpl.id,
          choices,
          venueId: venue.id,
        },
      });
      haptic('medium');
      onSaved?.(review, item);
      setSuccess({ item, rating, total: 1, next: null });
      Promise.all([
        api.myReviews().catch(() => [] as Review[]),
        api.recsysFeed(10).then((items) => items.length ? items : api.recommended()).catch(() => [] as Listing[]),
      ]).then(([reviews, recs]) => {
        setSuccess((current) => current?.item.id === item.id
          ? { ...current, total: Math.max(current.total, reviews.length), next: recs.find((candidate) => candidate.id !== item.id) ?? null }
          : current);
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить оценку. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const rateNext = (next: Listing) => {
    setItem(next);
    setRating(0);
    setVenue(next.recVenue?.id ? { id: next.recVenue.id, name: next.recVenue.name } : null);
    setQuery('');
    setText('');
    setPhotoUrls([]);
    setChoices({});
    setDetailsOpen(false);
    setError(null);
    setSuccess(null);
  };

  if (success) {
    return (
      <div className="modal-backdrop quick-rate-backdrop" style={{ zIndex: 3400 }} onClick={close}>
        <div className="modal quick-success" ref={sheetRef} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
          <div className="tr-success-icon">✓</div>
          <h3>Оценка сохранена</h3>
          <div className="quick-success-rating">
            <span>{success.item.name}</span>
            <Stars value={success.rating} size={18} />
            <b>{success.rating.toFixed(1)}</b>
          </div>
          <div className="tr-progress">
            {success.total < 5
              ? `${success.total} из 5 оценок — скоро персональные рекомендации`
              : 'Персональные рекомендации уже становятся точнее'}
          </div>
          {success.next && (
            <div className="quick-next">
              <span>Попробуйте оценить следующее</span>
              <b>{success.next.name}</b>
              <button className="btn" type="button" onClick={() => rateNext(success.next!)}>Оценить её тоже</button>
            </div>
          )}
          <button className="btn secondary" type="button" onClick={close}>Закрыть</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop quick-rate-backdrop" style={{ zIndex: 3400 }} onClick={close}>
      <div className="modal quick-rate-sheet" ref={sheetRef} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-grab" aria-hidden="true" />
        <button className="quick-close" type="button" onClick={close} aria-label="Закрыть">×</button>
        <h3>{item.name}</h3>

        <section className="quick-step">
          <div className="quick-step-label"><span>1</span> Ваша оценка</div>
          <div className="quick-stars"><StarInput value={rating} onChange={setRating} /><b>{rating ? rating.toFixed(1) : ''}</b></div>
        </section>

        <section className="quick-step">
          <div className="quick-step-label"><span>2</span> Где пробовали?</div>
          {venue && <div className="quick-selected">✓ {venue.name}</div>}
          <div className="pu-search quick-venue-search">
            <span className="search-ico">🔍</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти заведение" />
          </div>
          {!query.trim() && (
            <div className="quick-venue-hint">
              <span>Ближайшие и недавние места</span>
              {!position && navigator.geolocation && <button type="button" onClick={locate}>Найти рядом</button>}
            </div>
          )}
          <div className="quick-venue-list">
            {loadingVenues ? <div className="quick-loading">Ищем места…</div> : shownVenues.slice(0, 10).map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                className={'quick-venue-row' + (venue?.id === candidate.id ? ' selected' : '')}
                onClick={() => setVenue(candidate)}
              >
                <span>{candidate.name}</span>
                {candidate.address && <small>{candidate.address}</small>}
              </button>
            ))}
            {!loadingVenues && shownVenues.length === 0 && <div className="quick-loading">Ничего не нашли — попробуйте другой запрос</div>}
          </div>
        </section>

        <details className="quick-details" open={detailsOpen} onToggle={(event) => setDetailsOpen(event.currentTarget.open)}>
          <summary>Добавить подробности — необязательно</summary>
          <div className="field">
            <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Комментарий" />
          </div>
          <label className="quick-photo-btn">
            📷 Добавить фото
            <input type="file" accept="image/*" multiple hidden onChange={(event) => addPhotos(event.target.files)} />
          </label>
          {photoUrls.length > 0 && (
            <div className="photo-thumbs">
              {photoUrls.map((url) => (
                <div className="thumb-wrap" key={url}>
                  <img src={url} alt="" />
                  <button type="button" className="thumb-del" onClick={() => setPhotoUrls((current) => current.filter((value) => value !== url))}>×</button>
                </div>
              ))}
            </div>
          )}
          {tpl.choices.map((choice) => (
            <div className="field" key={choice.key}>
              <label>{choice.label}</label>
              <div className="chips scroll-row">
                {choice.options.map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={'chip' + ((choices[choice.key] ?? []).includes(option) ? ' active' : '')}
                    onClick={() => pickChoice(choice.key, option, choice.multi)}
                  >{option}</button>
                ))}
              </div>
            </div>
          ))}
        </details>

        {error && <p className="quick-error" role="alert">{error}</p>}
        <button className="btn quick-save" type="button" disabled={busy || rating <= 0 || !venue} onClick={save}>
          {busy ? 'Сохраняем…' : 'Сохранить оценку'}
        </button>
        {rating > 0 && !venue && <div className="quick-required">Выберите заведение, чтобы сохранить</div>}
      </div>
    </div>
  );
}
