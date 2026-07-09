import { useEffect, useState } from 'react';
import type { Listing } from '../types';
import { thumb } from '../img';

export const TYPE_EMOJI: Record<Listing['type'], string> = {
  RESTAURANT: '🍽️',
  DISH: '🍝',
  DRINK: '🍷',
};

function domainOf(website?: string | null): string | null {
  if (!website) return null;
  try {
    return new URL(website).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function colorFromName(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360} 42% 42%)`;
}

function isSlowExternalPhoto(src?: string | null) {
  return !!src && /images\.unsplash|images\.pexels|pixabay|picsum/i.test(src);
}

export function listingPhotoCandidates(listing: Listing): string[] {
  const domain = domainOf(listing.website);
  const candidates: string[] = [];
  // real photo FIRST, but through our resize-proxy (small webp, our origin,
  // immutable cache) — the raw external URL stays as the fallback candidate
  if (listing.photoUrl) {
    const proxied = thumb(listing.photoUrl, 600);
    if (proxied && proxied !== listing.photoUrl) candidates.push(proxied);
  }
  const slowExternal = isSlowExternalPhoto(listing.photoUrl);
  if (slowExternal && listing.placeholderPhoto) candidates.push(listing.placeholderPhoto);
  if (listing.photoUrl) candidates.push(listing.photoUrl);
  if (!slowExternal && listing.placeholderPhoto) candidates.push(listing.placeholderPhoto);
  if (domain) {
    candidates.push(`https://logo.clearbit.com/${domain}`);
    candidates.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
  }
  return candidates;
}

export function preloadListingPhotos(listings: Listing[], limit = 10) {
  if (typeof Image === 'undefined') return;
  const seen = new Set<string>();
  for (const l of listings) {
    const src = listingPhotoCandidates(l)[0];
    if (!src || seen.has(src)) continue;
    seen.add(src);
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    if (seen.size >= limit) break;
  }
}

/**
 * Best available image for a venue, with graceful fallback on load error:
 * real/local stock photo → brand logo (Clearbit) → site favicon → monogram tile.
 */
export function VenuePhoto({
  listing,
  className = 'photo',
  draggable,
  loading = 'eager',
}: {
  listing: Listing;
  className?: string;
  draggable?: boolean;
  loading?: 'eager' | 'lazy';
}) {
  const candidates = listingPhotoCandidates(listing);

  const [idx, setIdx] = useState(0);
  // reset when the listing changes (component reused in the detail header)
  useEffect(() => {
    setIdx(0);
  }, [listing.id, listing.photoUrl, listing.website, listing.placeholderPhoto]);

  if (idx < candidates.length) {
    const src = candidates[idx];
    const isLogo = src.includes('clearbit') || src.includes('favicons');
    return (
      <img
        className={`${className}${isLogo ? ' logo' : ''}`}
        src={src}
        alt={listing.name}
        loading={loading}
        draggable={draggable}
        onError={() => setIdx((i) => i + 1)}
      />
    );
  }

  const letter = (listing.name.trim()[0] ?? '?').toUpperCase();
  return (
    <div className={`${className} ph mono`} style={{ background: colorFromName(listing.name) }}>
      {letter}
    </div>
  );
}
