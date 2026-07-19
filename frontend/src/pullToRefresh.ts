import { useEffect, useRef, useState } from 'react';
import { haptic } from './telegram';
import { hasOpenModal } from './modalEsc';

// iOS-style pull-to-refresh: when the page is scrolled to the very top and the
// user drags DOWN past a threshold, reload. Rubber-band follow + a spinner that
// grows with the pull; releasing past the threshold triggers onRefresh (or a
// full page reload by default). Ignores horizontal swipes (that's swipe-back).
export function usePullToRefresh(onRefresh?: () => void | Promise<void>, enabled = true) {
  const [pull, setPull] = useState(0); // px, damped
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const startX = useRef(0);
  const active = useRef(false);
  const THRESHOLD = 72;

  useEffect(() => {
    const scroller = document.scrollingElement || document.documentElement;
    const isBlocked = (target?: EventTarget | null) =>
      !enabled ||
      hasOpenModal() ||
      !!document.querySelector('.modal-backdrop') ||
      (target instanceof Element && !!target.closest('.hero.swipeable'));
    const cancel = () => {
      active.current = false;
      setPull(0);
    };
    const onStart = (e: TouchEvent) => {
      if (refreshing || isBlocked(e.target)) { cancel(); return; }
      // only arm at the very top and when nothing is scrolled under the finger
      if ((scroller.scrollTop || 0) > 0) { active.current = false; return; }
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
      active.current = true;
    };
    const onMove = (e: TouchEvent) => {
      if (!active.current || refreshing) return;
      if (isBlocked(e.target)) { cancel(); return; }
      const dy = e.touches[0].clientY - startY.current;
      const dx = e.touches[0].clientX - startX.current;
      if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) { active.current = false; setPull(0); return; }
      if ((scroller.scrollTop || 0) > 0) { active.current = false; setPull(0); return; }
      // rubber-band: the further you pull, the more resistance
      const damped = Math.min(140, dy * 0.5);
      setPull(damped);
    };
    const onEnd = async () => {
      if (!active.current) return;
      active.current = false;
      if (isBlocked()) { setPull(0); return; }
      if (pull >= THRESHOLD && !refreshing) {
        haptic('medium');
        setRefreshing(true);
        setPull(THRESHOLD);
        try {
          if (onRefresh) await onRefresh();
          else window.location.reload();
        } finally {
          // if onRefresh resolved without a reload, retract the spinner
          setTimeout(() => { setRefreshing(false); setPull(0); }, 400);
        }
      } else {
        setPull(0);
      }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [enabled, pull, refreshing, onRefresh]);

  return { pull, refreshing, threshold: THRESHOLD };
}
