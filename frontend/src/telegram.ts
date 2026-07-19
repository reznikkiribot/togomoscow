export const tg = window.Telegram?.WebApp;

// Telegram may inject WebApp after this module is evaluated on a cold mobile
// launch. Runtime actions must never rely on the module-scope snapshot.
export function telegramWebApp() {
  return window.Telegram?.WebApp ?? tg;
}

// Raw signed string we send to the backend for auth.
export const initData = tg?.initData ?? '';

export function initTelegram() {
  try {
    const webApp = telegramWebApp();
    if (webApp?.initData) sessionStorage.setItem('tg:initData', webApp.initData);
    webApp?.ready();
    webApp?.expand();
    // stop the app from collapsing when the user pulls a list down (Bot API 7.7+)
    (webApp as any)?.disableVerticalSwipes?.();
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
