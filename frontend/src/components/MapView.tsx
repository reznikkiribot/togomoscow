import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
// leaflet styles ship WITH the (lazy) map chunk, not the eager main bundle
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import type { GeoPoint } from '../types';

// Moscow center
const MOSCOW: [number, number] = [55.751, 37.618];

export function MapView({
  points,
  center = MOSCOW,
  zoom = 11,
  cluster = true,
  height = 300,
  onSelect,
  userLocation = null,
}: {
  points: GeoPoint[];
  center?: [number, number];
  zoom?: number;
  cluster?: boolean;
  height?: number | string;
  onSelect?: (id: string) => void;
  userLocation?: [number, number] | null;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // init map once
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, { attributionControl: false }).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (re)draw markers when points change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    const COLOR: Record<string, string> = {
      RESTAURANT: '#e23744',
      DISH: '#e67e22',
      DRINK: '#8e44ad',
    };
    const icon = (t: string) =>
      L.divIcon({
        className: 'pin',
        html: `<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg"><path d="M13 0C5.8 0 0 5.8 0 13c0 9.6 13 21 13 21s13-11.4 13-21C26 5.8 20.2 0 13 0z" fill="${COLOR[t] ?? '#e23744'}"/><circle cx="13" cy="13" r="5" fill="#fff"/></svg>`,
        iconSize: [26, 34],
        iconAnchor: [13, 34],
        popupAnchor: [0, -30],
      });

    const group: L.LayerGroup = cluster
      ? (L as any).markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 60 })
      : L.layerGroup();

    for (const p of points) {
      const m = L.marker([p.lat, p.lng], { icon: icon(p.type) });
      if (onSelect) m.on('click', () => onSelect(p.id));
      else m.bindPopup(p.name);
      group.addLayer(m);
    }

    // current-location blue dot
    if (userLocation) {
      const dot = L.divIcon({
        className: 'user-dot',
        html: '<span class="user-dot-inner"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      group.addLayer(L.marker(userLocation, { icon: dot, zIndexOffset: 1000 }));
    }

    map.addLayer(group);
    layerRef.current = group;
    // framing: centered on the user when we have their location, else frame markers
    if (userLocation) {
      map.setView(userLocation, 14);
    } else if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15);
    } else if (points.length > 1) {
      map.fitBounds(
        L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])),
        { padding: [30, 30], maxZoom: 15 },
      );
    }
    setTimeout(() => map.invalidateSize(), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, cluster, userLocation]);

  return <div ref={elRef} style={{ width: '100%', height, borderRadius: 12, overflow: 'hidden' }} />;
}
