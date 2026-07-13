import { useEffect, useRef, useState } from 'react';
import { haptic } from '../telegram';

// YouTube-style «⋯ → Не интересно» control for a card. Tapping the dots opens a
// small popover; «Не интересно» sends a negative signal (the parent hides the
// card and the recommender learns to show less of this category).
export function NotInterested({ onNotInterested }: { onNotInterested: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  }, [open]);
  return (
    <div className="ni-wrap" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        className="ni-dots"
        aria-label="Ещё"
        onClick={(e) => { e.stopPropagation(); haptic('light'); setOpen((o) => !o); }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>
      {open && (
        <div className="ni-pop">
          <button
            className="ni-item"
            onClick={(e) => { e.stopPropagation(); setOpen(false); haptic('medium'); onNotInterested(); }}
          >
            🚫 Не интересно
          </button>
        </div>
      )}
    </div>
  );
}
