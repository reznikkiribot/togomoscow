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
// background (scroll-chaining / touch leaking to the home screen).
// position:fixed + top compensation — plain overflow:hidden/height:100% RESETS the
// scroll position, so closing a card used to jump the page back to the top.
let lockedScrollY = 0;
function syncBodyLock() {
  if (typeof document === 'undefined') return;
  const body = document.body;
  const wantLock = stack.length > 0;
  const isLocked = body.classList.contains('modal-open');
  if (wantLock && !isLocked) {
    lockedScrollY = window.scrollY;
    body.classList.add('modal-open');
    body.style.position = 'fixed';
    body.style.top = `-${lockedScrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
  } else if (!wantLock && isLocked) {
    body.classList.remove('modal-open');
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    window.scrollTo(0, lockedScrollY); // restore EXACTLY where the card was opened
  }
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
