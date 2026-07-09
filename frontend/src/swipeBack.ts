import { useEffect, type RefObject } from 'react';

// Swipe-back for FULL-SCREEN pushed pages (profile, category map): a rightward
// drag from ANYWHERE (not just the edge) — the page sticks to the finger from the
// very first pixels; release past a third of the width (or a fling) → back,
// else it springs home. Touches that start inside horizontal scrollers
// (carousels, chip rows) are left alone. Sheets/cards keep their swipe-DOWN.
export function useSwipeBack(pageRef: RefObject<HTMLElement | null>, onBack: () => void) {
  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    let detach: (() => void) | null = null;
    const tryAttach = () => {
      if (cancelled) return;
      const el = pageRef.current;
      if (!el) {
        raf = requestAnimationFrame(tryAttach);
        return;
      }
      detach = attach(el);
    };
    const attach = (el: HTMLElement): (() => void) => {
      let startX = 0;
      let startY = 0;
      let lastX = 0;
      let lastT = 0;
      let velocity = 0;
      let dragging = false;
      let armed = false;
      let closed = false;

      // horizontal scrollers keep their own gesture — a back-swipe must not
      // hijack carousels / chip rows
      const inHorizontalScroller = (t: EventTarget | null) =>
        t instanceof Element &&
        !!t.closest('.feed, .rc-carousel, .cat-bar, .opt-chips, .card-tags, .filterbar, .tabs, .leaflet-container');
      const start = (e: TouchEvent) => {
        startX = lastX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        lastT = performance.now();
        velocity = 0;
        armed = !inHorizontalScroller(e.target); // anywhere on the page, not just the edge
        dragging = false;
      };
      const move = (e: TouchEvent) => {
        if (closed || !armed) return;
        const x = e.touches[0].clientX;
        const dx = x - startX;
        const dyAbs = Math.abs(e.touches[0].clientY - startY);
        const now = performance.now();
        velocity = (x - lastX) / Math.max(1, now - lastT);
        lastX = x;
        lastT = now;
        if (!dragging) {
          // react IMMEDIATELY: capture on the very first horizontal pixels
          if (dx > 4 && dx > dyAbs * 1.2 && e.cancelable) dragging = true;
          else if (dyAbs > 10) { armed = false; return; } // it's a vertical scroll
          else return;
        }
        if (e.cancelable) e.preventDefault();
        el.style.transition = 'none';
        el.style.transform = `translateX(${Math.max(0, dx)}px)`;
      };
      const end = () => {
        if (!dragging || closed) return;
        dragging = false;
        const dx = lastX - startX;
        if (dx > el.clientWidth * 0.33 || (velocity > 0.8 && dx > 50)) {
          closed = true;
          el.style.transition = 'transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)';
          el.style.transform = 'translateX(105%)';
          setTimeout(onBack, 280);
        } else {
          el.style.transition = 'transform 0.4s cubic-bezier(0.22, 1.1, 0.36, 1)';
          el.style.transform = '';
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
    };
    tryAttach();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      detach?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
