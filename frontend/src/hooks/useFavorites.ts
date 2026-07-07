import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

export function useFavorites() {
  const [ids, setIds] = useState<Set<string>>(new Set());

  const reload = useCallback(() => {
    api
      .favorites()
      .then((favs) => setIds(new Set(favs.map((f) => f.listingId))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const has = prev.has(id);
      const next = new Set(prev);
      if (has) {
        next.delete(id);
        api.removeFavorite(id).catch(() => {});
      } else {
        next.add(id);
        api.addFavorite(id).catch(() => {});
        api.logEvent(id, 'SAVE'); // implicit-feedback signal for the recommender
      }
      return next;
    });
  }, []);

  return { ids, toggle, reload };
}
