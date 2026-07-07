import { useState } from 'react';
import { api } from '../api';

// 1-tap rating straight from a card. Text is optional — tapping a star publishes
// the rating immediately; "добавить отзыв" is offered but never required.
export function QuickRate({
  listingId,
  onOpenReview,
  onRated,
}: {
  listingId: string;
  onOpenReview?: (rating: number) => void;
  onRated?: () => void;
}) {
  const [hover, setHover] = useState(0);
  const [done, setDone] = useState(false);

  const rate = (n: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDone(true);
    api.createReview(listingId, { rating: n }).then(() => onRated?.()).catch(() => {});
  };

  if (done) {
    return (
      <div className="qr-done" onClick={(e) => e.stopPropagation()}>
        Оценка принята ✓
        {onOpenReview && (
          <button className="qr-add" onClick={(e) => { e.stopPropagation(); onOpenReview(0); }}>
            ✎ добавить отзыв
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="qr" onMouseLeave={() => setHover(0)} onClick={(e) => e.stopPropagation()}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          className={'qr-star' + (n <= hover ? ' on' : '')}
          onMouseEnter={() => setHover(n)}
          onClick={(e) => rate(n, e)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
