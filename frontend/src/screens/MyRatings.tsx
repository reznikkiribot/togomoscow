import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { AddBusiness } from '../components/AddBusiness';
import { SupportModal } from '../components/SupportModal';
import { ListingDetailModal } from '../components/ListingDetail';
import { PeopleModal, UserProfileModal } from '../components/People';
import { ReviewForm } from '../components/ReviewForm';
import { ReviewCard, CategoryAverages } from '../components/ReviewCard';
import { GameProgress, GameCelebration, useGameState } from '../components/GameProgress';
import { PhotoPostModal } from '../components/PhotoPostModal';
import { Stars } from '../components/Stars';
import { VenuePhoto } from '../components/VenuePhoto';
import { SmartImg } from '../components/SmartImg';
import { getRecent } from '../recent';
import { openExternal } from '../telegram';
import { readThemePreference, setThemePreference, type ThemePreference } from '../theme';
import type { Listing, Profile, Review, Specialization, TasteProfile, UserStats } from '../types';

// cache the profile + reviews so a cold launch shows them INSTANTLY (no "Гость"/empty
// flash) while fresh data loads in the background.
const ME_CACHE = 'me_cache_v1';
const readCache = (): { profile?: Profile; reviews?: Review[]; taste?: TasteProfile } => {
  try { return JSON.parse(localStorage.getItem(ME_CACHE) || '{}'); } catch { return {}; }
};
const writeCache = (patch: Record<string, unknown>) => {
  try { localStorage.setItem(ME_CACHE, JSON.stringify({ ...readCache(), ...patch })); } catch { /* quota */ }
};

export default function MyRatings() {
  const nav = useNavigate();
  const cached = readCache();
  // only trust a cached profile that has the expected shape (guards against a
  // malformed/old cache crashing the first render before any fetch — which on a
  // phone meant the screen never even tried to load)
  const [profile, setProfile] = useState<Profile | null>(cached.profile?.user ? cached.profile : null);
  const [reviews, setReviews] = useState<Review[]>(cached.reviews ?? []);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [specs, setSpecs] = useState<Specialization[]>([]);
  const [owned, setOwned] = useState<Listing[]>([]);
  const [edit, setEdit] = useState<Review | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [taste, setTaste] = useState<TasteProfile | null>(cached.taste ?? null);
  const [impactTab, setImpactTab] = useState<'taste' | 'photos'>('taste');
  const [people, setPeople] = useState<'followers' | 'following' | null>(null);
  const [openUser, setOpenUser] = useState<string | null>(null);
  const [openListing, setOpenListing] = useState<string | null>(null);
  const [recent, setRecent] = useState<Listing[]>([]);
  const [noStory, setNoStory] = useState(localStorage.getItem('noStoryOnReview') === '1');
  const [theme, setTheme] = useState<ThemePreference>(() => readThemePreference());
  const [photoReview, setPhotoReview] = useState<Review | null>(null);
  const game = useGameState();

  const load = () => {
    api.profile().then((p) => { setProfile(p); writeCache({ profile: p }); }).catch(() => {});
    api.myReviews().then((r) => { setReviews(r); writeCache({ reviews: r }); }).catch(() => {});
    api.tasteProfile().then((t) => { setTaste(t); writeCache({ taste: t }); }).catch(() => {});
    api.specializations().then(setSpecs).catch(() => {});
    api.ownerVenues().then(setOwned).catch(() => {});
    setRecent(getRecent());
  };
  // keep a live ref so the retry loop knows when the data has actually arrived:
  // profile is in, AND reviews match the count the profile reports (or it's genuinely 0)
  const loadedRef = useRef(false);
  loadedRef.current =
    !!profile?.user && (reviews.length > 0 || (profile.counts?.reviews ?? 0) === 0);
  useEffect(() => {
    let stop = false;
    let tries = 0;
    // Mobile through the tunnel is slow/flaky — keep retrying (with backoff) until the
    // profile actually loads, instead of giving up after one attempt.
    const attempt = () => {
      if (stop) return;
      load();
      tries += 1;
      if (tries < 8 && !loadedRef.current) setTimeout(attempt, Math.min(800 + tries * 600, 3500));
    };
    attempt();
    const onFocus = () => load();
    const onVis = () => { if (!document.hidden) load(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stop = true;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const photos = useMemo(() => reviews.flatMap((r) => r.photoUrls ?? []), [reviews]);

  // my own reviews carry no `user` — fill it from the profile so the author shows on cards
  const withMe = (r: Review): Review =>
    ({
      ...r,
      user:
        r.user ??
        (profile?.user
          ? {
              id: profile.user.id,
              firstName: profile.user.firstName,
              username: profile.user.username,
              photoUrl: profile.user.photoUrl,
            }
          : undefined),
    } as Review);

  const name = profile?.user?.firstName ?? profile?.user?.username ?? 'Гость';

  const share = () => {
    const link = 'https://t.me/togomoscow_bot';
    const n = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (n.share) n.share({ title: name, url: link }).catch(() => {});
    else openExternal(`https://t.me/share/url?url=${encodeURIComponent(link)}`);
  };

  return (
    <div className="me">
      <div className="me-topbar">
        <button className="me-icon" onClick={share} aria-label="Поделиться">
          ↗
        </button>
      </div>

      <div className="me-head">
        {profile?.user?.photoUrl ? (
          <img className="me-avatar" src={profile.user.photoUrl} alt="" />
        ) : (
          <div className="me-avatar ph">📷</div>
        )}
        <div className="me-name">{name}</div>
        <div className="me-stats">
          <button className="stat-btn" onClick={() => setPeople('followers')}>
            <b>{profile?.counts.followers ?? 0}</b> подписчиков
          </button>
          <button className="stat-btn" onClick={() => setPeople('following')}>
            <b>{profile?.counts.following ?? 0}</b> подписок
          </button>
          <span>⭐ {profile?.counts.reviews ?? 0}</span>
          <span>🖼 {photos.length}</span>
        </div>
      </div>

      <div className="me-actions">
        <button className="me-action" onClick={() => nav('/')}>
          <span className="ma-ico">⭐</span>
          Оценить
        </button>
        <button className="me-action" onClick={() => nav('/')}>
          <span className="ma-ico">📷</span>
          Добавить фото
        </button>
        <button className="me-action" onClick={() => setShowAdd(true)}>
          <span className="ma-ico">🏪</span>
          Добавить бизнес
        </button>
      </div>

      {game && <GameCelebration game={game} />}
      {game && <GameProgress game={game} />}

      {/* Карта дегустатора: specializations with live tiers (Знаток → Эксперт → Мастер) */}
      {specs.some((s) => s.count > 0) && (
        <div className="me-section">
          <h2 className="me-h">🗺 Карта дегустатора</h2>
          <div className="spec-grid">
            {specs
              .filter((s) => s.count > 0)
              .sort((a, b) => b.count - a.count)
              .map((s) => (
                <div key={s.id} className={'spec-card' + (s.tier ? ' on' : '')}>
                  <span className="spec-ico">{s.icon}</span>
                  <div className="spec-body">
                    <div className="spec-label">{s.tier ? `${s.tier} · ${s.label}` : s.label}</div>
                    <div className="spec-meta">
                      {s.count} дегустаций
                      {s.next != null && ` · ещё ${s.next - s.count} до ${s.tier ? 'следующего звания' : 'звания «Знаток»'}`}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Репутация: как сообщество ценит ваши отзывы */}
      {game && ((game.counters.useful ?? 0) > 0 || (game.counters.discoveries ?? 0) > 0 || game.achievements.some((a) => a.earned)) && (
        <div className="me-section">
          <h2 className="me-h">🏆 Репутация</h2>
          <div className="rep-grid">
            <div className="rep-item">
              <b>{game.counters.useful ?? 0}</b>
              <span>раз ваши отзывы отметили «полезно»</span>
            </div>
            <div className="rep-item">
              <b>{game.counters.discoveries ?? 0}</b>
              <span>первооткрытий — вы попробовали это первым</span>
            </div>
            <div className="rep-item">
              <b>{game.achievements.filter((a) => a.earned).length}/{game.achievements.length}</b>
              <span>достижений собрано</span>
            </div>
            <div className="rep-item">
              <b>{game.counters.streak ?? 0}</b>
              <span>дней подряд с дегустациями</span>
            </div>
          </div>
        </div>
      )}

      {taste && taste.topCategories && taste.topCategories.length > 0 && (
        <div className="me-section">
          <h2 className="me-h">🎯 Обучение рекомендаций</h2>
          <p className="me-hint" style={{ marginTop: -4 }}>
            Чем больше вы оцениваете, тем точнее система понимает ваш вкус. Каждый
            отзыв — <b>+10%</b> к точности в категории.
          </p>
          <div className="accuracy-block">
            {taste.topCategories.map((c) => {
              const acc = Math.min(95, c.count * 10);
              return (
                <div key={c.name} className="acc-row">
                  <span className="acc-name">{c.name}</span>
                  <div className="acc-track">
                    <div className="acc-fill" style={{ width: `${acc}%` }} />
                  </div>
                  <span className="acc-val">{acc}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {game && !game.unlocks.find((u) => u.key === 'tasteProfile')?.unlocked ? (
        <div className="me-section">
          <h2 className="me-h">🔒 Вкусовой профиль</h2>
          {(() => {
            const u = game.unlocks.find((x) => x.key === 'tasteProfile')!;
            return (
              <div className="game-unlock">
                <span className="game-unlock-ico">🔒</span>
                <div style={{ flex: 1 }}>
                  <div className="acc-track" style={{ marginTop: 4 }}>
                    <div className="acc-fill" style={{ width: `${Math.min(100, (u.have / u.need) * 100)}%` }} />
                  </div>
                  <div className="game-unlock-sub">
                    {Math.min(u.have, u.need)}/{u.need} — оцените первые {u.need} блюд или напитков, и мы покажем: {u.teaser}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
      <div
        className="me-section"
        onPointerDown={(e) => {
          // horizontal swipe flips the «О вкусе» tabs (Профиль ⇄ Фото)
          const x0 = e.clientX;
          const y0 = e.clientY;
          let decided = false;
          const move = (ev: PointerEvent) => {
            const dx = ev.clientX - x0;
            const dy = ev.clientY - y0;
            if (!decided) {
              if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
              if (Math.abs(dx) <= Math.abs(dy)) { cleanup(); return; } // vertical → scroll
              decided = true;
            }
          };
          const up = (ev: PointerEvent) => {
            const dx = ev.clientX - x0;
            cleanup();
            if (!decided || Math.abs(dx) < 48) return;
            setImpactTab(dx < 0 ? 'photos' : 'taste');
          };
          const cleanup = () => {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            document.removeEventListener('pointercancel', up);
          };
          document.addEventListener('pointermove', move);
          document.addEventListener('pointerup', up);
          document.addEventListener('pointercancel', up);
        }}
      >
        <h2 className="me-h">О вкусе</h2>
        <div className="impact-tabs">
          <button
            className={'impact-tab' + (impactTab === 'taste' ? ' active' : '')}
            onClick={() => setImpactTab('taste')}
          >
            Профиль
          </button>
          <button
            className={'impact-tab' + (impactTab === 'photos' ? ' active' : '')}
            onClick={() => setImpactTab('photos')}
          >
            Фото
          </button>
        </div>

        <div key={impactTab} className="impact-pane">
        {impactTab === 'taste' ? (
          !taste || taste.total === 0 ? (
            <>
              <p className="me-hint">
                Оцените пару блюд или напитков — и здесь появится ваш вкусовой профиль: что любите,
                что чаще пробуете, насколько строго оцениваете.
              </p>
              <button className="btn secondary" onClick={() => nav('/')}>
                Поставить первую оценку
              </button>
            </>
          ) : (
            <div className="taste-card">
              {taste.best && (
                <div className="taste-line">
                  <span className="taste-key">🥇 Лучшая находка</span>
                  <span className="taste-val">{taste.best.name} · {taste.best.rating.toFixed(1)}★</span>
                </div>
              )}
              {taste.favorite && (
                <div className="taste-line">
                  <span className="taste-key">Чаще всего пробует</span>
                  <span className="taste-val">{taste.favorite.name} ({taste.favorite.count})</span>
                </div>
              )}
              {taste.loves && taste.loves.length > 0 && (
                <div className="taste-line">
                  <span className="taste-key">Любит</span>
                  <span className="taste-val">{taste.loves.join(' · ')}</span>
                </div>
              )}
              <div className="taste-line">
                <span className="taste-key">Средняя оценка</span>
                <span className="taste-val">{taste.avg?.toFixed(1)}★</span>
              </div>
              <div className="taste-line">
                <span className="taste-key">Распробовал категорий</span>
                <span className="taste-val">{taste.categoriesTried}</span>
              </div>
              {/* per-category breakdown lives in its own «Оценки по категориям» section */}
            </div>
          )
        ) : photos.length === 0 ? (
          <p className="me-hint">Пока нет фото. Прикрепите фото к отзыву.</p>
        ) : (
          <div className="me-photo-grid">
            {photos.map((u) => (
              <img key={u} src={u} alt="" />
            ))}
          </div>
        )}
        </div>
      </div>

      )}

      {reviews.length > 0 && (
        <div className="me-section">
          <h2 className="me-h">Оценки по категориям</h2>
          <CategoryAverages reviews={reviews} />
        </div>
      )}

      {recent.length > 0 && (
        <div className="me-section">
          <h2 className="me-h">Недавно смотрели</h2>
          {recent.map((l) => (
            <button key={l.id} className="recent-row" onClick={() => setOpenListing(l.id)}>
              <VenuePhoto listing={l} className="recent-img" />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div className="name">{l.name}</div>
                {l.address && <div className="meta">{l.address}</div>}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="me-section">
        <h2 className="me-h">Вклад</h2>
        <div className="contrib-row">
          <span>⭐ Отзывы</span>
          <b>{reviews.length}</b>
        </div>
        <button className="contrib-row link" onClick={() => nav('/business')}>
          <span>🏪 Добавленные заведения</span>
          <b>{owned.length}</b>
        </button>
      </div>

      {/* «Подписки» скрыты пока — вернём, когда будем парсить обновления заведений */}

      <div className="me-section">
        <h2 className="me-h">Ещё</h2>
        <button className="contrib-row link" onClick={() => nav('/business')}>
          <span>💼 Бизнес-кабинет</span>
          <span className="chev">›</span>
        </button>
        <button className="contrib-row link" onClick={() => nav('/favorites?from=profile')}>
          <span>🔖 Хочу попробовать</span>
          <span className="chev">›</span>
        </button>
        <button
          className="contrib-row link"
          onClick={() => {
            localStorage.setItem('force_quiz', '1');
            window.location.reload();
          }}
        >
          <span>🎯 Изменить вкусы</span>
          <span className="chev">›</span>
        </button>
        <button className="contrib-row link" onClick={() => setShowSupport(true)}>
          <span>🛟 Поддержка</span>
          <span className="chev">›</span>
        </button>
        <div className="contrib-row theme-setting">
          <span className="theme-setting-copy">
            <b>Тёмная тема</b>
            <small>Оформление приложения</small>
          </span>
          <span className="theme-segmented" role="group" aria-label="Выбор темы">
            {(['auto', 'light', 'dark'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={theme === value ? 'on' : ''}
                aria-pressed={theme === value}
                onClick={() => {
                  setTheme(value);
                  setThemePreference(value);
                }}
              >
                {value === 'auto' ? 'Авто' : value === 'light' ? 'Светлая' : 'Тёмная'}
              </button>
            ))}
          </span>
        </div>
        {/* setting: skip auto-creating a story when you rate */}
        <button
          className="contrib-row link"
          onClick={() => {
            const v = !noStory;
            setNoStory(v);
            localStorage.setItem('noStoryOnReview', v ? '1' : '0');
          }}
        >
          <span>🎬 Не выставлять оценки в сторис</span>
          <span className={'toggle' + (noStory ? ' on' : '')}>{noStory ? 'Вкл' : 'Выкл'}</span>
        </button>
      </div>

      {/* your reviews — same layout as another user's profile (Untappd style) */}
      {reviews.length === 0 ? (
        <div className="me-section">
          <h2 className="me-h">Мои отзывы</h2>
          <div className="empty">
            Вы ещё не оставили отзывов.
            <br />
            Оцените что-нибудь на главной или в свайпе!
          </div>
        </div>
      ) : (
        (() => {
          const withPhoto = reviews.filter((r) => r.photoUrls?.[0] || r.listing?.photoUrl);
          return (
            <>
              {withPhoto.length > 0 && (
                <div className="me-section">
                  <h2 className="me-h">Оценки</h2>
                  <div className="rc-carousel">
                    {withPhoto.map((r) => (
                      <button key={r.id} onClick={() => setPhotoReview(withMe(r))}>
                        <SmartImg src={r.photoUrls?.[0] || r.listing?.photoUrl} width={400} alt="" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="me-section">
                <h2 className="me-h">Мои отзывы</h2>
                {reviews.map((r) => (
                  <ReviewCard
                    key={r.id}
                    review={withMe(r)}
                    onOpen={() => setPhotoReview(withMe(r))}
                    onOpenUser={(id) => setOpenUser(id)}
                    onOpenVenue={() => r.venue?.id && setOpenListing(r.venue.id)}
                  >
                    {r.status === 'PENDING' && (
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>На модерации</span>
                    )}
                  </ReviewCard>
                ))}
              </div>
            </>
          );
        })()
      )}

      {showAdd && <AddBusiness onClose={() => setShowAdd(false)} />}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
      {people && profile?.user && (
        <PeopleModal
          userId={profile.user.id}
          initialTab={people}
          onClose={() => setPeople(null)}
          onOpenUser={(id) => {
            setPeople(null);
            setOpenUser(id);
          }}
        />
      )}
      {openUser && <UserProfileModal id={openUser} onClose={() => setOpenUser(null)} />}
      {openListing && (
        <ListingDetailModal id={openListing} onClose={() => setOpenListing(null)} />
      )}
      {photoReview && (
        <PhotoPostModal
          review={photoReview}
          onClose={() => setPhotoReview(null)}
          onOpenUser={(id) => { setPhotoReview(null); setOpenUser(id); }}
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
          onEdit={() => { const r = photoReview; setPhotoReview(null); setEdit(r); }}
          onDelete={() => {
            const id = photoReview.id;
            setPhotoReview(null);
            if (confirm('Удалить отзыв?')) api.deleteReview(id).then(load).catch(() => {});
          }}
        />
      )}

      {edit && edit.listing && (
        <ReviewForm
          listing={edit.listing}
          existing={edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            load();
          }}
        />
      )}
    </div>
  );
}
