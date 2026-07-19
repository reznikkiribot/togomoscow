import { useCallback, useEffect, useState, useRef } from 'react';
import { api } from '../api';
import { composeStoryImage } from '../storyImage';
import { useSwipeDismiss } from '../swipeDismiss';
import { useEscClose } from '../modalEsc';
import type { Listing, PublicUser, Review } from '../types';
import { StarInput } from './StarInput';
import { templateFor } from '../tasting';

export type ReviewSavedMedia = {
  photo?: string;
  photos?: string[];
  video?: string;
  text?: string;
  slides?: Record<string, string>;
  review?: Review;
};

type ReviewDraft = {
  rating: number;
  text: string;
  choices: Record<string, string[]>;
  ratings: Record<string, number>;
  price: string;
  visitDate: string;
  photoUrls: string[];
  videoUrls: string[];
  tagged: string[];
};

function readDraft(key: string): Partial<ReviewDraft> | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

export function ReviewForm({
  listing,
  venue,
  existing,
  initialRating,
  initialPhotoUrls,
  knownPrice,
  onClose,
  onSaved,
}: {
  listing: Listing;
  venue?: { id?: string; name: string; pending?: boolean } | null;
  existing?: Review;
  initialRating?: number;
  initialPhotoUrls?: string[]; // e.g. the photo the user just scanned — prefilled
  knownPrice?: number | null; // item already has a price here → don't ask for it
  onClose: () => void;
  onSaved: (media?: ReviewSavedMedia) => void;
}) {
  const tpl = templateFor(listing);
  const prev = (existing?.attributes ?? {}) as Record<string, any>;
  const draftKey = `reviewDraft:v2:${listing.id}:${existing?.id ?? 'new'}`;
  const [restoredDraft] = useState(() => {
    const current = readDraft(draftKey);
    if (current) return current;
    // v1 auto-saved the implicit 5★ as soon as the form opened. Preserve the
    // user's text/media, but require an explicit rating after migrating that draft.
    const legacy = readDraft(`reviewDraft:v1:${listing.id}:${existing?.id ?? 'new'}`);
    return legacy ? { ...legacy, rating: undefined } : null;
  });

  // if the item already IS a specific option (e.g. "Капучино"), pre-fill that
  // choice and hide the question — no point asking the kind again.
  const normName = listing.name.toLowerCase().replace(/[\s-]/g, '');
  const autoChoice: Record<string, string> = {};
  for (const ch of tpl.choices) {
    const m = ch.options.find((o) => o.toLowerCase().replace(/[\s-]/g, '') === normName);
    if (m) autoChoice[ch.key] = m;
  }

  const [rating, setRating] = useState(restoredDraft?.rating ?? existing?.rating ?? initialRating ?? 0);
  const [text, setText] = useState(restoredDraft?.text ?? existing?.text ?? '');
  const [choices, setChoices] = useState<Record<string, string[]>>(
    restoredDraft?.choices ?? prev.choices ?? Object.fromEntries(Object.entries(autoChoice).map(([k, v]) => [k, [v]])),
  );
  const [ratings] = useState<Record<string, number>>(restoredDraft?.ratings ?? prev.ratings ?? {});
  const [price, setPrice] = useState<string>(restoredDraft?.price ?? (prev.price ? String(prev.price) : ''));
  const [visitDate, setVisitDate] = useState(restoredDraft?.visitDate ?? prev.visitDate ?? new Date().toISOString().slice(0, 10));
  const [photoUrls, setPhotoUrls] = useState<string[]>(() => [
    ...new Set([
      ...(restoredDraft?.photoUrls ?? existing?.photoUrls ?? []),
      ...(initialPhotoUrls ?? []),
    ]),
  ]);
  const [videoUrls, setVideoUrls] = useState<string[]>(restoredDraft?.videoUrls ?? existing?.videoUrls ?? []);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false); // sync re-entry guard: iOS ghost-taps beat setState
  // the form is a bottom sheet — pull-down closes it, same as feed posts
  const sheetRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const hasUnsavedTextRef = useRef(false);
  hasUnsavedTextRef.current = text.trim() !== (existing?.text ?? '').trim();
  const canClose = useCallback(() => {
    if (busyRef.current) return false;
    return !hasUnsavedTextRef.current || window.confirm('В отзыве есть несохранённый текст. Выйти? Черновик останется на этом устройстве.');
  }, []);
  const closeNow = useCallback(() => onCloseRef.current(), []);
  const requestClose = useCallback(() => {
    if (canClose()) closeNow();
  }, [canClose, closeNow]);
  useSwipeDismiss(sheetRef, closeNow, { canDismiss: canClose });
  // story slides pre-compose WHILE the user types — so the editor opens the
  // instant they hit «Опубликовать» instead of seconds later (or never)
  const slides = useRef(new Map<string, string>());
  const precompose = (url: string) => {
    composeStoryImage(url).then((s) => { if (s) slides.current.set(url, s); }).catch(() => {});
  };
  const [error, setError] = useState<string | null>(null);
  const [canRetrySave, setCanRetrySave] = useState(false);

  // tag friends (Untappd-style) — people you follow
  const [following, setFollowing] = useState<PublicUser[]>([]);
  const [tagged, setTagged] = useState<string[]>(
    restoredDraft?.tagged ?? (prev.taggedUsers ?? []).map((u: any) => u.id),
  );
  useEffect(() => {
    api.myFollowing().then(setFollowing).catch(() => {});
  }, []);
  const toggleTag = (id: string) =>
    setTagged((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  const showDate = tpl.id === 'dish' || tpl.id === 'place' || tpl.id === 'steak';
  useEscClose(requestClose);

  // Keep the user's work after every field change. Uploaded media are URLs, so
  // the complete draft is small enough for localStorage and can survive a WebView restart.
  useEffect(() => {
    try {
      const draft: ReviewDraft = { rating, text, choices, ratings, price, visitDate, photoUrls, videoUrls, tagged };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch {
      // Storage may be unavailable in a locked-down WebView; saving the review still works.
    }
  }, [draftKey, rating, text, choices, ratings, price, visitDate, photoUrls, videoUrls, tagged]);

  const pickChoice = (key: string, opt: string, multi?: boolean) => {
    setChoices((c) => {
      const cur = c[key] ?? [];
      if (multi) {
        return { ...c, [key]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] };
      }
      return { ...c, [key]: cur[0] === opt ? [] : [opt] };
    });
  };

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    setCanRetrySave(false);
    try {
      const urls = await Promise.all(Array.from(files).map((f) => api.upload(f)));
      setPhotoUrls((p) => [...p, ...urls]);
      urls.slice(0, 2).forEach(precompose); // stories use the first two photos
    } catch {
      setError('Не удалось загрузить фото');
      setCanRetrySave(false);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function save() {
    // iOS can ghost-fire a second tap before the disabled state re-renders —
    // that double-ran the whole save (and opened the story editor twice)
    if (busyRef.current || rating <= 0) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    setCanRetrySave(false);
    let saved: Review;
    try {
      const venueId = venue?.id ?? (prev.venueId as string | undefined);
      // pending place (no id yet) → store its name so the card can show it now
      const venueName = !venueId ? (venue?.name ?? (prev.venueName as string | undefined)) : undefined;
      const priceNum = price ? Math.max(0, Math.round(Number(price))) : 0;
      const taggedUsers = following
        .filter((u) => tagged.includes(u.id))
        .map((u) => ({ id: u.id, name: u.firstName ?? u.username ?? 'Гость' }));
      const attributes: Record<string, any> = {
        template: tpl.id,
        choices,
        ratings,
        ...(venueId ? { venueId } : {}),
        ...(venueName ? { venueName } : {}),
        ...(priceNum ? { price: priceNum } : {}),
        ...(showDate ? { visitDate } : {}),
        ...(taggedUsers.length ? { taggedUsers } : {}),
      };
      saved = await api.createReview(listing.id, { rating, text, attributes, photoUrls, videoUrls });
    } catch (saveError) {
      setError(saveError instanceof Error && saveError.message
        ? saveError.message
        : 'Не удалось сохранить. Черновик сохранён — нажмите «Повторить».');
      setCanRetrySave(true);
      busyRef.current = false;
      setBusy(false);
      return;
    }
    // A response means the idempotent upsert is durable. Clear the draft before
    // invoking UI/story callbacks so an unrelated callback failure cannot cause a retry prompt.
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    busyRef.current = false;
    setBusy(false);
    try {
      onSaved({ photo: photoUrls[0], photos: photoUrls, video: videoUrls[0], text: text.trim() || undefined, slides: Object.fromEntries(slides.current), review: saved });
    } catch (callbackError) {
      // The review is already saved; never mislabel a story/UI callback failure as data loss.
      console.error('Post-save callback failed', callbackError);
      closeNow();
    }
  }

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 3000 }}
      onClick={(e) => {
        e.stopPropagation();
        requestClose();
      }}
    >
      <div className="modal" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
        <h3>{listing.name}</h3>
        {venue && (
          <div className="meta" style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
            📍 {venue.name}
            {venue.pending ? ' · на модерации' : ''}
          </div>
        )}
        <div className="meta" style={{ color: 'var(--hint)', fontSize: 13 }}>{tpl.title}</div>
        <div className="geo-note" style={{ marginTop: 10 }}>
          <span style={{ color: 'var(--hint)' }}>🛡 Отзыв появится после быстрой проверки модератором</span>
        </div>

        {/* note + photo right at the top (Untappd-style) */}
        <div className="field note-top">
          <div className="note-row">
            <textarea
              className="note-area"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Как вам? Оставьте заметку…"
            />
            <label className="photo-box">
              <svg className="photo-box-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <circle cx="8.5" cy="9.5" r="1.6" />
                <path d="M21 16.5l-4.5-4.5L9 19.5" />
              </svg>
              <span className="photo-box-label">Добавить фото</span>
              <input type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
            </label>
          </div>
          {/* video upload removed (owner rule 13.07.2026) — photos only */}
          {(photoUrls.length > 0 || videoUrls.length > 0) && (
            <div className="photo-thumbs">
              {photoUrls.map((u) => (
                <div key={u} className="thumb-wrap">
                  <img src={u} alt="" />
                  <button
                    type="button"
                    className="thumb-del"
                    aria-label="Удалить фото"
                    onClick={() => setPhotoUrls((p) => p.filter((x) => x !== u))}
                  >
                    ×
                  </button>
                </div>
              ))}
              {videoUrls.map((u) => (
                <div key={u} className="thumb-wrap">
                  <video src={u} muted playsInline />
                  <button
                    type="button"
                    className="thumb-del"
                    aria-label="Удалить видео"
                    onClick={() => setVideoUrls((p) => p.filter((x) => x !== u))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="field">
          <label>Общая оценка</label>
          <StarInput value={rating} onChange={setRating} />
          <span style={{ marginLeft: 10, fontWeight: 700 }}>
            {rating > 0 ? rating.toFixed(1) : 'Поставьте оценку'}
          </span>
        </div>

        {/* expert select fields (grape variety, coffee kind, additives, cut…)
            — skip a question the item already answers (e.g. it IS "Капучино") */}
        {tpl.choices.filter((ch) => !autoChoice[ch.key]).map((ch) => (
          <div className="field" key={ch.key}>
            <label>
              {ch.label}
              {ch.multi ? ' (можно несколько)' : ''}
            </label>
            <div className="chips scroll-row">
              {ch.options.map((opt) => {
                const active = (choices[ch.key] ?? []).includes(opt);
                return (
                  <button
                    key={opt}
                    className={'chip' + (active ? ' active' : '')}
                    onClick={() => pickChoice(ch.key, opt, ch.multi)}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* tag friends you were with (people you follow) */}
        {following.length > 0 && (
          <div className="field">
            <label>👥 Отметить друзей</label>
            <div className="chips scroll-row">
              {following.map((u) => {
                const name = u.firstName ?? u.username ?? 'Гость';
                const active = tagged.includes(u.id);
                return (
                  <button
                    key={u.id}
                    className={'chip friend-chip' + (active ? ' active' : '')}
                    onClick={() => toggleTag(u.id)}
                  >
                    {u.photoUrl ? (
                      <img className="friend-chip-ava" src={u.photoUrl} alt="" />
                    ) : (
                      <span className="friend-chip-ava ph">{name[0]?.toUpperCase() ?? '?'}</span>
                    )}
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* price already known for this item at this venue → don't ask again */}
        {knownPrice == null && (
          <div className="field">
            <label>Чек, ₽ (необязательно)</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="напр. 350"
              max={100000}
              value={price}
              onChange={(e) => {
                // cap at 100 000 ₽ — no "1000000 ₽" typos in the catalog
                const n = Math.min(100000, Math.max(0, Number(e.target.value) || 0));
                setPrice(e.target.value === '' ? '' : String(n));
              }}
            />
            <span className="meta" style={{ color: 'var(--hint)', fontSize: 12 }}>
              Появится в меню заведения после проверки модератором.
            </span>
          </div>
        )}

        {showDate && (
          <div className="field">
            <label>Дата визита</label>
            {/* tap anywhere on the field → open the native calendar (not just the icon) */}
            <input
              type="date"
              className="date-input"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              onClick={(e) => {
                const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
                try { el.showPicker?.(); } catch { /* not supported → native focus */ }
              }}
            />
          </div>
        )}

        {error && (
          <div style={{ marginTop: 10 }}>
            <p style={{ color: 'crimson', fontSize: 13, margin: '0 0 8px' }}>{error}</p>
            {canRetrySave && (
              <button className="btn secondary" type="button" onClick={save} disabled={busy}>
                Повторить
              </button>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="btn secondary" onClick={requestClose} disabled={busy}>
            Отмена
          </button>
          <button className="btn" onClick={save} disabled={busy || rating <= 0}>
            {busy ? 'Сохранение…' : 'Опубликовать'}
          </button>
        </div>
      </div>
    </div>
  );
}
