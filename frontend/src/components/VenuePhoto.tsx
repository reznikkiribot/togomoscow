import { useEffect, useState } from 'react';
import type { Listing } from '../types';
import { thumb } from '../img';

export const TYPE_EMOJI: Record<Listing['type'], string> = {
  RESTAURANT: '🍽️',
  DISH: '🍝',
  DRINK: '🍷',
};

function colorFromName(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360} 42% 42%)`;
}

function isSlowExternalPhoto(src?: string | null) {
  return !!src && /images\.unsplash|images\.pexels|pixabay|picsum/i.test(src);
}

export function listingPhotoCandidates(listing: Listing): string[] {
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
  // NO brand logos/favicons — запрещены в приложении. Venues without a photo get
  // the licensed category stock (placeholderPhoto) or the letter tile below.
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
 * real/local photo → licensed category stock → monogram tile. Logos are BANNED.
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
    return (
      <img
        className={className}
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
