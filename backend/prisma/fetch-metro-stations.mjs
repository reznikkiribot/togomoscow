import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const OVERPASS_URL = process.env.OVERPASS_URL || 'https://maps.mail.ru/osm/tools/overpass/api/interpreter';
const QUERY = `[out:json][timeout:180];
area["name"="Москва"]["boundary"="administrative"]["admin_level"="4"]->.moscow;
nwr["railway"="station"]["station"="subway"](area.moscow);
out center tags;`;

const target = path.join(path.dirname(fileURLToPath(import.meta.url)), 'metro-stations.json');
const body = new URLSearchParams({ data: QUERY });
const response = await fetch(OVERPASS_URL, {
  method: 'POST',
  headers: {
    'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
    'user-agent': 'togomoscow-metro-enrichment/1.0 (https://app.togomoscow.ru)',
  },
  body,
  signal: AbortSignal.timeout(200_000),
});
if (!response.ok) throw new Error(`Overpass HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);

const payload = await response.json();
const grouped = new Map();
for (const element of payload.elements ?? []) {
  const name = String(element.tags?.['name:ru'] || element.tags?.name || '').trim();
  const lat = Number(element.lat ?? element.center?.lat);
  const lng = Number(element.lon ?? element.center?.lon);
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
  const current = grouped.get(name) ?? { name, lat: 0, lng: 0, count: 0 };
  current.lat += lat;
  current.lng += lng;
  current.count += 1;
  grouped.set(name, current);
}

const stations = [...grouped.values()]
  .map(({ name, lat, lng, count }) => ({
    name,
    lat: Number((lat / count).toFixed(6)),
    lng: Number((lng / count).toFixed(6)),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

if (stations.length < 200) throw new Error(`Overpass returned only ${stations.length} unique subway stations`);
await writeFile(target, `${JSON.stringify(stations, null, 2)}\n`, 'utf8');
console.log(`Saved ${stations.length} unique OSM subway stations to ${target}`);
