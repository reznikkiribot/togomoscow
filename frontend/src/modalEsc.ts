import { useEffect, useRef } from 'react';

// Global modal stack so pressing Esc / Back closes only the TOPMOST modal/screen.
const stack: Array<() => void> = [];
let bound = false;

/** True while any modal/overlay is open — screens use this to defer their own Esc. */
export function hasOpenModal() {
  return stack.length > 0;
}

// On Telegram DESKTOP a single Esc can fire BOTH the keydown and the native
// BackButton, popping two layers at once (e.g. filter sheet AND the map browse →
// bounced all the way to home). Debounce so one press = one step back.
let lastPop = 0;
function popTop() {
  const now = Date.now();
  if (now - lastPop < 350) return;
  lastPop = now;
  if (stack.length) stack[stack.length - 1]();
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && stack.length) {
    e.preventDefault();
    popTop();
  }
}

// Telegram's native BackButton — the reliable "back" on desktop & mobile, where
// the host app may swallow the Esc key before the webview ever sees it.
function tgBack(): any {
  return (window as any).Telegram?.WebApp?.BackButton ?? null;
}
function syncBackButton() {
  const bb = tgBack();
  if (!bb) return;
  if (stack.length) bb.show();
  else bb.hide();
}

// lock the page behind any open modal so scrolling the card never drags the
// background (scroll-chaining / touch leaking to the home screen)
function syncBodyLock() {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('modal-open', stack.length > 0);
}

/** Closes this modal/screen on Esc / Back (only when it's the top of the stack). */
export function useEscClose(onClose: () => void) {
  const ref = useRef(onClose);
  ref.current = onClose;
  useEffect(() => {
    if (!bound) {
      // capture phase + window: catch Esc before anything else swallows it
      window.addEventListener('keydown', onKey, true);
      tgBack()?.onClick(popTop);
      bound = true;
    }
    const fn = () => ref.current();
    stack.push(fn);
    syncBackButton();
    syncBodyLock();
    return () => {
      const i = stack.indexOf(fn);
      if (i >= 0) stack.splice(i, 1);
      syncBackButton();
      syncBodyLock();
    };
  }, []);
}
