// Thumbnail helper: our own uploads (/api/files/<key>) support server-side resize
// via ?w= (webp, cached in storage). External URLs pass through untouched.
export function thumb(url: string | null | undefined, w: 200 | 400 | 600 | 900 = 600): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/api/files/') && !url.includes('?')) return `${url}?w=${w}`;
  return url;
}
