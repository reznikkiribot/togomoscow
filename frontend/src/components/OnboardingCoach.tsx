import { useEffect, useLayoutEffect, useState } from 'react';

// Interactive coach-mark that runs ON TOP of the real app (not a separate screen):
// it dims everything, cuts a spotlight hole around the ONE element the user should
// tap next, and shows a short instruction. Everything outside the hole is
// non-interactive, so the user can only take the guided step. Steps advance when
// the target is acted on (the host tells us via `step`).
//
// Owner rule: the first rating must feel like using the app itself, led step by
// step — «подсвечивая то, что нужно нажать, а остальное делать некликабельным».

export type CoachStep = {
  // CSS selector of the element to spotlight (first match)
  selector: string;
  title: string;
  hint: string;
  // where the tooltip sits relative to the hole
  place?: 'top' | 'bottom';
};

export function OnboardingCoach({
  steps,
  stepIndex,
  onSkip,
}: {
  steps: CoachStep[];
  stepIndex: number;
  onSkip: () => void;
}) {
  const step = steps[stepIndex];
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Position the spotlight on the target and keep it in sync on scroll/resize.
  // The earlier version re-measured EVERY animation frame (a rAF loop calling
  // getBoundingClientRect + setState 60×/s), which janked the whole screen and
  // made the star tap feel laggy. Now we measure once, scroll the target into
  // view ONCE, then only re-measure on scroll/resize (passive).
  useLayoutEffect(() => {
    if (!step) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const measure = () => setRect(el.getBoundingClientRect());
    // let the smooth-scroll settle, then lock the position
    const t1 = window.setTimeout(measure, 120);
    const t2 = window.setTimeout(measure, 420);
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(t1); window.clearTimeout(t2);
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [step]);

  // let taps INSIDE the hole reach the real element, block everything else
  useEffect(() => {
    if (!rect) return;
    const onCapture = (e: MouseEvent | TouchEvent) => {
      const pt = 'touches' in e ? e.touches[0] ?? (e as any).changedTouches?.[0] : (e as MouseEvent);
      if (!pt) return;
      const inside =
        pt.clientX >= rect.left - 8 && pt.clientX <= rect.right + 8 &&
        pt.clientY >= rect.top - 8 && pt.clientY <= rect.bottom + 8;
      if (!inside) { e.preventDefault(); e.stopPropagation(); }
    };
    document.addEventListener('click', onCapture, true);
    return () => document.removeEventListener('click', onCapture, true);
  }, [rect]);

  if (!step) return null;

  const pad = 8;
  const hole = rect
    ? { x: rect.left - pad, y: rect.top - pad, w: rect.width + pad * 2, h: rect.height + pad * 2 }
    : null;
  const place = step.place ?? (hole && hole.y > window.innerHeight / 2 ? 'top' : 'bottom');

  return (
    <div className="coach-root" aria-live="polite">
      {/* four dim panels around the hole → the hole itself stays clickable */}
      {hole ? (
        <>
          <div className="coach-dim" style={{ top: 0, left: 0, right: 0, height: Math.max(0, hole.y) }} />
          <div className="coach-dim" style={{ top: hole.y + hole.h, left: 0, right: 0, bottom: 0 }} />
          <div className="coach-dim" style={{ top: hole.y, left: 0, width: Math.max(0, hole.x), height: hole.h }} />
          <div className="coach-dim" style={{ top: hole.y, left: hole.x + hole.w, right: 0, height: hole.h }} />
          <div className="coach-ring" style={{ top: hole.y, left: hole.x, width: hole.w, height: hole.h }} />
        </>
      ) : (
        <div className="coach-dim" style={{ inset: 0 }} />
      )}

      <div
        className={'coach-tip ' + place}
        style={
          hole
            ? place === 'top'
              ? { top: hole.y - 12, left: Math.max(12, Math.min(hole.x, window.innerWidth - 300)) }
              : { top: hole.y + hole.h + 12, left: Math.max(12, Math.min(hole.x, window.innerWidth - 300)) }
            : { top: '40%', left: 12, right: 12 }
        }
      >
        <div className="coach-step-num">Шаг {stepIndex + 1} из {steps.length}</div>
        <div className="coach-title">{step.title}</div>
        <div className="coach-hint">{step.hint}</div>
        <button className="coach-skip" onClick={onSkip}>Пропустить обучение</button>
      </div>
    </div>
  );
}
