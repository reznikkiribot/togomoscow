import { useEffect, useState } from 'react';
import { api } from './api';

// Per-category review progress, shared across the app via a tiny module cache so
// the gate ("рейтинг категории откроется после N отзывов") is consistent on the
// home scale, list cards and detail cards — with a single network fetch.
export type CategoryProgress = {
  threshold: number;
  total: number;
  categories: { name: string; count: number; unlocked: boolean }[];
};

let cache: CategoryProgress | null = null;
let inflight: Promise<CategoryProgress | null> | null = null;
const listeners = new Set<() => void>();
const unlockListeners = new Set<(category: string) => void>();

function notify() {
  for (const l of listeners) l();
}

/** Subscribe to "category just hit the threshold" events (for the celebration). */
export function onCategoryUnlock(fn: (category: string) => void) {
  unlockListeners.add(fn);
  return () => unlockListeners.delete(fn);
}

export function loadCategoryProgress(force = false): Promise<CategoryProgress | null> {
  if (cache && !force) return Promise.resolve(cache);
  if (inflight && !force) return inflight;
  inflight = api
    .categoryProgress()
    .then((d) => {
      // detect categories that became unlocked since the last snapshot. Skip the
      // very first load (no prior cache) so we don't celebrate on app open.
      const hadCache = cache !== null;
      const prevUnlocked = new Set(
        (cache?.categories ?? []).filter((c) => c.unlocked).map((c) => c.name),
      );
      cache = d;
      inflight = null;
      if (hadCache) {
        for (const c of d.categories) {
          if (c.unlocked && !prevUnlocked.has(c.name)) {
            for (const l of unlockListeners) l(c.name);
          }
        }
      }
      notify();
      return d;
    })
    .catch(() => {
      inflight = null;
      return cache;
    });
  return inflight;
}

export function useCategoryProgress() {
  const [, bump] = useState(0);
  useEffect(() => {
    const l = () => bump((n) => n + 1);
    listeners.add(l);
    if (!cache) loadCategoryProgress();
    return () => {
      listeners.delete(l);
    };
  }, []);

  const threshold = cache?.threshold ?? 5;
  const countFor = (cat?: string | null) =>
    cache?.categories.find((c) => c.name === cat)?.count ?? 0;
  const isUnlocked = (cat?: string | null) => !cat || countFor(cat) >= threshold;

  return {
    data: cache,
    threshold,
    countFor,
    isUnlocked,
    reload: () => loadCategoryProgress(true),
  };
}
