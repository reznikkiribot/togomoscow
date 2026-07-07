import { useEffect, useState } from 'react';
import { api } from '../api';
import { MapView } from '../components/MapView';
import { ListingDetailModal } from '../components/ListingDetail';
import type { GeoPoint } from '../types';

export default function MapScreen() {
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    api.geo().then(setPoints).catch(() => {});
  }, []);

  return (
    <div>
      <div className="topbar">
        <h2>Карта</h2>
        <span className="meta" style={{ color: 'var(--hint)' }}>{points.length} мест</span>
      </div>
      <MapView points={points} height="calc(100vh - 150px)" onSelect={setSel} />
      {sel && <ListingDetailModal id={sel} onClose={() => setSel(null)} />}
    </div>
  );
}
