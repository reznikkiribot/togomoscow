import type { Listing } from '../types';
import { thumb } from '../img';
import { SmartImg } from './SmartImg';

export const TYPE_EMOJI: Record<Listing['type'], string> = {
  RESTAURANT: '🍽️',
  DISH: '🍝',
  DRINK: '🍷',
};

export function listingPhotoCandidates(listing: Listing): string[] {
  const candidates: string[] = [];
  // real photo FIRST, but through our resize-proxy (small webp, our origin,
  // immutable cache) — the raw external URL stays as the fallback candidate
  if (listing.photoUrl) {
    const proxied = thumb(listing.photoUrl, 600);
    if (proxied && proxied !== listing.photoUrl) candidates.push(proxied);
  }
  if (listing.photoUrl) candidates.push(listing.photoUrl);
  if (listing.placeholderPhoto) candidates.push(listing.placeholderPhoto);
  // NO brand logos/favicons — запрещены. Guaranteed appetizing fallback for ANY
  // listing (venues in «Где ещё попробовать» etc. that have no placeholderPhoto):
  // a deterministic licensed category stock, never a bare letter tile.
  candidates.push(
    `/api/venue-stock?type=${listing.type}&category=${encodeURIComponent(listing.category ?? '')}` +
      `&name=${encodeURIComponent(listing.name ?? '')}&seed=${encodeURIComponent(listing.id ?? listing.name ?? '')}`,
  );
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
  loading = 'lazy',
  allowVenuePhoto = false,
}: {
  listing: Listing;
  className?: string;
  draggable?: boolean;
  loading?: 'eager' | 'lazy';
  /** detail hero may show the real venue photo; cards never do */
  allowVenuePhoto?: boolean;
}) {
  // OWNER RULE 18.07.2026 (reverted the name-tile): a venue card shows a nice
  // random photo of ONE OF ITS OWN dishes/drinks — dishPhoto is picked server-side
  // (deterministic per venue). Falls back to any listing photo, then stock.
  const src = (listing as any).dishPhoto ?? listing.photoUrl;
  return (
    <SmartImg
      className={className}
      src={src}
      alt={listing.name}
      loading={allowVenuePhoto ? 'eager' : loading}
      draggable={draggable}
      stockFallbacks={[listing.placeholderPhoto]}
      stock={{ type: listing.type, category: listing.category, name: listing.name, seed: listing.id }}
      monogram={listing.name}
    />
  );
}
