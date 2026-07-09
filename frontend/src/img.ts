// Thumbnail helpers.
//  • our own uploads (/api/files/<key>) support server-side resize via ?w=
//  • EXTERNAL https photos (unsplash / brand CDNs, multi-MB originals) are routed
//    through our /api/img proxy: resized WebP from our origin, cached immutable —
//    this is what makes card photos load in <1s instead of ~3s.
export function thumb(url: string | null | undefined, w: 200 | 400 | 600 | 900 = 600): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/api/files/') && !url.includes('?')) return `${url}?w=${w}`;
  if (url.startsWith('https://')) return `/api/img?u=${encodeURIComponent(url)}&w=${w}`;
  return url;
}
