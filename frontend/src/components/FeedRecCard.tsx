import type { Listing } from '../types';
import { VenuePhoto } from './VenuePhoto';
import { Stars } from './Stars';
import { ratingsWord } from '../plural';

// A recommendation card that lives INSIDE the wall feed (alongside user posts),
// so the feed never runs out: taste-picked dish/drink + WHERE to try it + a real
// review snippet when one exists. Tapping a star / «Хочу попробовать» starts the
// same rate flow as everywhere else.
export function FeedRecCard({
  item,
  favorite,
  onOpen,
  onRate,
  onFavorite,
  onOpenVenue,
}: {
  item: Listing;
  favorite?: boolean;
  onOpen: () => void;
  onRate: (n: number) => void;
  onFavorite: () => void;
  onOpenVenue?: () => void;
}) {
  const venue = item.recVenue?.name || item.bestVenue?.name;
  const price = item.recVenue?.price;
  const best = !!item.bestVenue && item.reviewCount > 0; // «Лучшее в» is earned by ratings
  return (
    <div className="post rec-post" onClick={onOpen}>
      <div className="rec-tag">✨ Вам может понравиться</div>
      <div className="post-photo-wrap">
        <VenuePhoto listing={item} className="post-photo" />
        {price != null && <span className="newdish-price">{price} ₽</span>}
        {item.matchPct != null && <span className="match-pct">🤖 {item.matchPct}%</span>}
      </div>
      <div className="rec-body">
        <div className="rec-name">{item.name}</div>
        {venue && (
          <button
            type="button"
            className="rec-venue"
            onClick={(e) => { e.stopPropagation(); onOpenVenue?.(); }}
          >
            {best ? '🏆 Лучшее в:' : 'Попробуйте в:'} 📍{venue}
          </button>
        )}
        <div className="rec-rating">
          {item.reviewCount > 0 ? (
            <>
              <Stars value={item.avgRating} size={15} />
              <span className="rec-rating-val">{item.avgRating.toFixed(1)} ({item.reviewCount} {ratingsWord(item.reviewCount)})</span>
            </>
          ) : (
            <span className="rec-rating-val no">Оцените первым</span>
          )}
        </div>
        {item.snippet?.text && (
          <div className="rec-snippet">«{item.snippet.text.length > 130 ? item.snippet.text.slice(0, 130) + '…' : item.snippet.text}»</div>
        )}
        {item.recReason && !item.snippet?.text && (
          <div className="rec-reason">{item.recReason}</div>
        )}
        <div className="rec-stars" onClick={(e) => e.stopPropagation()}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} className="rec-star" onClick={() => onRate(n)}>★</button>
          ))}
        </div>
        <button
          className={'fav-btn' + (favorite ? ' on' : '')}
          onClick={(e) => { e.stopPropagation(); onFavorite(); }}
        >
          {favorite ? '✓ Сохранено' : 'Хочу попробовать'}
        </button>
      </div>
    </div>
  );
}
