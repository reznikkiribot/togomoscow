import { useCallback, useEffect, useRef, useState } from 'react';
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

  // The request MUST be fired outside the state updater. React may invoke an
  // updater more than once for the same call (StrictMode, re-render, replay);
  // when it did, the second pass saw the id already added and sent
  // removeFavorite, silently undoing the save the user had just made — several
  // swipes right in a row would leave only one item in favourites.
  const idsRef = useRef(ids);
  idsRef.current = ids;
  const pending = useRef(new Set<string>());

  const toggle = useCallback((id: string) => {
    if (pending.current.has(id)) return; // ignore a double-fire for the same card
    pending.current.add(id);

    const adding = !idsRef.current.has(id);
    setIds((prev) => {
      const next = new Set(prev);
      if (adding) next.add(id); else next.delete(id);
      return next;
    });

    void (adding
      ? Promise.all([api.addFavorite(id), api.logEvent(id, 'SAVE')])
      : api.removeFavorite(id)
    ).catch(() => {
      // roll the toggle back if the server refused, so the UI never claims a
      // save that did not happen
      setIds((cur) => {
        const rollback = new Set(cur);
        if (adding) rollback.delete(id); else rollback.add(id);
        return rollback;
      });
    }).finally(() => pending.current.delete(id));
  }, []);

  return { ids, toggle, reload };
}
