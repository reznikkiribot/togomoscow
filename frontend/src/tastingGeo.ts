export type CachedTastingLocation = {
  lat: number;
  lng: number;
  accuracy: number;
  capturedAt: string;
};

const KEY = 'togomoscow:tasting-location';
const MAX_CACHE_AGE_MS = 30 * 60_000;

export function cachedTastingLocation(): CachedTastingLocation | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) || 'null') as CachedTastingLocation | null;
    const captured = value?.capturedAt ? new Date(value.capturedAt).getTime() : 0;
    if (!value || !Number.isFinite(value.lat) || !Number.isFinite(value.lng)) return null;
    if (!captured || Date.now() - captured > MAX_CACHE_AGE_MS) return null;
    return value;
  } catch {
    return null;
  }
}

export function cacheTastingLocation(location: CachedTastingLocation) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(location));
    window.dispatchEvent(new CustomEvent('tasting-location', { detail: location }));
  } catch { /* storage can be disabled in private WebViews */ }
}

export function tastingLocationHeaders(): Record<string, string> {
  const location = cachedTastingLocation();
  return location
    ? { 'X-Tasting-Lat': String(location.lat), 'X-Tasting-Lng': String(location.lng) }
    : {};
}
