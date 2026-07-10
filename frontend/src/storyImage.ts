import { api } from './api';
import { thumb } from './img';

// story compose is phone-only code — failures must surface in server logs
function report(step: string, detail?: string) {
  try {
    fetch('/api/health/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ where: 'story-compose', step, detail: (detail || '').slice(0, 300) }),
    }).catch(() => {});
  } catch { /* never break the flow */ }
}

// Composes a proper 9:16 Telegram story slide (1080×1920): the photo is drawn
// CONTAIN (never stretched — that was the bug with horizontal shots) over a
// soft-blurred copy of itself, with the app link on a pill bottom-right.
// Returns an absolute https URL (uploaded through our own storage) that
// tg.shareToStory accepts. Canvas stays untainted because the photo is loaded
// through our same-origin resize proxy.
const W = 1080;
const H = 1920;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// belt-and-suspenders: never open two story editors for the same photo within
// a minute, whatever upstream double-fires
const recentlyShared = new Map<string, number>();
export function storyAlreadyShared(photoUrl: string): boolean {
  const t = recentlyShared.get(photoUrl);
  recentlyShared.set(photoUrl, Date.now());
  return !!t && Date.now() - t < 60_000;
}

export async function composeStoryImage(photoUrl: string): Promise<string | null> {
  let step = 'start';
  try {
    const src = thumb(photoUrl, 900) ?? photoUrl; // same-origin (files or /api/img proxy)
    step = 'load:' + src.slice(0, 60);
    const img = await loadImage(src);
    step = 'canvas';
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // background: cheap universal "blur" — draw tiny, then scale up (ctx.filter
    // is not supported in older iOS WebViews), then darken
    const tiny = document.createElement('canvas');
    tiny.width = 27;
    tiny.height = 48;
    const tctx = tiny.getContext('2d')!;
    const coverScale = Math.max(tiny.width / img.width, tiny.height / img.height);
    const cw = img.width * coverScale;
    const ch = img.height * coverScale;
    tctx.drawImage(img, (tiny.width - cw) / 2, (tiny.height - ch) / 2, cw, ch);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tiny, 0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, W, H);

    // foreground: the photo itself, CONTAIN — full frame, no stretching
    const fit = Math.min((W * 0.92) / img.width, (H * 0.72) / img.height);
    const fw = img.width * fit;
    const fh = img.height * fit;
    const fx = (W - fw) / 2;
    const fy = (H - fh) / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 12;
    // rounded corners for the photo
    const r = 28;
    ctx.beginPath();
    ctx.moveTo(fx + r, fy);
    ctx.arcTo(fx + fw, fy, fx + fw, fy + fh, r);
    ctx.arcTo(fx + fw, fy + fh, fx, fy + fh, r);
    ctx.arcTo(fx, fy + fh, fx, fy, r);
    ctx.arcTo(fx, fy, fx + fw, fy, r);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, fx, fy, fw, fh);
    ctx.restore();

    // bottom-right: app-link pill (the story widget_link is Premium-only, so the
    // link must live on the image itself)
    const label = 't.me/togomoscow_bot';
    ctx.font = '600 40px system-ui, -apple-system, sans-serif';
    const tw = ctx.measureText(label).width;
    const padX = 36;
    const pillW = tw + padX * 2;
    const pillH = 88;
    const px = W - pillW - 48;
    const py = H - pillH - 72;
    ctx.fillStyle = 'rgba(211,35,35,0.92)'; // brand red
    ctx.beginPath();
    const pr = pillH / 2;
    ctx.moveTo(px + pr, py);
    ctx.arcTo(px + pillW, py, px + pillW, py + pillH, pr);
    ctx.arcTo(px + pillW, py + pillH, px, py + pillH, pr);
    ctx.arcTo(px, py + pillH, px, py, pr);
    ctx.arcTo(px, py, px + pillW, py, pr);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, px + padX, py + pillH / 2 + 2);

    step = 'toBlob';
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.88));
    if (!blob) { report('toBlob', 'null blob'); return null; }
    step = 'upload';
    const file = new File([blob], 'story.jpg', { type: 'image/jpeg' });
    // the upload happens right after a review save — the backend may still be busy,
    // so give it a second chance before giving up on the composed slide
    let url: string | null = null;
    try {
      url = await api.upload(file);
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
      url = await api.upload(file).catch(() => null);
    }
    if (!url) report('upload', 'both attempts failed');
    return url ? `${location.origin}${url}` : null;
  } catch (e: any) {
    report(step, e?.message || String(e));
    return null;
  }
}

/** Raw-photo escape hatch: portrait/square shots Telegram shows fine as-is.
 *  Returns an absolute URL for shareToStory, or null for landscape (would stretch). */
export async function portraitStoryFallback(photoUrl: string): Promise<string | null> {
  try {
    const src = thumb(photoUrl, 900) ?? photoUrl;
    const img = await loadImage(src);
    if (img.height >= img.width) {
      return /^https?:/.test(photoUrl) ? photoUrl : `${location.origin}${photoUrl}`;
    }
  } catch { /* ignore */ }
  return null;
}
