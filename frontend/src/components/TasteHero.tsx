import { useEffect, useRef, useState } from 'react';
import type { Listing } from '../types';
import { isUserPhoto } from '../img';
import { VenuePhoto } from './VenuePhoto';
import { Stars } from './Stars';
import { ratingsWord } from '../plural';

// Tinder-style discovery card. Swipe right → add to favorites; swipe left → "не люблю".
// Drag is tracked via window listeners so release is ALWAYS caught (no sticking).
export function TasteHero({
  item,
  favorite,
  onFavorite,
  onSkip,
  onShuffle,
  onOpenItem,
}: {
  item: Listing;
  favorite?: boolean;
  onFavorite: () => void; // swipe right / ♥ button → add to favorites
  onSkip: () => void; // swipe left = "не люблю" (negative taste signal)
  onShuffle: () => void; // swipe down → next card
  onOpenItem: () => void;
}) {
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState<'left' | 'right' | 'down' | null>(null);
  const [instant, setInstant] = useState(false); // snap back with no animation after a swipe
  const startX = useRef(0);
  const startY = useRef(0);
  const dxRef = useRef(0);
  const dyRef = useRef(0);
  const movedRef = useRef(false);
  const THRESHOLD = 90;
  const DOWN_THRESHOLD = 130; // strong pull down → dismiss the card

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      const d = e.clientX - startX.current;
      const v = e.clientY - startY.current;
      if (Math.abs(d) > 4 || Math.abs(v) > 4) movedRef.current = true;
      dxRef.current = d;
      dyRef.current = v;
      setDx(d);
      setDy(v);
    };
    const finish = () => {
      setDragging(false);
      const d = dxRef.current;
      const v = dyRef.current;
      const swapAndReset = (cb: () => void) => {
        setInstant(true); // reset to centre without sliding, so the next card just appears
        setLeaving(null);
        setDx(0);
        setDy(0);
        dxRef.current = 0;
        dyRef.current = 0;
        cb();
        requestAnimationFrame(() => setInstant(false));
      };
      if (v > DOWN_THRESHOLD && v > Math.abs(d)) {
        // strong pull down → next card (no taste signal)
        setLeaving('down');
        setTimeout(() => swapAndReset(onShuffle), 220);
      } else if (d > THRESHOLD) {
        setLeaving('right');
        setTimeout(() => swapAndReset(onFavorite), 220);
      } else if (d < -THRESHOLD) {
        setLeaving('left');
        setTimeout(() => swapAndReset(onSkip), 220);
      } else {
        setDx(0);
        setDy(0);
        dxRef.current = 0;
        dyRef.current = 0;
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  const onPointerDown = (e: React.PointerEvent) => {
    // let taps on buttons work normally — drag only on the rest of the card
    if ((e.target as HTMLElement).closest('button, a, input')) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    dxRef.current = 0;
    dyRef.current = 0;
    movedRef.current = false;
    setDx(0);
    setDy(0);
    setDragging(true);
  };

  const offsetX = leaving === 'right' ? 700 : leaving === 'left' ? -700 : leaving === 'down' ? 0 : dx;
  const offsetY = leaving === 'down' ? 1000 : leaving ? 0 : dy;
  const hint = dy > 60 && dy > Math.abs(dx) ? 'down' : dx > 40 ? 'right' : dx < -40 ? 'left' : null;

  return (
    <div
      className="hero swipeable"
      onPointerDown={onPointerDown}
      onDragStart={(e) => e.preventDefault()}
      style={{
        transform: `translate(${offsetX}px, ${offsetY}px) rotate(${offsetX * 0.03}deg)`,
        transition: dragging || instant ? 'none' : 'transform 0.25s ease',
        opacity: leaving === 'down' ? 0 : 1,
      }}
    >
      <div
        className="hero-media"
        onClick={() => {
          if (!movedRef.current) onOpenItem();
        }}
      >
        <VenuePhoto listing={item} className="hero-photo" draggable={false} />
        {!isUserPhoto(item.photoUrl) && (
          <span className="info-photo-badge">📷 Фото информационное</span>
        )}
        {item.recVenue && (item.recVenue as any).price != null && (
          <span className="newdish-price hero-price-badge">{(item.recVenue as any).price} ₽</span>
        )}
        {hint === 'right' && <div className="swipe-tag like">♥ В избранное</div>}
        {hint === 'left' && <div className="swipe-tag nope">Не люблю</div>}
        {hint === 'down' && <div className="swipe-tag nope">Скрыть ↓</div>}
      </div>
      <div className="hero-body">
        <div className="hero-name">{item.name}</div>
        {item.recVenue ? (
          <div className="hero-cat">📍 {item.recVenue.name}</div>
        ) : (
          item.category && <div className="hero-cat">{item.category}</div>
        )}
        {/* rating (grey stars + "Нет оценок" when none) — same style as the cards */}
        <div className="hero-rating">
          <Stars value={item.reviewCount > 0 ? item.avgRating : 0} />
          {item.reviewCount > 0 ? (
            <span className="hero-rating-val">
              {item.avgRating.toFixed(1)} ({item.reviewCount} {ratingsWord(item.reviewCount)})
            </span>
          ) : (
            <span className="hero-rating-val no">Нет оценок</span>
          )}
        </div>
        <div className="hero-rate-hint">← не люблю · в избранное →</div>
        <div className="hero-actions">
          <button className="hero-btn fav" onClick={onFavorite}>
            {favorite ? '♥ В избранном' : '♡ В избранное'}
          </button>
        </div>
      </div>
    </div>
  );
}
