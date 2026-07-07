import { useEffect, useState } from 'react';
import type { Listing } from '../types';

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

/**
 * Best available image for a venue, with graceful fallback on load error:
 * real photo → brand logo (Clearbit) → site favicon → monogram tile.
 */
export function VenuePhoto({
  listing,
  className = 'photo',
  draggable,
}: {
  listing: Listing;
  className?: string;
  draggable?: boolean;
}) {
  const domain = domainOf(listing.website);
  const candidates: string[] = [];
  if (listing.photoUrl) candidates.push(listing.photoUrl);
  // illustrative stock photo (food/interior) outranks brand logos / monogram so
  // cards look appetizing instead of showing a letter tile.
  if (listing.placeholderPhoto) candidates.push(listing.placeholderPhoto);
  if (domain) {
    candidates.push(`https://logo.clearbit.com/${domain}`);
    candidates.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
  }

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
        loading="lazy"
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
