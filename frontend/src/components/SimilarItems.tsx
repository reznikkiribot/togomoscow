import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Listing } from '../types';
import { Stars } from './Stars';
import { VenuePhoto } from './VenuePhoto';

// "🤖 Похожие — вам зайдёт": semantic neighbours (embedding vector search over the
// catalog). GATED server-side — only shown to users with enough rated cards to have a
// taste profile. If locked or empty, renders NOTHING (no empty state, per spec).
// `onOpen` navigates the parent detail modal (avoids a circular import).
export function SimilarItems({ id, onOpen }: { id: string; onOpen: (id: string) => void }) {
  const [items, setItems] = useState<Listing[] | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .visionSimilar(id)
      .then((r) => alive && setItems(r.locked ? [] : r.items))
      .catch(() => alive && setItems([]));
    return () => { alive = false; };
  }, [id]);

  if (!items || items.length === 0) return null;

  return (
    <div className="feed-section">
      <div className="section-title big">🤖 Похожие — вам зайдёт</div>
      <div className="feed">
        {items.map((l) => (
          <button key={l.id} className="myrate-card" onClick={() => onOpen(l.id)}>
            <VenuePhoto listing={l} className="myrate-photo" />
            <div className="myrate-name">{l.name}</div>
            <div className="myrate-row">
              <Stars value={l.avgRating} size={13} />
              <span className="myrate-val">{l.reviewCount > 0 ? l.avgRating.toFixed(1) : '—'}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
