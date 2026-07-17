import { useState } from 'react';
import { api } from '../api';
import type { Review, VoteState, VoteType } from '../types';
import { Stars } from './Stars';
import { SmartImg } from './SmartImg';

const VOTE_LABEL: Record<VoteType, string> = {
  USEFUL: '👍 Полезно',
  FUNNY: '😄 Смешно',
  COOL: '😎 Круто',
  OHNO: '🙀 О нет',
};

// Feed photos use the shared resilient renderer below.
// A user's activity post (Yelp-style): author + photo + the item/venue they reviewed.
export function FeedPost({
  review,
  onOpen,
  onComments,
  onOpenUser,
  onOpenPhoto,
  onOpenVenue,
}: {
  review: Review;
  onOpen: () => void;
  onComments?: () => void;
  onOpenUser?: (userId: string) => void;
  onOpenPhoto?: () => void; // tap the PHOTO → the review itself (check-in detail)
  onOpenVenue?: () => void; // tap the "📍 place" line → the venue card
}) {
  // the user's own photo leads; text-only posts fall back to the dish's card
  // photo (illustrative, labeled) so the wall never looks broken/empty
  const photo = review.photoUrls?.[0];
  const cardPhoto = !photo ? review.listing?.photoUrl : null;
  const imageFallback = review.listing
    ? {
        type: review.listing.type,
        category: review.listing.category,
        name: review.listing.name,
        seed: review.listing.id,
      }
    : undefined;
  const u = review.user;
  const initial = (u?.firstName ?? u?.username ?? '?').trim()[0]?.toUpperCase() ?? '?';
  const [vote, setVote] = useState<VoteState>({
    counts: review.voteCounts ?? { USEFUL: 0, FUNNY: 0, COOL: 0, OHNO: 0 },
    // server hydrates the viewer's own votes → likes are lit on first render
    mine: ((review as any).myVotes ?? []) as VoteType[],
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
        <SmartImg className="post-avatar" src={u?.photoUrl} width={200} loading="eager" monogram={initial} />
        <div style={{ textAlign: 'left' }}>
          <b>{u?.firstName ?? u?.username ?? 'Гость'}</b>
          <div className="meta" style={{ color: 'var(--hint)', fontSize: 13 }}>
            {photo ? 'поделился(ась) фото' : 'оставил(а) отзыв'}
          </div>
        </div>
      </button>

      {/* tap the photo → the REVIEW opens (the rest of the post opens the item card) */}
      {photo ? (
        <div
          className="post-photo-wrap"
          onClick={(e) => {
            if (onOpenPhoto) {
              e.stopPropagation();
              onOpenPhoto();
            }
          }}
        >
          <SmartImg className="post-photo" src={photo} stock={imageFallback} monogram={review.listing?.name} />
          {/* ↗ affordance: the photo IS tappable (opens the check-in) */}
          {onOpenPhoto && <span className="post-photo-open">↗</span>}
        </div>
      ) : cardPhoto || review.listing ? (
        <div className="post-photo-wrap">
          <SmartImg className="post-photo" src={cardPhoto} stock={imageFallback} monogram={review.listing?.name} />
        </div>
      ) : null}

      <div className="post-venue">
        <b>{review.listing?.name}</b>
        {review.venue && (
          <button
            type="button"
            className="meta post-venue-link"
            style={{ color: 'var(--hint)', fontSize: 13, marginTop: 2, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block' }}
            onClick={(e) => {
              if (onOpenVenue) {
                e.stopPropagation(); // venue tap opens the VENUE, not the item
                onOpenVenue();
              }
            }}
          >
            📍 {review.venue.name}
          </button>
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

      {/* no rate-CTA on someone else's review post (product decision): opening a
          friend's tasting must not push the viewer to rate the same item */}
    </div>
  );
}
