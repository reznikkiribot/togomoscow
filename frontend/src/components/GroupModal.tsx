import { useEffect, useState } from 'react';
import { api } from '../api';
import { reverseGeocode } from '../geocode';
import type { GeoPoint, Group, ListingType } from '../types';
import { MapView } from './MapView';
import { ListingDetailModal } from './ListingDetail';
import { Stars } from './Stars';

// A chain (network) hub: one entry → map with all branches + branch list.
export function GroupModal({
  groupKey,
  type,
  onClose,
}: {
  groupKey: string;
  type?: ListingType;
  onClose: () => void;
}) {
  const [g, setG] = useState<Group | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [addrs, setAddrs] = useState<Record<string, string>>({});

  useEffect(() => {
    api.group(groupKey, type).then(setG).catch(() => {});
  }, [groupKey, type]);

  // resolve real addresses for branches that only have coordinates
  useEffect(() => {
    if (!g) return;
    let cancelled = false;
    (async () => {
      for (const b of g.branches) {
        if (b.address || b.lat == null || b.lng == null) continue;
        const a = await reverseGeocode(b.lat, b.lng);
        if (cancelled) return;
        if (a) setAddrs((prev) => ({ ...prev, [b.id]: a }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [g]);

  if (!g) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          Загрузка…
        </div>
      </div>
    );
  }

  const points: GeoPoint[] = g.branches
    .filter((b) => b.lat != null && b.lng != null)
    .map((b) => ({ id: b.id, name: b.name, lat: b.lat as number, lng: b.lng as number, type: b.type }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{g.name}</h3>
        <div className="meta" style={{ color: 'var(--accent)', fontWeight: 600 }}>
          Сеть · {g.branchCount} точек
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
          <span className="meta" style={{ color: 'var(--hint)' }}>Рейтинг сети:</span>
          <Stars value={g.avgRating} />
          <b>{g.avgRating.toFixed(1)}</b>
          <span className="meta" style={{ color: 'var(--hint)' }}>({g.reviewCount})</span>
        </div>
        <div className="meta" style={{ color: 'var(--hint)', fontSize: 13, marginTop: 4 }}>
          Это средняя оценка всех точек. Чтобы оценить конкретную — откройте её ниже.
        </div>

        {points.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <MapView points={points} height={240} onSelect={setSel} />
          </div>
        )}

        <div className="section-title">Точки на карте</div>
        <div className="list">
          {g.branches.map((b) => (
            <div key={b.id} className="yelp-row" onClick={() => setSel(b.id)}>
              <div className="info">
                <div className="name">{b.name}</div>
                <div className="sub">
                  {b.address ?? addrs[b.id] ?? 'Адрес уточняется…'}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn secondary" style={{ marginTop: 14 }} onClick={onClose}>
          Закрыть
        </button>
      </div>

      {sel && <ListingDetailModal id={sel} onClose={() => setSel(null)} />}
    </div>
  );
}
