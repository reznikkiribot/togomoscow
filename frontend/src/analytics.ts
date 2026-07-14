// Lightweight behavior analytics: tracks which screen the user is on, how long
// they stay, how far they scroll, and where the session ends — sent to the
// backend on exit so we can surface UX-improvement insights in the cabinet.
type ScreenStat = { name: string; ms: number; maxScroll: number };

let current: { name: string; enteredAt: number; maxScroll: number } | null = null;
const screens: ScreenStat[] = [];
const sessionStart = Date.now();
let sent = false;

function flushCurrent() {
  if (!current) return;
  const ms = Date.now() - current.enteredAt;
  const existing = screens.find((s) => s.name === current!.name);
  if (existing) { existing.ms += ms; existing.maxScroll = Math.max(existing.maxScroll, current.maxScroll); }
  else screens.push({ name: current.name, ms, maxScroll: current.maxScroll });
}

// call when the visible screen changes (route or major modal)
export function trackScreen(name: string) {
  const scrollFrac = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    return max > 0 ? Math.min(1, h.scrollTop / max) : 0;
  };
  if (current) { current.maxScroll = Math.max(current.maxScroll, scrollFrac()); flushCurrent(); }
  current = { name, enteredAt: Date.now(), maxScroll: 0 };
}

function trackScroll() {
  if (!current) return;
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  if (max > 0) current.maxScroll = Math.max(current.maxScroll, Math.min(1, h.scrollTop / max));
}

function sendSummary() {
  if (sent) return;
  sent = true;
  flushCurrent();
  const payload = {
    kind: 'session',
    totalMs: Date.now() - sessionStart,
    lastScreen: current?.name ?? screens[screens.length - 1]?.name ?? null,
    screens: screens.map((s) => ({ name: s.name, ms: s.ms, maxScroll: +s.maxScroll.toFixed(2) })),
  };
  try {
    const body = JSON.stringify(payload);
    // sendBeacon survives the app closing; fetch keepalive is the fallback
    if (navigator.sendBeacon) navigator.sendBeacon('/api/health/behavior', new Blob([body], { type: 'application/json' }));
    else fetch('/api/health/behavior', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
  } catch { /* ignore */ }
}

export function initAnalytics() {
  window.addEventListener('scroll', trackScroll, { passive: true });
  // Telegram/iOS: the app closing fires pagehide / visibility-hidden most reliably
  window.addEventListener('pagehide', sendSummary);
  document.addEventListener('visibilitychange', () => { if (document.hidden) sendSummary(); });
}
