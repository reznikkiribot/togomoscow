import { useEffect, type RefObject } from 'react';

// Swipe-to-dismiss for every sheet/card (Instagram/iOS-sheet pattern):
//  • drag starts only when the sheet is scrolled to the very top (otherwise it's
//    a normal content scroll) and the finger moves DOWN;
//  • the sheet follows the finger 1:1, the backdrop fades proportionally;
//  • release past 120px OR a fast downward fling (>0.5 px/ms) dismisses with
//    momentum; anything less springs back (slight iOS-style overshoot).
// Native listeners with passive:false — React's synthetic touchmove cannot
// preventDefault, and the content scroll must be frozen while dragging.
export function useSwipeDismiss(
  sheetRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
  opts: { fadeBackdrop?: boolean } = {},
) {
  const { fadeBackdrop = true } = opts;
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const backdrop = fadeBackdrop ? el.parentElement : null;
    let startY = 0;
    let lastY = 0;
    let lastT = 0;
    let velocity = 0;
    let dragging = false;
    let armed = false;
    let closed = false;

    const start = (e: TouchEvent) => {
      startY = lastY = e.touches[0].clientY;
      lastT = performance.now();
      velocity = 0;
      armed = el.scrollTop <= 0; // only from the very top
      dragging = false;
    };
    const move = (e: TouchEvent) => {
      if (closed) return;
      const y = e.touches[0].clientY;
      const dy = y - startY;
      const now = performance.now();
      velocity = (y - lastY) / Math.max(1, now - lastT);
      lastY = y;
      lastT = now;
      if (!dragging) {
        if (armed && dy > 8 && el.scrollTop <= 0) dragging = true;
        else return;
      }
      if (e.cancelable) e.preventDefault(); // sheet follows the finger, not the scroll
      const t = Math.max(0, dy);
      el.style.transition = 'none';
      el.style.transform = `translateY(${t}px)`;
      if (backdrop) backdrop.style.background = `rgba(0,0,0,${Math.max(0.15, 0.5 - t / 600)})`;
    };
    const end = () => {
      if (!dragging || closed) return;
      dragging = false;
      const dy = lastY - startY;
      if (dy > 120 || velocity > 0.5) {
        closed = true;
        el.style.transition = 'transform 0.2s ease-out';
        el.style.transform = 'translateY(100%)';
        setTimeout(onDismiss, 190);
      } else {
        el.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1.2)';
        el.style.transform = '';
        if (backdrop) backdrop.style.background = '';
      }
    };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end, { passive: true });
    el.addEventListener('touchcancel', end, { passive: true });
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
