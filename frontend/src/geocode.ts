// Reverse-geocode coordinates → a short street address via OpenStreetMap
// Nominatim. Cached in-memory and globally throttled to ~1 req/sec (Nominatim
// usage policy). For production, switch to a self-hosted geocoder.
const cache = new Map<string, string | null>();
let queue: Promise<unknown> = Promise.resolve();

const keyOf = (lat: number, lng: number) => `${lat.toFixed(5)},${lng.toFixed(5)}`;

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const k = keyOf(lat, lng);
  if (cache.has(k)) return cache.get(k) ?? null;

  // serialize requests with a polite delay
  const run = queue.then(async () => {
    if (cache.has(k)) return cache.get(k) ?? null;
    await new Promise((r) => setTimeout(r, 1100));
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ru`,
      );
      const j = await res.json();
      const a = j.address ?? {};
      const road = a.road ?? a.pedestrian ?? a.footway ?? a.suburb ?? '';
      const num = a.house_number ?? '';
      const addr =
        [road, num].filter(Boolean).join(', ') ||
        (j.display_name ? j.display_name.split(',').slice(0, 2).join(',').trim() : null);
      cache.set(k, addr);
      return addr;
    } catch {
      cache.set(k, null);
      return null;
    }
  });
  queue = run.catch(() => {});
  return run;
}
