import { useState } from 'react';
import { api } from '../api';
import type { Review, VoteState, VoteType } from '../types';
import { Stars } from './Stars';

const VOTE_LABEL: Record<VoteType, string> = {
  USEFUL: '👍 Полезно',
  FUNNY: '😄 Смешно',
  COOL: '😎 Круто',
  OHNO: '🙀 О нет',
};

// A user's activity post (Yelp-style): author + photo + the item/venue they reviewed.
// Every post nudges the viewer to act: "а вы как оцените?".
export function FeedPost({
  review,
  onOpen,
  onRate,
  onComments,
  onOpenUser,
  onOpenPhoto,
}: {
  review: Review;
  onOpen: () => void;
  onRate?: (rating: number) => void;
  onComments?: () => void;
  onOpenUser?: (userId: string) => void;
}) {
  // the feed only contains posts where the user uploaded their own photo, so show that
  const photo = review.photoUrls?.[0];
  const u = review.user;
  const initial = (u?.firstName ?? u?.username ?? '?').trim()[0]?.toUpperCase() ?? '?';
  const [hover, setHover] = useState(0);
  const isItem = review.listing?.type === 'DISH' || review.listing?.type === 'DRINK';
  const [vote, setVote] = useState<VoteState>({
    counts: review.voteCounts ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
    mine: [],
  });
  const doVote = (t: VoteType) =>
    api.vote(review.id, t).then(setVote).catch(() => {});

  return (
    <div className="post" onClick={onOpen}>
      <button
        type="button"
        className="post-head"
        onClick={(e) => {
          e.stopPropagation(); // open the author's profile, never the post
          if (u?.id && onOpenUser) onOpenUser(u.id);
        }}
      >
        {u?.photoUrl ? (
          <img className="post-avatar" src={u.photoUrl} alt="" />
        ) : (
          <div className="post-avatar ph">{initial}</div>
        )}
        <div style={{ textAlign: 'left' }}>
          <b>{u?.firstName ?? u?.username ?? 'Гость'}</b>
          <div className="meta" style={{ color: 'var(--hint)', fontSize: 13 }}>
            {photo ? 'поделился(ась) фото' : 'оставил(а) отзыв'}
          </div>
        </div>
      </button>

      {/* the user's own upload, or the item's real photo — never a stock placeholder */}
      {photo && <img className="post-photo" src={photo} alt="" loading="lazy" />}

      <div className="post-venue">
        <b>{review.listing?.name}</b>
        {review.venue && (
          <div className="meta" style={{ color: 'var(--hint)', fontSize: 13, marginTop: 2 }}>
            📍 {review.venue.name}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
          <Stars value={review.rating} />
          <span className="meta" style={{ color: 'var(--hint)', fontSize: 13 }}>
            {review.rating.toFixed(1)}
          </span>
        </div>
        {review.text && <div className="post-text">{review.text}</div>}

        <div className="vote-row" onClick={(e) => e.stopPropagation()}>
          {(['USEFUL', 'FUNNY', 'COOL', 'OHNO'] as VoteType[]).map((t) => (
            <button
              key={t}
              className={'vote-btn' + (vote.mine.includes(t) ? ' active' : '')}
              onClick={() => doVote(t)}
            >
              {VOTE_LABEL[t]}
              {vote.counts[t] ? ` ${vote.counts[t]}` : ''}
            </button>
          ))}
        </div>

        {review.topComment && (
          <div className="post-cmt">
            <b
              onClick={(e) => {
                const uid = review.topComment?.user?.id;
                if (uid && onOpenUser) {
                  e.stopPropagation();
                  onOpenUser(uid);
                }
              }}
            >
              {review.topComment.user?.firstName ?? review.topComment.user?.username ?? 'Гость'}:
            </b>{' '}
            {review.topComment.text}
          </div>
        )}
        {onComments && (
          <button
            className="post-discuss"
            onClick={(e) => {
              e.stopPropagation();
              onComments();
            }}
          >
            💬{' '}
            {(review.commentCount ?? 0) > 1
              ? `Показать остальные комментарии (${review.commentCount})`
              : review.commentCount === 1
                ? 'Ответить'
                : 'Обсудить'}
          </button>
        )}
      </div>

      {isItem && onRate && (
        <div className="post-cta" onClick={(e) => e.stopPropagation()}>
          <span className="post-cta-q">А вы как оцените?</span>
          <div className="post-cta-stars" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={'qr-star' + (n <= hover ? ' on' : '')}
                onMouseEnter={() => setHover(n)}
                onClick={() => onRate(n)}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
