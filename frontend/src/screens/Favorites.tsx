import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { ListingCard } from '../components/ListingCard';
import { ListingDetailModal } from '../components/ListingDetail';
import type { Favorite, Listing, ListingType } from '../types';

const TITLE: Record<string, string> = {
  RESTAURANT: 'Подписки на заведения',
  DISH: 'Подписки на блюда',
  DRINK: 'Подписки на напитки',
};

export default function Favorites() {
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [active, setActive] = useState<Listing | null>(null);
  const nav = useNavigate();
  const [params] = useSearchParams();
  const type = params.get('type') as ListingType | null;
  const showBack = !!type || params.get('from') === 'profile';

  const load = () => api.favorites().then(setFavs).catch(() => {});
  useEffect(() => {
    load();
    // cold launch / tunnel warm-up can miss the first fetch → retry, and refetch
    // whenever the app regains focus (returning to this tab)
    const t = setTimeout(load, 1200);
    const onFocus = () => load();
    const onVis = () => { if (!document.hidden) load(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearTimeout(t);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  async function remove(id: string) {
    await api.removeFavorite(id);
    load();
  }

  const shown = type ? favs.filter((f) => f.listing.type === type) : favs;

  return (
    <div>
      <div className={'topbar' + (showBack ? ' with-back' : '')}>
        {showBack && (
          <button className="back-btn" onClick={() => nav(-1)}>
            ←
          </button>
        )}
        <h2>{type ? TITLE[type] : 'Хочу попробовать'}</h2>
      </div>
      {shown.length === 0 ? (
        <div className="empty">Пока пусто. Нажимайте «Хочу попробовать» на карточках — они соберутся здесь.</div>
      ) : (
        <div className="grid">
          {shown.map((f) => (
            <ListingCard
              key={f.listingId}
              listing={f.listing}
              favorite
              onToggleFavorite={() => remove(f.listingId)}
              onClick={() => setActive(f.listing)}
            />
          ))}
        </div>
      )}
      {active && (
        <ListingDetailModal id={active.id} onClose={() => setActive(null)} />
      )}
    </div>
  );
}
