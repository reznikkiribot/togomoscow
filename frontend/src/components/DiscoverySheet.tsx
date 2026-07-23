import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Listing } from '../types';
import { ListingCard } from './ListingCard';
import { VenuePhoto } from './VenuePhoto';

// Opened from the «Никем не открытые блюда» goal.
//  • if the user has already been the first taster of something → their
//    discoveries as a tappable list (name + photo);
//  • if not yet → a 2-up grid of first-taster cards (same as «Оцените первым»),
//    tappable, so they can go make their first discovery.
export function DiscoverySheet({
  onClose,
  onOpenListing,
  onRate,
}: {
  onClose: () => void;
  onOpenListing: (id: string) => void;
  onRate?: (l: Listing, rating: number) => void;
}) {
  const [mine, setMine] = useState<Listing[] | null>(null);
  const [fresh, setFresh] = useState<Listing[]>([]);

  useEffect(() => {
    let stop = false;
    api.myDiscoveries()
      .then((d) => {
        if (stop) return;
        setMine(d);
        // no discoveries yet → load a first-taster deck to get them started
        if (!d.length) api.firstTasterItems(8).then((f) => { if (!stop) setFresh(f); }).catch(() => {});
      })
      .catch(() => { if (!stop) setMine([]); });
    return () => { stop = true; };
  }, []);

  const hasMine = (mine?.length ?? 0) > 0;

  return (
    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3>{hasMine ? '🥇 Ваши первооткрытия' : '🥇 Станьте первым дегустатором'}</h3>
          <button className="sheet-close" onClick={onClose}>×</button>
        </div>
        <div className="sheet-body">
          {mine == null ? (
            <div className="empty" style={{ padding: 20, textAlign: 'center', color: 'var(--hint)' }}>Загрузка…</div>
          ) : hasMine ? (
            // already-discovered → compact tappable list
            <>
              {mine.map((l) => (
                <button key={l.id} className="recent-row" onClick={() => { onClose(); onOpenListing(l.id); }}>
                  <VenuePhoto listing={l} className="recent-img" />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div className="name">{l.name}</div>
                    {l.category && <div className="meta">{l.category}</div>}
                  </div>
                </button>
              ))}
            </>
          ) : (
            // nothing yet → 2-up first-taster grid, tappable to go rate
            <>
              <p className="goal-sub" style={{ marginTop: 0 }}>
                Эти блюда ещё никто не оценил. Оцените первым — и ваше имя будет на карточке.
              </p>
              <div className="feed" style={{ marginTop: 8 }}>
                {fresh.map((l) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    onClick={() => { onClose(); onOpenListing(l.id); }}
                    onRate={onRate ? (n) => { onClose(); onRate(l, n); } : undefined}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
