import { useEffect, useRef, type RefObject } from 'react';

type ScrollSnapshot = { element: HTMLElement; top: number; left: number };
type ModalLayer = {
  close: () => void;
  root: HTMLElement | null;
  originalZIndex: string;
  scroll: ScrollSnapshot[];
};

// Global overlay stack. Besides Esc/Telegram Back, it owns gesture priority,
// visual ordering and the exact scroll context each child was opened from.
const stack: ModalLayer[] = [];
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
  if (stack.length) stack[stack.length - 1].close();
}

/** True only for an element that belongs to the currently visible top layer. */
export function isTopModalElement(element: HTMLElement | null) {
  const top = stack[stack.length - 1];
  if (!top || !top.root || !element) return true;
  return top.root === element || top.root.contains(element);
}

function captureScroll(root: HTMLElement | null): ScrollSnapshot[] {
  if (typeof document === 'undefined') return [];
  const snapshots: ScrollSnapshot[] = [];
  for (const element of document.querySelectorAll<HTMLElement>('body *')) {
    if (root && root.contains(element)) continue;
    if (element.scrollTop || element.scrollLeft) {
      snapshots.push({ element, top: element.scrollTop, left: element.scrollLeft });
    }
  }
  return snapshots;
}

function restoreScroll(snapshots: ScrollSnapshot[]) {
  // React first removes the child overlay, then the next frame restores its
  // source. Two frames also cover sheets whose closing animation changes layout.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    for (const { element, top, left } of snapshots) {
      if (!element.isConnected) continue;
      element.scrollTop = top;
      element.scrollLeft = left;
    }
  }));
}

function syncLayerOrder() {
  stack.forEach((layer, index) => {
    if (layer.root) layer.root.style.zIndex = String(2400 + index * 100);
  });
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

/**
 * Registers one modal/full-screen overlay. Esc, Telegram Back and gestures close
 * only the top layer. Passing the outermost root also enables deterministic
 * z-order and source-container scroll restoration for nested overlays.
 */
export function useEscClose(
  onClose: () => void,
  rootRef?: RefObject<HTMLElement | null>,
  enabled = true,
) {
  const ref = useRef(onClose);
  ref.current = onClose;
  useEffect(() => {
    if (!enabled) return;
    if (!bound) {
      // capture phase + window: catch Esc before anything else swallows it
      window.addEventListener('keydown', onKey, true);
      tgBack()?.onClick(popTop);
      bound = true;
    }
    const root = rootRef?.current ?? null;
    const layer: ModalLayer = {
      close: () => ref.current(),
      root,
      originalZIndex: root?.style.zIndex ?? '',
      scroll: captureScroll(root),
    };
    stack.push(layer);
    syncLayerOrder();
    syncBackButton();
    syncBodyLock();
    return () => {
      const i = stack.indexOf(layer);
      if (i >= 0) stack.splice(i, 1);
      if (root) root.style.zIndex = layer.originalZIndex;
      syncLayerOrder();
      syncBackButton();
      syncBodyLock();
      restoreScroll(layer.scroll);
    };
  }, [enabled]);
}
