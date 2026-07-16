import { lazy, Suspense, useEffect, useState } from 'react';
import { api } from '../api';
import { UserProfileModal } from '../components/People';
import type { AppNotification } from '../types';
const ListingDetailModal = lazy(() => import('../components/ListingDetail').then((m) => ({ default: m.ListingDetailModal })));

const KIND_ICON: Record<string, string> = { vote: '👍', comment: '💬', follow: '➕', friend_post: '📝' };

function ago(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'только что';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'вчера' : `${d} дн назад`;
}

// Notification center (the bell): every social event lands here; tapping an item
// opens its SOURCE — the review's card, or the actor's profile for follows.
export default function Alerts() {
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [openListingId, setOpenListingId] = useState<string | null>(null);
  const [openUser, setOpenUser] = useState<string | null>(null);

  useEffect(() => {
    api
      .notifications()
      .then(({ items }) => {
        setItems(items);
        setFreshIds(new Set(items.filter((n) => !n.readAt).map((n) => n.id)));
        // opening the center reads everything → the badge resets
        api.notificationsRead().catch(() => {});
        window.dispatchEvent(new CustomEvent('alerts-read'));
      })
      .catch(() => setItems([]));
  }, []);

  const open = (n: AppNotification) => {
    if (n.kind === 'follow' && n.actorId) setOpenUser(n.actorId);
    else if (n.listingId) setOpenListingId(n.listingId);
    else if (n.actorId) setOpenUser(n.actorId);
  };

  return (
    <div>
      <div className="topbar">
        <h2>🔔 Уведомления</h2>
      </div>
      {items === null ? (
        <div className="empty">Загрузка…</div>
      ) : items.length === 0 ? (
        <div className="empty">
          Пока тихо. Здесь появятся оценки и комментарии к вашим отзывам, новые подписчики и посты тех, на кого вы подписаны.
        </div>
      ) : (
        items.map((n) => (
          <div key={n.id} className={`alert-row${freshIds.has(n.id) ? ' fresh' : ''}`} onClick={() => open(n)}>
            <span className="alert-ico">{KIND_ICON[n.kind] ?? '🔔'}</span>
            <div className="alert-body">
              <div className="alert-text">{n.text}</div>
              <div className="alert-meta">
                {ago(n.createdAt)}
                {n.actorId && (
                  <>
                    {' · '}
                    <span
                      className="alert-user"
                      onClick={(e) => { e.stopPropagation(); setOpenUser(n.actorId!); }}
                    >
                      {n.actorName ?? 'профиль'}
                    </span>
                  </>
                )}
              </div>
            </div>
            {freshIds.has(n.id) && <span className="alert-dot" />}
          </div>
        ))
      )}
      {openListingId && (
        <Suspense fallback={null}>
          <ListingDetailModal id={openListingId} onClose={() => setOpenListingId(null)} />
        </Suspense>
      )}
      {openUser && <UserProfileModal id={openUser} onClose={() => setOpenUser(null)} />}
    </div>
  );
}
