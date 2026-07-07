import type { ReactNode } from 'react';
import type { Review } from '../types';
import { Stars } from './Stars';

const REACTS: [keyof NonNullable<Review['voteCounts']>, string][] = [
  ['USEFUL', '👍'],
  ['FUNNY', '😄'],
  ['COOL', '😎'],
  ['OHNO', '🙀'],
];

// Review card in OUR style (white / black / red). Mirrors the open PhotoPostModal:
// the author + place overlaid on the photo, then item thumbnail + name + place +
// style, red rating, text and the four reactions. Tapping opens the full post.
export function ReviewCard({
  review,
  onOpen,
  onOpenUser,
  onOpenVenue,
  children,
}: {
  review: Review;
  onOpen?: () => void;
  onOpenUser?: (userId: string) => void;
  onOpenVenue?: () => void;
  children?: ReactNode;
}) {
  const photo = review.photoUrls?.[0] || review.listing?.photoUrl || undefined;
  const cat = review.listing?.category;
  const showStyle = cat && !/^(блюдо|напиток)$/i.test(cat);
  const vc = review.voteCounts;
  const u = review.user;
  const initial = (u?.firstName ?? u?.username ?? '?').trim()[0]?.toUpperCase() ?? '?';
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="rc">
      <div className="rc-tap" onClick={onOpen}>
        {photo && (
          <div className="rc-photo-wrap">
            {/* blurred fill of the same photo → no black letterbox bars */}
            <div className="ph-blur" style={{ backgroundImage: `url("${photo}")` }} />
            <img className="rc-photo" src={photo} alt="" loading="lazy" />
            {/* author + place overlaid on the photo (same as the open post) */}
            {u && (
              <div className="rc-head">
                <button
                  type="button"
                  className="rc-head-user"
                  onClick={(e) => { stop(e); u.id && onOpenUser?.(u.id); }}
                >
                  {u.photoUrl ? (
                    <img className="rc-head-av" src={u.photoUrl} alt="" />
                  ) : (
                    <span className="rc-head-av ph">{initial}</span>
                  )}
                  <span className="rc-head-name">{u.firstName ?? u.username ?? 'Гость'}</span>
                </button>
                {review.venue && (
                  <button
                    type="button"
                    className="rc-head-venue"
                    onClick={(e) => { stop(e); onOpenVenue?.(); }}
                  >
                    {review.venue.name} ›
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        <div className="rc-card">
          <div className="rc-main">
            {review.listing?.photoUrl && (
              <img className="rc-thumb" src={review.listing.photoUrl} alt="" />
            )}
            <div className="rc-info">
              <b className="rc-name">{review.listing?.name}</b>
              {review.venue && <span className="rc-sub">{review.venue.name}</span>}
              {showStyle && <span className="rc-style">{cat}</span>}
            </div>
          </div>
          <div className="rc-rating">
            <Stars value={review.rating} />
            <span className="rc-score">{review.rating.toFixed(1)}</span>
          </div>
          {review.text && <div className="rc-text">{review.text}</div>}
          <div className="rc-reacts">
            {REACTS.map(([k, ico]) => (
              <span key={k} className="rc-react">
                {ico} {vc?.[k] ?? 0}
              </span>
            ))}
          </div>
        </div>
      </div>
      {children && <div className="rc-foot">{children}</div>}
    </div>
  );
}

// Average rating per category, computed from a user's reviews — compact "N · X.X★" rows.
export function CategoryAverages({ reviews }: { reviews: Review[] }) {
  const map = new Map<string, { sum: number; n: number }>();
  for (const r of reviews) {
    const c = r.listing?.category;
    if (!c || /^(блюдо|напиток)$/i.test(c)) continue;
    const e = map.get(c) ?? { sum: 0, n: 0 };
    e.sum += r.rating;
    e.n += 1;
    map.set(c, e);
  }
  const rows = [...map.entries()]
    .map(([name, { sum, n }]) => ({ name, avg: sum / n, n }))
    .sort((a, b) => b.n - a.n || b.avg - a.avg);
  if (!rows.length) return null;
  return (
    <div className="cat-avgs">
      {rows.map((r) => (
        <div key={r.name} className="cat-avg-row">
          <span className="cat-avg-name">{r.name}</span>
          <span className="cat-avg-val">
            {r.n} · {r.avg.toFixed(1)}★
          </span>
        </div>
      ))}
    </div>
  );
}
