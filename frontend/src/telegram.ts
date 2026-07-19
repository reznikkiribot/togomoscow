export const tg = window.Telegram?.WebApp;

// Telegram may inject WebApp after this module is evaluated on a cold mobile
// launch. Runtime actions must never rely on the module-scope snapshot.
export function telegramWebApp() {
  return window.Telegram?.WebApp ?? tg;
}

// Raw signed string we send to the backend for auth.
export const initData = tg?.initData ?? '';

type TelegramInset = { top?: number; right?: number; bottom?: number; left?: number };

let telegramInitialized = false;
const verticalSwipeLocks = new Set<symbol>();

function themeValue(params: Record<string, string> | undefined, key: string) {
  if (!params) return undefined;
  const camel = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
  return params[key] ?? params[camel];
}

function syncTelegramTheme() {
  const webApp = telegramWebApp();
  const root = document.documentElement;
  if (!webApp) {
    delete root.dataset.tgTheme;
    root.style.colorScheme = 'light dark';
    return;
  }
  const params = webApp?.themeParams;
  const bg = themeValue(params, 'bg_color');
  const text = themeValue(params, 'text_color');
  const hint = themeValue(params, 'hint_color');
  const button = themeValue(params, 'button_color');
  const buttonText = themeValue(params, 'button_text_color');
  const secondary = themeValue(params, 'secondary_bg_color');
  const separator = themeValue(params, 'section_separator_color');
  const dark = webApp?.colorScheme === 'dark';

  root.dataset.tgTheme = dark ? 'dark' : 'light';
  root.style.colorScheme = dark ? 'dark' : 'light';
  if (bg) root.style.setProperty('--bg', bg);
  if (text) root.style.setProperty('--text', text);
  if (hint) root.style.setProperty('--hint', hint);
  if (button) {
    root.style.setProperty('--accent', button);
    root.style.setProperty('--star', button);
  }
  if (buttonText) root.style.setProperty('--accent-text', buttonText);
  if (secondary) {
    root.style.setProperty('--card', secondary);
    root.style.setProperty('--secondary-bg', secondary);
  }
  if (separator) root.style.setProperty('--border', separator);

  const header = secondary ?? bg;
  try { if (header) webApp?.setHeaderColor?.(header); } catch { /* older Telegram client */ }
  try { if (bg) webApp?.setBackgroundColor?.(bg); } catch { /* older Telegram client */ }
  try { if (secondary ?? bg) webApp?.setBottomBarColor?.(secondary ?? bg!); } catch { /* older Telegram client */ }
}

function setInsetVars(prefix: string, inset?: TelegramInset) {
  if (!inset) return;
  const root = document.documentElement;
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    const value = inset[side];
    if (typeof value === 'number') root.style.setProperty(`${prefix}-${side}`, `${value}px`);
  }
}

function syncTelegramViewport() {
  const webApp = telegramWebApp();
  const root = document.documentElement;
  const stableHeight = webApp?.viewportStableHeight || window.innerHeight;
  const viewportHeight = webApp?.viewportHeight || window.visualViewport?.height || window.innerHeight;
  root.style.setProperty('--tg-viewport-stable-height', `${Math.round(stableHeight)}px`);
  root.style.setProperty('--tg-viewport-height', `${Math.round(viewportHeight)}px`);
  setInsetVars('--tg-safe-area-inset', webApp?.safeAreaInset);
  setInsetVars('--tg-content-safe-area-inset', webApp?.contentSafeAreaInset);
}

function syncVerticalSwipes() {
  const webApp = telegramWebApp();
  try {
    if (verticalSwipeLocks.size > 0) webApp?.disableVerticalSwipes?.();
    else webApp?.enableVerticalSwipes?.();
  } catch {
    /* unsupported client */
  }
}

/** Keep Telegram's collapse gesture enabled except during a real gesture conflict. */
export function lockVerticalSwipes() {
  const token = Symbol('vertical-swipe-lock');
  verticalSwipeLocks.add(token);
  syncVerticalSwipes();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    verticalSwipeLocks.delete(token);
    syncVerticalSwipes();
  };
}

export function initTelegram() {
  try {
    const webApp = telegramWebApp();
    if (webApp?.initData) sessionStorage.setItem('tg:initData', webApp.initData);
    webApp?.ready();
    webApp?.expand();
    syncTelegramTheme();
    syncTelegramViewport();
    syncVerticalSwipes();
    if (telegramInitialized) return;
    telegramInitialized = true;
    webApp?.onEvent?.('themeChanged', syncTelegramTheme);
    webApp?.onEvent?.('viewportChanged', syncTelegramViewport);
    webApp?.onEvent?.('safeAreaChanged', syncTelegramViewport);
    webApp?.onEvent?.('contentSafeAreaChanged', syncTelegramViewport);
    window.visualViewport?.addEventListener('resize', syncTelegramViewport, { passive: true });
    window.addEventListener('resize', syncTelegramViewport, { passive: true });
    // global tactile feedback: a light tap on every button/interactive element press
    document.addEventListener(
      'pointerdown',
      (e) => {
        const el = e.target as HTMLElement;
        if (el?.closest?.('button, a, .chip, .cat-tile, [role="button"]')) haptic('light');
      },
      { passive: true, capture: true },
    );
  } catch {
    // running outside Telegram (e.g. plain browser) — ignore
  }
}

export const tgUser = tg?.initDataUnsafe?.user;

const appOrigin = window.location.origin;

// light haptic tap feedback (no-op outside Telegram)
export function haptic(style: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid' = 'light') {
  try {
    telegramWebApp()?.HapticFeedback?.impactOccurred(style);
  } catch {
    /* ignore */
  }
}

// Opens a URL outside the Mini App (e.g. Yandex Maps) — uses Telegram's
// native opener when available, falls back to a normal new tab.
export function openExternal(url: string) {
  const webApp = telegramWebApp();
  if (webApp?.openLink) webApp.openLink(url);
  else window.open(url, '_blank');
}

// Deep link that reopens the Mini App on a specific listing (needs the bot's
// Main Mini App enabled in BotFather so ?startapp= opens the app, not the chat).
export function appDeepLink(startParam: string): string {
  return `https://t.me/togomoscow_bot?startapp=${startParam}`;
}

// Share a dish/drink review to the user's Telegram Story with a tappable link
// back into the app (Bot API 7.8+). Falls back to the share sheet on old clients.
export function shareToStory(mediaUrl: string, text: string, startParam: string): boolean {
  const w = telegramWebApp() as any;
  const link = appDeepLink(startParam);
  const absoluteMedia = mediaUrl.startsWith('/') ? `${appOrigin}${mediaUrl}` : mediaUrl;
  try {
    if (w?.shareToStory) {
      w.shareToStory(absoluteMedia, {
        text,
        // short link name → a small link sticker (placed top-right by default);
        // its exact position is then user-draggable in Telegram's story editor.
        widget_link: { url: link, name: 'togomoscow' },
      });
      return true;
    }
  } catch {
    /* fall through to the share sheet */
  }
  openExternal(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
  return true;
}

// Send a prepared rich message (photo + caption + button) to a friend's chat.
// `id` comes from the backend's savePreparedInlineMessage. Returns true if handled.
export function shareMessage(id: string): boolean {
  const w = telegramWebApp() as any;
  try {
    if (w?.shareMessage) { w.shareMessage(id); return true; }
  } catch { /* unsupported client */ }
  return false;
}

// Send a check-in to a friend in Telegram (opens the "share to chat" picker).
// If a review photo is given, it's shared as the link preview (so the friend sees
// the photo); the user's own comment becomes the message text.
export function shareToChat(text: string, startParam: string, photoUrl?: string) {
  const link = appDeepLink(startParam);
  // a relative /api/files/… path won't load for the friend → make it absolute
  const absPhoto = photoUrl && photoUrl.startsWith('/') ? `${appOrigin}${photoUrl}` : photoUrl;
  const shareUrl = absPhoto || link;
  const shareText = photoUrl ? `${text}\n${link}` : text;
  const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
  const w = telegramWebApp() as any;
  try {
    if (w?.openTelegramLink) { w.openTelegramLink(url); return; }
  } catch { /* fall through */ }
  openExternal(url);
}

// Normalizes a phone to a tel: href. A REAL <a href="tel:"> tap is the only
// thing that reliably opens the dialer in webviews (desktop + Android). iOS
// Telegram still blocks it → callers show a copy-number fallback.
export function telHref(raw: string): string {
  return `tel:${(raw || '').replace(/[^\d+]/g, '')}`;
}

// Place a call. The Mini App WEBVIEW blocks the tel: scheme, but Telegram's IN-APP
// BROWSER allows it — so we open a branded redirect page (call.html) via tg.openLink,
// which fires tel: from that allowed context and shows the venue + a back-to-app link.
// Outside Telegram → native tel:.
export function callPhone(raw: string, venueName?: string, backParam?: string) {
  const num = (raw || '').replace(/[^\d+]/g, '');
  if (!num) return;
  const w = telegramWebApp() as any;
  try {
    if (w?.openLink) {
      const p = new URLSearchParams({ n: num });
      if (venueName) p.set('name', venueName);
      if (backParam) p.set('back', backParam); // e.g. "l_<listingId>" → reopen that card
      w.openLink(`${appOrigin}/call.html?${p.toString()}`);
      return;
    }
  } catch { /* fall through to native */ }
  window.location.href = `tel:${num}`;
}
