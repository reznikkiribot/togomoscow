import { useEffect, useState, useRef} from 'react';
import { api } from '../api';
import { useEscClose } from '../modalEsc';
import { useSwipeDismiss } from '../swipeDismiss';
import { useSwipeBack } from '../swipeBack';
import { ListingDetailModal } from './ListingDetail';
import { PhotoPostModal } from './PhotoPostModal';
import { ReviewCard, CategoryAverages } from './ReviewCard';
import { SmartImg } from './SmartImg';
import type { PublicProfile, PublicUser, Review } from '../types';

function Avatar({ user }: { user: { photoUrl?: string | null; firstName?: string | null } }) {
  return <SmartImg className="pu-avatar" src={user.photoUrl} width={200} loading="eager" monogram={user.firstName} />;
}

function FollowBtn({ u, onChange }: { u: PublicUser; onChange: (following: boolean) => void }) {
  const [following, setFollowing] = useState(u.isFollowing);
  const [busy, setBusy] = useState(false);
  if (u.isMe) return null;
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBusy(true);
    const next = !following;
    setFollowing(next);
    (next ? api.followUser(u.id) : api.unfollowUser(u.id))
      .then(() => onChange(next))
      .catch(() => setFollowing(!next))
      .finally(() => setBusy(false));
  };
  return (
    <button className={'follow-btn' + (following ? ' on' : '')} onClick={toggle} disabled={busy}>
      {following ? 'Вы подписаны' : 'Подписаться'}
    </button>
  );
}

function UserRow({ u, onOpen }: { u: PublicUser; onOpen: (id: string) => void }) {
  const name = u.firstName ?? u.username ?? 'Гость';
  return (
    <div className="pu-row">
      <button type="button" className="pu-row-main" onClick={() => onOpen(u.id)} aria-label={`Открыть путь дегустатора: ${name}`}>
        <Avatar user={u} />
        <div className="pu-row-copy">
          <div className="pu-name">{name}</div>
          <div className="pu-meta">
            {u.reviews} дегустаций · {u.followers} подписчиков
          </div>
        </div>
      </button>
      <FollowBtn u={u} onChange={() => {}} />
    </div>
  );
}

export function PeopleModal({
  userId,
  initialTab,
  onClose,
  onOpenUser,
}: {
  userId: string;
  initialTab: 'followers' | 'following';
  onClose: () => void;
  onOpenUser: (id: string) => void;
}) {
  const [tab, setTab] = useState<'followers' | 'following'>(initialTab);
  const [followers, setFollowers] = useState<PublicUser[]>([]);
  const [following, setFollowing] = useState<PublicUser[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicUser[] | null>(null);

  useEffect(() => {
    api.userFollowers(userId).then(setFollowers).catch(() => {});
    api.userFollowing(userId).then(setFollowing).catch(() => {});
  }, [userId]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      return;
    }
    const t = setTimeout(() => {
      api.searchUsers(q).then(setResults).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const list = results ?? (tab === 'followers' ? followers : following);

  return (
    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="pu-search">
          <span className="search-ico">🔍</span>
          <input
            placeholder="Найти людей…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {!results && (
          <div className="tabbar" style={{ position: 'static' }}>
            <button
              className={'tab' + (tab === 'followers' ? ' active' : '')}
              onClick={() => setTab('followers')}
            >
              Подписчики ({followers.length})
            </button>
            <button
              className={'tab' + (tab === 'following' ? ' active' : '')}
              onClick={() => setTab('following')}
            >
              Подписки ({following.length})
            </button>
          </div>
        )}

        <div className="pu-list">
          {list.length === 0 ? (
            <div className="meta" style={{ color: 'var(--hint)', padding: '12px 2px' }}>
              {results
                ? 'Такого дегустатора не нашли. Проверьте имя или попробуйте другой запрос.'
                : tab === 'followers'
                  ? 'Подписчиков пока нет. Загляните сюда позже.'
                  : 'Подписок пока нет. Найдите знакомого по имени выше.'}
            </div>
          ) : (
            list.map((u) => <UserRow key={u.id} u={u} onOpen={onOpenUser} />)
          )}
        </div>

        <button className="btn secondary" style={{ marginTop: 12 }} onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
}

export function UserProfileModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [p, setP] = useState<PublicProfile | null>(null);
  const [openListing, setOpenListing] = useState<string | null>(null);
  const [photoReview, setPhotoReview] = useState<Review | null>(null); // Instagram-style photo view
  const [people, setPeople] = useState<'followers' | 'following' | null>(null);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    api.userProfile(id).then(setP).catch(() => {});
  }, [id]);
  const requestClose = () => {
    setClosing(true);
    setTimeout(onClose, 240);
  };
  useEscClose(requestClose);
  // swipe-down from the top closes the profile page too (app-wide pattern)
  const pageRef = useRef<HTMLDivElement>(null);
  useSwipeDismiss(pageRef, onClose, { fadeBackdrop: false });
  useSwipeBack(pageRef, onClose); // edge swipe → back, like iOS navigation

  return (
    <div ref={pageRef} className={'userprofile' + (closing ? ' closing' : '')}>
      <div className="up-top">
        <button className="back-btn" onClick={requestClose}>
          ←
        </button>
      </div>
      {!p ? (
        <div style={{ padding: 16 }}>Загрузка…</div>
      ) : (
        <>
          <div className="me-head">
            <Avatar user={p} />
            <div className="me-name">{p.firstName ?? p.username ?? 'Гость'}</div>
            {(p as any).level && (
              <div className="up-level">{(p as any).level.icon} {(p as any).level.title}</div>
            )}
            <div className="me-stats">
              <button className="stat-btn" onClick={() => setPeople('followers')}>
                <b>{p.followers}</b> подписчиков
              </button>
              <button className="stat-btn" onClick={() => setPeople('following')}>
                <b>{p.following}</b> подписок
              </button>
              <span>⭐ {p.reviews}</span>
            </div>
            {!p.isMe && (
              <div style={{ marginTop: 10 }}>
                <FollowBtn u={p} onChange={() => {}} />
              </div>
            )}
          </div>

          {/* Карта дегустатора — visible on ANY user's profile */}
          {/* ONLY earned specializations (3+ tastings in the category). A single
              tasting must never read as «Эксперт по кофе» — that's a false claim
              (owner 22.07.2026). */}
          {Array.isArray((p as any).specializations) &&
            (p as any).specializations.some((s: any) => s.earned) && (
            <div className="me-section">
              <h2 className="me-h">🗺 Карта дегустатора</h2>
              <div className="spec-grid">
                {(p as any).specializations
                  .filter((s: any) => s.earned)
                  .slice()
                  .sort((a: any, b: any) => b.count - a.count)
                  .map((s: any) => (
                    <div key={s.id} className={'spec-card' + (s.tier ? ' on' : '')}>
                      <span className="spec-ico">{s.icon}</span>
                      <div className="spec-body">
                        <div className="spec-label">{s.tier ? `${s.tier} · ${s.label}` : s.label}</div>
                        <div className="spec-meta">{s.count} дегустаций</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {(() => {
            // fill the author from the profile owner (reviewList items carry no `user`)
            const withUser = (r: Review): Review =>
              ({ ...r, user: r.user ?? { id: p.id, firstName: p.firstName, username: p.username, photoUrl: p.photoUrl } } as Review);
            const open = (r: Review) => setPhotoReview(withUser(r));
            const withPhoto = p.reviewList.filter((r) => r.photoUrls?.[0] || r.listing?.photoUrl);
            // taste snapshot (computed from the reviews we have)
            const total = p.reviewList.length;
            const avg = total ? p.reviewList.reduce((s, r) => s + r.rating, 0) / total : 0;
            const catCount = new Set(
              p.reviewList
                .map((r) => r.listing?.category)
                .filter((c): c is string => !!c && !/^(блюдо|напиток)$/i.test(c)),
            ).size;
            const best = [...p.reviewList].sort((a, b) => b.rating - a.rating)[0];
            if (p.reviewList.length === 0) {
              return (
                <div className="me-section">
                  <h2 className="me-h">Дегустации</h2>
                  <div className="meta" style={{ color: 'var(--hint)' }}>Этот человек пока ничего не оценил.</div>
                </div>
              );
            }
            return (
              <>
                {/* 1) carousel of rating photos (tap → Untappd card) */}
                {withPhoto.length > 0 && (
                  <div className="me-section">
                    <h2 className="me-h">Оценки</h2>
                    <div className="rc-carousel">
                      {withPhoto.map((r) => (
                        <button key={r.id} onClick={() => open(r)}>
                          <SmartImg
                            className="rc-carousel-photo"
                            src={r.photoUrls?.[0] || r.listing?.photoUrl}
                            width={400}
                            stock={r.listing ? {
                              type: r.listing.type,
                              category: r.listing.category,
                              name: r.listing.name,
                              seed: r.listing.id,
                            } : undefined}
                            monogram={r.listing?.name}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* 2) taste snapshot */}
                <div className="me-section">
                  <h2 className="me-h">О вкусе</h2>
                  <div className="taste-card">
                    <div className="taste-line">
                      <span className="taste-key">Средняя оценка</span>
                      <span className="taste-val">{avg.toFixed(1)}★</span>
                    </div>
                    <div className="taste-line">
                      <span className="taste-key">Оценок</span>
                      <span className="taste-val">{total}</span>
                    </div>
                    <div className="taste-line">
                      <span className="taste-key">Распробовал категорий</span>
                      <span className="taste-val">{catCount}</span>
                    </div>
                    {best?.listing && (
                      <div className="taste-line">
                        <span className="taste-key">🥇 Лучшая находка</span>
                        <span className="taste-val">{best.listing.name} · {best.rating.toFixed(1)}★</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* 3) average rating per category */}
                <div className="me-section">
                  <h2 className="me-h">Оценки по категориям</h2>
                  <CategoryAverages reviews={p.reviewList} />
                </div>
                {/* 3) full Untappd-style cards */}
                <div className="me-section">
                  <h2 className="me-h">Дегустации</h2>
                  {p.reviewList.map((r) => (
                    <ReviewCard
                      key={r.id}
                      review={withUser(r)}
                      onOpen={() => open(r)}
                      onOpenVenue={() => r.venue?.id && setOpenListing(r.venue.id)}
                    />
                  ))}
                </div>
              </>
            );
          })()}
        </>
      )}
      {openListing && (
        <ListingDetailModal id={openListing} onClose={() => setOpenListing(null)} />
      )}
      {people && p && (
        <PeopleModal
          userId={p.id}
          initialTab={people}
          onClose={() => setPeople(null)}
          onOpenUser={() => setPeople(null)}
        />
      )}
      {photoReview && (
        <PhotoPostModal
          review={photoReview}
          onClose={() => setPhotoReview(null)}
          onOpenUser={() => setPhotoReview(null)}
          onOpenListing={() => {
            const lid = photoReview.listing?.id;
            setPhotoReview(null);
            if (lid) setOpenListing(lid);
          }}
          onOpenVenue={() => {
            const vid = photoReview.venue?.id;
            setPhotoReview(null);
            if (vid) setOpenListing(vid);
          }}
        />
      )}
    </div>
  );
}
