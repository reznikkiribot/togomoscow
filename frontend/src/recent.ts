// Recently viewed venues, kept in localStorage (no backend needed).
import type { Listing } from './types';

const KEY = 'recently_viewed';
const MAX = 12;

export function getRecent(): Listing[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function pushRecent(l: Listing) {
  try {
    const slim: Listing = {
      id: l.id,
      type: l.type,
      name: l.name,
      address: l.address ?? null,
      photoUrl: l.photoUrl ?? null,
      placeholderPhoto: l.placeholderPhoto ?? null,
      cuisine: l.cuisine ?? null,
      avgRating: l.avgRating ?? 0,
      reviewCount: l.reviewCount ?? 0,
    };
    const arr = getRecent().filter((x) => x.id !== slim.id);
    arr.unshift(slim);
    localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX)));
  } catch {
    /* ignore quota / disabled storage */
  }
}
