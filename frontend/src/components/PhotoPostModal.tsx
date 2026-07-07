import { useEffect, useState } from 'react';
import { api } from '../api';
import { useEscClose } from '../modalEsc';
import { tg, openExternal } from '../telegram';
import type { Comment, Review, VoteState, VoteType } from '../types';
import { Stars } from './Stars';

const VOTE_LABEL: Record<VoteType, string> = {
  USEFUL: '👍 Полезно',
  FUNNY: '😄 Смешно',
  COOL: '😎 Круто',
  OHNO: '🙀 О нет',
};

// Full "Check-in Detail" view of a single photo review (our red/black/white style):
// hero photo + author, item card, date, reactions, LOCATION, comments.
export function PhotoPostModal({
  review,
  onClose,
  onOpenUser,
  onOpenListing,
  onOpenVenue,
  onEdit,
  onDelete,
}: {
  review: Review;
  onClose: () => void;
  onOpenUser?: (userId: string) => void;
  onOpenListing?: () => void;
  onOpenVenue?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const photo = review.photoUrls?.[0] || review.listing?.photoUrl || undefined;
  const u = review.user;
  const initial = (u?.firstName ?? u?.username ?? '?').trim()[0]?.toUpperCase() ?? '?';
  const [closing, setClosing] = useState(false);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState('');
  const [vote, setVote] = useState<VoteState>({
    counts: review.voteCounts ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
    mine: [],
  });
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const reqClose = () => {
    setClosing(true);
    setTimeout(onClose, 220);
  };
  useEscClose(reqClose);

  useEffect(() => {
    api.comments(review.id).then(setComments).catch(() => {});
    api.voteState(review.id).then(setVote).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review.id]);

  const doVote = (t: VoteType) => api.vote(review.id, t).then(setVote).catch(() => {});
  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const c = await api.addComment(review.id, text.trim());
      if (c) setComments((p) => [...p, c]);
      setText('');
    } catch (e: any) {
      setErr(e?.message?.trim() || 'Не удалось отправить');
    }
    setBusy(false);
  };

  const shareLink = `https://t.me/togomoscow_bot?startapp=l_${review.listing?.id ?? ''}`;
  const shareText = `${review.listing?.name ?? ''} — ${review.rating.toFixed(1)}★`;
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1600); };
  const sendToFriend = () => {
    setMenu(false);
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareText)}`;
    if ((tg as any)?.openTelegramLink) (tg as any).openTelegramLink(url);
    else openExternal(url);
  };
  const sharePhoto = () => { setMenu(false); if (photo) openExternal(photo); };
  const copyLink = () => {
    setMenu(false);
    navigator.clipboard?.writeText(shareLink).then(() => showToast('Ссылка скопирована')).catch(() => showToast('Не удалось'));
  };

  const dateStr = (review as any).createdAt
    ? new Date((review as any).createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="modal-backdrop photo-post-backdrop" style={{ zIndex: 3400 }} onClick={reqClose}>
      <div className={'photo-post' + (closing ? ' closing' : '')} onClick={(e) => e.stopPropagation()}>
        <button className="pp-dots" onClick={() => setMenu(true)} aria-label="Ещё">⋯</button>
        <button className="pp-close" onClick={reqClose} aria-label="Закрыть">✕</button>

        {/* HERO: full (uncropped) photo with the author + place overlaid on top */}
        <div className="pp-hero">
          {photo && <div className="ph-blur" style={{ backgroundImage: `url("${photo}")` }} />}
          {photo && <img className="pp-photo" src={photo} alt="" />}
          <button type="button" className="pp-head" onClick={() => u?.id && onOpenUser?.(u.id)}>
            {u?.photoUrl ? (
              <img className="pp-avatar" src={u.photoUrl} alt="" />
            ) : (
              <div className="pp-avatar ph">{initial}</div>
            )}
            <div className="pp-head-txt">
              <b>{u?.firstName ?? u?.username ?? 'Гость'}</b>
              {review.venue && <span className="pp-head-venue">{review.venue.name} ›</span>}
            </div>
          </button>
        </div>

        {/* item card: thumb + name + place + style, then rating and caption */}
        <div className="pp-card">
          <button type="button" className="pp-card-main" onClick={onOpenListing}>
            {review.listing?.photoUrl && (
              <img className="pp-card-thumb" src={review.listing.photoUrl} alt="" />
            )}
            <div className="pp-card-info">
              <b className="pp-card-name">{review.listing?.name}</b>
              {review.venue && <span className="pp-card-sub">{review.venue.name}</span>}
              {review.listing?.category && !/^(блюдо|напиток)$/i.test(review.listing.category) && (
                <span className="pp-card-style">{review.listing.category}</span>
              )}
            </div>
          </button>
          <div className="pp-card-rating">
            <Stars value={review.rating} />
            <span className="pp-card-score">{review.rating.toFixed(2)}</span>
          </div>
          {review.text && <div className="pp-card-text">{review.text}</div>}
        </div>

        <div className="pp-body">
          {dateStr && <div className="pp-date">{dateStr}</div>}

          <div className="pp-votes">
            {(['USEFUL', 'FUNNY', 'COOL', 'OHNO'] as VoteType[]).map((t) => (
              <button
                key={t}
                className={'pp-vote' + (vote.mine.includes(t) ? ' active' : '')}
                onClick={() => doVote(t)}
              >
                {VOTE_LABEL[t]}
                {vote.counts[t] ? ` ${vote.counts[t]}` : ''}
              </button>
            ))}
          </div>

          {review.venue && (
            <button type="button" className="pp-location" onClick={onOpenVenue}>
              <div className="pp-loc-head">МЕСТО</div>
              <div className="pp-loc-row">
                <span className="pp-loc-ico">📍</span>
                <b>{review.venue.name}</b>
                <span className="pp-loc-chev">›</span>
              </div>
            </button>
          )}

          <div className="pp-comments">
            <div className="pp-comments-title">Комментарии</div>
            {comments.length === 0 ? (
              <div className="pp-empty">Пока нет комментариев. Будьте первым!</div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="pp-cmt">
                  <button
                    type="button"
                    className="pp-cmt-av"
                    onClick={() => c.user?.id && onOpenUser?.(c.user.id)}
                  >
                    {c.user?.photoUrl ? (
                      <img src={c.user.photoUrl} alt="" />
                    ) : (
                      <span className="ph">{(c.user?.firstName ?? '?')[0]?.toUpperCase() ?? '?'}</span>
                    )}
                  </button>
                  <div className="pp-cmt-body">
                    <b>{c.user?.firstName ?? c.user?.username ?? 'Гость'}</b> {c.text}
                  </div>
                </div>
              ))
            )}
          </div>

          {err && <div className="pp-err">{err}</div>}
          <div className="pp-form">
            <input
              placeholder="Добавить комментарий…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button className="pp-send" disabled={busy || !text.trim()} onClick={send} aria-label="Отправить">
              ➤
            </button>
          </div>
        </div>
      </div>

      {/* action sheet from the ⋯ button */}
      {menu && (
        <div className="pp-sheet-back" onClick={(e) => { e.stopPropagation(); setMenu(false); }}>
          <div className="pp-sheet" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <button className="pp-sheet-item" onClick={() => { setMenu(false); onEdit(); }}>Изменить</button>
            )}
            <button className="pp-sheet-item" onClick={sendToFriend}>Отправить другу</button>
            {photo && <button className="pp-sheet-item" onClick={sharePhoto}>Поделиться фото</button>}
            <button className="pp-sheet-item" onClick={copyLink}>Поделиться ссылкой</button>
            {onDelete && (
              <button className="pp-sheet-item danger" onClick={() => { setMenu(false); onDelete(); }}>Удалить</button>
            )}
            <button className="pp-sheet-item cancel" onClick={() => setMenu(false)}>Отмена</button>
          </div>
        </div>
      )}
      {toast && <div className="pp-toast">{toast}</div>}
    </div>
  );
}
