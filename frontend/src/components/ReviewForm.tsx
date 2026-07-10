import {useEffect, useState, useRef } from 'react';
import { api } from '../api';
import { useEscClose } from '../modalEsc';
import type { Listing, PublicUser, Review } from '../types';
import { StarInput } from './StarInput';
import { templateFor } from '../tasting';

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
  onSaved: (media?: { photo?: string; photos?: string[]; video?: string; text?: string }) => void;
}) {
  const tpl = templateFor(listing);
  const prev = (existing?.attributes ?? {}) as Record<string, any>;

  // if the item already IS a specific option (e.g. "Капучино"), pre-fill that
  // choice and hide the question — no point asking the kind again.
  const normName = listing.name.toLowerCase().replace(/[\s-]/g, '');
  const autoChoice: Record<string, string> = {};
  for (const ch of tpl.choices) {
    const m = ch.options.find((o) => o.toLowerCase().replace(/[\s-]/g, '') === normName);
    if (m) autoChoice[ch.key] = m;
  }

  const [rating, setRating] = useState(existing?.rating ?? initialRating ?? 5);
  const [text, setText] = useState(existing?.text ?? '');
  const [choices, setChoices] = useState<Record<string, string[]>>(
    prev.choices ?? Object.fromEntries(Object.entries(autoChoice).map(([k, v]) => [k, [v]])),
  );
  const [ratings] = useState<Record<string, number>>(prev.ratings ?? {});
  const [price, setPrice] = useState<string>(prev.price ? String(prev.price) : '');
  const [visitDate, setVisitDate] = useState(prev.visitDate ?? new Date().toISOString().slice(0, 10));
  const [photoUrls, setPhotoUrls] = useState<string[]>(existing?.photoUrls ?? initialPhotoUrls ?? []);
  const [videoUrls, setVideoUrls] = useState<string[]>(existing?.videoUrls ?? []);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false); // sync re-entry guard: iOS ghost-taps beat setState
  const [error, setError] = useState<string | null>(null);

  // tag friends (Untappd-style) — people you follow
  const [following, setFollowing] = useState<PublicUser[]>([]);
  const [tagged, setTagged] = useState<string[]>(
    (prev.taggedUsers ?? []).map((u: any) => u.id),
  );
  useEffect(() => {
    api.myFollowing().then(setFollowing).catch(() => {});
  }, []);
  const toggleTag = (id: string) =>
    setTagged((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  const showDate = tpl.id === 'dish' || tpl.id === 'place' || tpl.id === 'steak';
  useEscClose(onClose);

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
    setBusy(true);
    try {
      const urls = await Promise.all(Array.from(files).map((f) => api.upload(f)));
      setPhotoUrls((p) => [...p, ...urls]);
    } catch {
      setError('Не удалось загрузить фото');
    } finally {
      setBusy(false);
    }
  }
  async function addVideos(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    try {
      const urls = await Promise.all(Array.from(files).map((f) => api.upload(f)));
      setVideoUrls((p) => [...p, ...urls]);
    } catch {
      setError('Не удалось загрузить видео (макс. 80 МБ)');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    // iOS can ghost-fire a second tap before the disabled state re-renders —
    // that double-ran the whole save (and opened the story editor twice)
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
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
      await api.createReview(listing.id, { rating, text, attributes, photoUrls, videoUrls });
      // pass the user's OWN media + their note so the story uses both
      onSaved({ photo: photoUrls[0], photos: photoUrls, video: videoUrls[0], text: text.trim() || undefined });
    } catch {
      setError('Не удалось сохранить');
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 3000 }}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
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
          <label className="upload-btn small" style={{ marginTop: 8 }}>
            <span className="up-ico">🎬</span>
            Добавить видео
            <input type="file" accept="video/*" multiple hidden onChange={(e) => addVideos(e.target.files)} />
          </label>
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
          <span style={{ marginLeft: 10, fontWeight: 700 }}>{rating.toFixed(1)}</span>
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
              value={price}
              onChange={(e) => setPrice(e.target.value)}
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

        {error && <p style={{ color: 'crimson', fontSize: 13 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="btn secondary" onClick={onClose} disabled={busy}>
            Отмена
          </button>
          <button className="btn" onClick={save} disabled={busy}>
            {busy ? 'Сохранение…' : 'Опубликовать'}
          </button>
        </div>
      </div>
    </div>
  );
}
