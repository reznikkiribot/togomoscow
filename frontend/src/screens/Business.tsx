import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ListingDetailModal } from '../components/ListingDetail';
import { UserProfileModal } from '../components/People';
import { Stars } from '../components/Stars';
import type {
  AdminChallenge,
  AdminUser,
  BusinessSubmission,
  Claim,
  ClaimStatus,
  Correction,
  Listing,
  PendingMenuLink,
  Profile,
  Review,
  SupportMsg,
} from '../types';

const STATUS_LABEL: Record<ClaimStatus, string> = {
  PENDING: 'На проверке',
  APPROVED: 'Подтверждено',
  REJECTED: 'Отклонено',
};

export default function Business() {
  const nav = useNavigate();
  const [me, setMe] = useState<Profile['user'] | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [venues, setVenues] = useState<Listing[]>([]);
  const [adminClaims, setAdminClaims] = useState<Claim[]>([]);
  const [adminBiz, setAdminBiz] = useState<BusinessSubmission[]>([]);
  const [adminReviews, setAdminReviews] = useState<Review[]>([]);
  const [adminItems, setAdminItems] = useState<PendingMenuLink[]>([]);
  const [adminCorr, setAdminCorr] = useState<Correction[]>([]);
  const [adminSupport, setAdminSupport] = useState<SupportMsg[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminChal, setAdminChal] = useState<AdminChallenge[]>([]);
  const [chForm, setChForm] = useState({ title: '', category: '', target: '5', days: '14' });
  const [openSec, setOpenSec] = useState<string | null>(null);
  const [mySubs, setMySubs] = useState<BusinessSubmission[]>([]);
  const [edit, setEdit] = useState<Listing | null>(null);
  const [reviewsFor, setReviewsFor] = useState<Listing | null>(null);
  const [pendingFor, setPendingFor] = useState<Listing | null>(null);
  const [openListing, setOpenListing] = useState<string | null>(null);
  const [openUser, setOpenUser] = useState<string | null>(null);

  const load = () => {
    api.me().then(setMe).catch(() => {});
    api.myClaims().then(setClaims).catch(() => {});
    api.ownerVenues().then(setVenues).catch(() => {});
    api.mySubmissions().then(setMySubs).catch(() => {});
  };
  useEffect(() => {
    load();
  }, []);

  const isAdmin = me?.role === 'ADMIN';
  const loadAdmin = () => {
    api.adminClaims().then(setAdminClaims).catch(() => {});
    api.adminBusiness().then(setAdminBiz).catch(() => {});
    api.adminReviews().then(setAdminReviews).catch(() => {});
    api.adminPendingItems().then(setAdminItems).catch(() => {});
    api.adminCorrections().then(setAdminCorr).catch(() => {});
    api.adminSupport().then(setAdminSupport).catch(() => {});
    api.adminUsers().then(setAdminUsers).catch(() => {});
    api.adminChallenges().then(setAdminChal).catch(() => {});
  };

  const createChallenge = () => {
    if (!chForm.title.trim()) return;
    api
      .createChallenge({
        title: chForm.title.trim(),
        category: chForm.category.trim() || undefined,
        target: Number(chForm.target) || 1,
        days: Number(chForm.days) || 7,
      })
      .then(() => {
        setChForm({ title: '', category: '', target: '5', days: '14' });
        loadAdmin();
      });
  };
  const deactivateChallenge = (id: string) => api.deactivateChallenge(id).then(loadAdmin);
  useEffect(() => {
    if (isAdmin) loadAdmin();
  }, [isAdmin]);

  const decide = (id: string, approve: boolean) => {
    (approve ? api.approveClaim(id) : api.rejectClaim(id)).then(() => {
      loadAdmin();
      api.ownerVenues().then(setVenues).catch(() => {});
    });
  };

  const decideBiz = (
    id: string,
    approve: boolean,
    overrides?: { name?: string; address?: string; phone?: string; category?: string },
  ) => {
    api.setBusiness(id, approve ? 'approve' : 'reject', overrides).then(() => {
      loadAdmin();
      api.ownerVenues().then(setVenues).catch(() => {});
    });
  };

  const decideReview = (id: string, approve: boolean, price?: number) => {
    api.moderateReview(id, approve ? 'approve' : 'reject', price).then(loadAdmin);
  };

  const decideItem = (venueId: string, itemId: string, approve: boolean) => {
    api
      .adminSetItem(venueId, itemId, { status: approve ? 'APPROVED' : 'REJECTED' })
      .then(loadAdmin);
  };

  const resolveCorr = (id: string) => {
    api.resolveCorrection(id).then(loadAdmin);
  };

  return (
    <div>
      <div className="topbar with-back">
        <button className="back-btn" onClick={() => nav('/me')} aria-label="Назад">
          ←
        </button>
        <h2>Кабинет</h2>
      </div>

      {me && (
        <div className="biz-note">
          Ваш Telegram ID: <b>{me.telegramId}</b>
          {!isAdmin && (
            <div className="meta" style={{ color: 'var(--hint)', marginTop: 4 }}>
              Чтобы подтверждать заявки как админ — добавьте этот ID в ADMIN_TELEGRAM_IDS на сервере.
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <>
          <Acc id="claims" title="Заявки на права" count={adminClaims.length} openSec={openSec} setOpenSec={setOpenSec}>
          {adminClaims.length === 0 ? (
            <div className="empty">Заявок нет</div>
          ) : (
            adminClaims.map((c) => (
              <div key={c.id} className="biz-card">
                <b>{c.listing?.name}</b>
                <div className="meta" style={{ color: 'var(--hint)' }}>
                  от {c.user?.firstName ?? c.user?.username ?? 'гость'} · TG {c.user?.telegramId}
                </div>
                {c.message && <div style={{ fontSize: 14, marginTop: 4 }}>{c.message}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn" onClick={() => decide(c.id, true)}>
                    Подтвердить
                  </button>
                  <button className="btn secondary" onClick={() => decide(c.id, false)}>
                    Отклонить
                  </button>
                </div>
              </div>
            ))
          )}
          </Acc>

          <Acc id="reviews" title="Отзывы на модерации" count={adminReviews.length} openSec={openSec} setOpenSec={setOpenSec}>
          {adminReviews.length === 0 ? (
            <div className="empty">Нет отзывов на проверке</div>
          ) : (
            adminReviews.map((r) => (
              <ReviewModCard
                key={r.id}
                r={r}
                onOpen={(lid) => setOpenListing(lid)}
                onDecide={decideReview}
              />
            ))
          )}
          </Acc>

          <Acc id="items" title="Предложенные блюда / напитки" count={adminItems.length} openSec={openSec} setOpenSec={setOpenSec}>
          {adminItems.length === 0 ? (
            <div className="empty">Нет предложений</div>
          ) : (
            adminItems.map((p) => (
              <div key={p.itemId} className="biz-card">
                <b>{p.item.name}</b>
                <div className="meta" style={{ color: 'var(--hint)' }}>
                  {p.item.type === 'DRINK' ? 'Напиток' : 'Блюдо'}
                  {p.venue ? ` · в «${p.venue.name}»` : ''}
                  {p.addedBy ? ` · ${p.addedBy.firstName ?? p.addedBy.username ?? 'гость'}` : ''}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn" onClick={() => decideItem(p.venueId, p.itemId, true)}>
                    Одобрить
                  </button>
                  <button className="btn secondary" onClick={() => decideItem(p.venueId, p.itemId, false)}>
                    Отклонить
                  </button>
                </div>
              </div>
            ))
          )}

          </Acc>

          <Acc id="biz" title="Заявки на заведения" count={adminBiz.length} openSec={openSec} setOpenSec={setOpenSec}>
          {adminBiz.length === 0 ? (
            <div className="empty">Заявок нет</div>
          ) : (
            adminBiz.map((s) => <BizCard key={s.id} sub={s} onDecide={decideBiz} />)
          )}
          </Acc>

          <Acc id="support" title="Сообщения в поддержку" count={adminSupport.length} openSec={openSec} setOpenSec={setOpenSec}>
          {adminSupport.length === 0 ? (
            <div className="empty">Сообщений нет</div>
          ) : (
            adminSupport.map((m) => (
              <div key={m.id} className="biz-card">
                <b>{m.user?.firstName ?? m.user?.username ?? 'гость'}</b>
                {m.user?.username ? (
                  <span className="meta" style={{ color: 'var(--hint)' }}> @{m.user.username}</span>
                ) : null}
                <div style={{ fontSize: 14, marginTop: 4 }}>{m.text}</div>
                <div className="meta" style={{ color: 'var(--hint)', fontSize: 12, marginTop: 2 }}>
                  {new Date(m.createdAt).toLocaleString('ru-RU')}
                </div>
              </div>
            ))
          )}
          </Acc>

          <Acc id="corr" title="Правки к карточкам" count={adminCorr.length} openSec={openSec} setOpenSec={setOpenSec}>
          {adminCorr.length === 0 ? (
            <div className="empty">Правок нет</div>
          ) : (
            adminCorr.map((c) => (
              <div key={c.id} className="biz-card">
                <b>{c.listing?.name}</b>
                <div className="meta" style={{ color: 'var(--hint)' }}>
                  {c.user?.firstName ?? c.user?.username ?? 'гость'}
                </div>
                <div style={{ fontSize: 14, marginTop: 4 }}>{c.text}</div>
                <button className="btn secondary" style={{ marginTop: 8 }} onClick={() => resolveCorr(c.id)}>
                  Готово
                </button>
              </div>
            ))
          )}
          </Acc>

          <Acc id="chal" title="Челленджи" count={adminChal.filter((c) => c.active).length} openSec={openSec} setOpenSec={setOpenSec}>
          <div className="biz-card">
            <input
              placeholder="Название (напр. Оцените 5 кофеен)"
              value={chForm.title}
              onChange={(e) => setChForm({ ...chForm, title: e.target.value })}
              style={{ width: '100%', marginBottom: 6 }}
            />
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input
                placeholder="Категория (кофе/вино…, пусто=любое)"
                value={chForm.category}
                onChange={(e) => setChForm({ ...chForm, category: e.target.value })}
                style={{ flex: 1 }}
              />
              <input
                placeholder="Цель"
                value={chForm.target}
                onChange={(e) => setChForm({ ...chForm, target: e.target.value })}
                style={{ width: 60 }}
              />
              <input
                placeholder="Дней"
                value={chForm.days}
                onChange={(e) => setChForm({ ...chForm, days: e.target.value })}
                style={{ width: 60 }}
              />
            </div>
            <button className="btn" onClick={createChallenge}>
              Создать челлендж
            </button>
          </div>
          {adminChal.filter((c) => c.active).map((c) => (
            <div key={c.id} className="biz-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b>{c.title}</b>
                <div className="meta" style={{ color: 'var(--hint)' }}>
                  {c.category ?? 'любое'} · цель {c.target} · до {new Date(c.endsAt).toLocaleDateString('ru-RU')}
                </div>
              </div>
              <button className="btn secondary" onClick={() => deactivateChallenge(c.id)}>
                Снять
              </button>
            </div>
          ))}
          </Acc>

          <Acc id="users" title="Пользователи" count={adminUsers.length} openSec={openSec} setOpenSec={setOpenSec}>
          {adminUsers.map((u) => (
            <button
              key={u.id}
              className="biz-card"
              style={{ padding: '10px 12px', display: 'block', width: '100%', textAlign: 'left' }}
              onClick={() => setOpenUser(u.id)}
            >
              <b>{u.firstName ?? u.username ?? 'Гость'}</b>
              <span className="meta" style={{ color: 'var(--hint)' }}>
                {u.username ? ` @${u.username}` : ''} · TG {u.telegramId}
                {u.role !== 'CUSTOMER' ? ` · ${u.role}` : ''}
              </span>
              <div className="meta" style={{ color: 'var(--hint)', fontSize: 12, marginTop: 2 }}>
                {u.session ? (
                  <>
                    Запустил: {new Date(u.session.startedAt).toLocaleString('ru-RU')}
                    {u.session.endedAt ? (
                      <>
                        {' · Вышел: '}
                        {new Date(u.session.endedAt).toLocaleTimeString('ru-RU')}
                        {' · '}
                        {Math.max(
                          1,
                          Math.round(
                            (new Date(u.session.endedAt).getTime() -
                              new Date(u.session.startedAt).getTime()) /
                              60000,
                          ),
                        )}{' '}
                        мин
                      </>
                    ) : (
                      ' · в сети'
                    )}
                  </>
                ) : (
                  'Сессий пока нет'
                )}
              </div>
            </button>
          ))}
          </Acc>
        </>
      )}

      {mySubs.length > 0 && (
        <>
          <div className="section-title">Мои заявки на добавление</div>
          {mySubs.map((s) => (
            <div key={s.id} className="biz-card">
              <b>{s.name}</b>
              <div className="meta" style={{ color: 'var(--hint)' }}>
                {s.category} · {STATUS_LABEL[s.status]}
              </div>
            </div>
          ))}
        </>
      )}

      <div className="section-title">Мои заведения ({venues.length})</div>
      {venues.length === 0 ? (
        <div className="empty">
          Пока нет подтверждённых заведений. Откройте карточку места и нажмите «Заявить права».
        </div>
      ) : (
        venues.map((v) => (
          <div key={v.id} className="biz-card">
            <div className="vcard-top">
              <b>{v.name}</b>
              {v.priceLevel ? <span className="price">{'₽'.repeat(v.priceLevel)}</span> : null}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
              <Stars value={v.avgRating} />
              <span className="meta" style={{ color: 'var(--hint)' }}>
                {v.avgRating.toFixed(1)} ({v.reviewCount})
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <button className="btn secondary" onClick={() => setEdit(v)}>
                Редактировать
              </button>
              <button className="btn secondary" onClick={() => setReviewsFor(v)}>
                Ответить на отзывы
              </button>
              <button className="btn secondary" onClick={() => setPendingFor(v)}>
                Предложения меню
              </button>
            </div>
          </div>
        ))
      )}

      {claims.length > 0 && (
        <>
          <div className="section-title">Мои заявки</div>
          {claims.map((c) => (
            <div key={c.id} className="biz-card" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <b>{c.listing?.name}</b>
              <span className={`biz-status ${c.status}`}>{STATUS_LABEL[c.status]}</span>
            </div>
          ))}
        </>
      )}

      {edit && (
        <EditVenueModal
          venue={edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            api.ownerVenues().then(setVenues).catch(() => {});
          }}
        />
      )}
      {reviewsFor && (
        <VenueReviewsModal venue={reviewsFor} onClose={() => setReviewsFor(null)} />
      )}
      {pendingFor && (
        <PendingItemsModal venue={pendingFor} onClose={() => setPendingFor(null)} />
      )}
      {openListing && (
        <ListingDetailModal id={openListing} onClose={() => setOpenListing(null)} />
      )}
      {openUser && <UserProfileModal id={openUser} onClose={() => setOpenUser(null)} />}
    </div>
  );
}

// Collapsible cabinet section with a count badge — open one list at a time.
function Acc({
  id,
  title,
  count,
  openSec,
  setOpenSec,
  children,
}: {
  id: string;
  title: string;
  count: number;
  openSec: string | null;
  setOpenSec: (s: string | null) => void;
  children: ReactNode;
}) {
  const open = openSec === id;
  return (
    <div className="acc">
      <button className="acc-head" onClick={() => setOpenSec(open ? null : id)}>
        <span className="acc-title">{title}</span>
        <span className="acc-right">
          {count > 0 && <span className="acc-badge">{count}</span>}
          <span className="acc-chev">{open ? '▴' : '▾'}</span>
        </span>
      </button>
      {open && <div className="acc-body">{children}</div>}
    </div>
  );
}

// Admin can fill/fix a submission's address & phone before approving it.
// One pending review with an editable price (moderator can correct it before approving).
function ReviewModCard({
  r,
  onOpen,
  onDecide,
}: {
  r: Review;
  onOpen: (listingId: string) => void;
  onDecide: (id: string, approve: boolean, price?: number) => void;
}) {
  const initial = (r.attributes as any)?.price;
  const [price, setPrice] = useState<string>(initial != null ? String(initial) : '');
  const isItem = r.listing?.type === 'DISH' || r.listing?.type === 'DRINK';
  return (
    <div className="biz-card">
      <button className="link-name" onClick={() => r.listing && onOpen(r.listing.id)}>
        {r.listing?.name}
      </button>
      <div className="meta" style={{ color: 'var(--hint)' }}>
        {r.user?.firstName ?? r.user?.username ?? 'гость'} · ★ {r.rating.toFixed(1)}
        {(r.attributes as any)?.venueName ? ` · ${(r.attributes as any).venueName}` : ''}
      </div>
      {r.text && <div style={{ fontSize: 14, marginTop: 4 }}>{r.text}</div>}
      {(r.photoUrls?.length > 0 || (r.videoUrls?.length ?? 0) > 0) && (
        <div className="photo-thumbs">
          {r.photoUrls?.map((u) => (
            <img key={u} src={u} alt="" />
          ))}
          {r.videoUrls?.map((u) => (
            <video key={u} src={u} controls playsInline />
          ))}
        </div>
      )}
      {isItem && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 14 }}>
          Цена, ₽:
          <input
            type="number"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="—"
            style={{ width: 90 }}
          />
        </label>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          className="btn"
          onClick={() => onDecide(r.id, true, price ? Number(price) : undefined)}
        >
          Одобрить
        </button>
        <button className="btn secondary" onClick={() => onDecide(r.id, false)}>
          Удалить
        </button>
      </div>
    </div>
  );
}

function BizCard({
  sub,
  onDecide,
}: {
  sub: BusinessSubmission;
  onDecide: (
    id: string,
    approve: boolean,
    overrides?: { name?: string; address?: string; phone?: string; category?: string },
  ) => void;
}) {
  const [address, setAddress] = useState(sub.address ?? '');
  const [phone, setPhone] = useState(sub.phone ?? '');
  return (
    <div className="biz-card">
      <b>{sub.name}</b>
      <div className="meta" style={{ color: 'var(--hint)' }}>
        {sub.category} · {sub.country}
        {' · '}
        {sub.relationship === 'owner' ? 'Сотрудник' : 'Посетитель'} ·{' '}
        {sub.user?.firstName ?? sub.user?.username ?? 'гость'}
      </div>
      {sub.notes && <div style={{ fontSize: 14, marginTop: 4 }}>{sub.notes}</div>}
      <div className="field" style={{ marginTop: 8 }}>
        <label>Адрес</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Улица, дом" />
      </div>
      <div className="field">
        <label>Телефон</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7…" />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          className="btn"
          onClick={() =>
            onDecide(sub.id, true, { address: address.trim() || undefined, phone: phone.trim() || undefined })
          }
        >
          Одобрить
        </button>
        <button className="btn secondary" onClick={() => onDecide(sub.id, false)}>
          Отклонить
        </button>
      </div>
    </div>
  );
}

function PendingItemsModal({ venue, onClose }: { venue: Listing; onClose: () => void }) {
  const [items, setItems] = useState<PendingMenuLink[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    api.pendingMenuItems(venue.id).then(setItems).catch(() => {});
  }, [venue.id]);

  const decide = (itemId: string, status: 'APPROVED' | 'REJECTED') => {
    const price = prices[itemId] ? Number(prices[itemId]) : undefined;
    api.setMenuItem(venue.id, itemId, { status, price }).then(() =>
      setItems((its) => its.filter((x) => x.itemId !== itemId)),
    );
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{venue.name}: предложения меню</h3>
        {items.length === 0 ? (
          <div className="empty">Нет предложений на модерации</div>
        ) : (
          items.map((m) => (
            <div key={m.itemId} className="biz-card">
              <b>{m.item.name}</b>
              <div className="meta" style={{ color: 'var(--hint)' }}>
                {m.item.type === 'DISH' ? 'Блюдо' : 'Напиток'}
                {m.addedBy ? ` · предложил ${m.addedBy.firstName ?? m.addedBy.username ?? 'гость'}` : ''}
              </div>
              {m.item.description && (
                <div style={{ fontSize: 14, marginTop: 4 }}>{m.item.description}</div>
              )}
              <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
                <input
                  placeholder="Цена ₽"
                  inputMode="numeric"
                  value={prices[m.itemId] ?? ''}
                  onChange={(e) => setPrices((p) => ({ ...p, [m.itemId]: e.target.value }))}
                  style={{
                    width: 90,
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '9px 10px',
                  }}
                />
                <button className="btn" style={{ width: 'auto' }} onClick={() => decide(m.itemId, 'APPROVED')}>
                  Подтвердить
                </button>
                <button
                  className="btn secondary"
                  style={{ width: 'auto' }}
                  onClick={() => decide(m.itemId, 'REJECTED')}
                >
                  Отклонить
                </button>
              </div>
            </div>
          ))
        )}
        <button className="btn secondary" style={{ marginTop: 14 }} onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
}

function EditVenueModal({
  venue,
  onClose,
  onSaved,
}: {
  venue: Listing;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    name: venue.name,
    description: venue.description ?? '',
    hours: venue.hours ?? '',
    phone: venue.phone ?? '',
    website: venue.website ?? '',
    priceLevel: venue.priceLevel ?? 0,
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: any) => setF((s) => ({ ...s, [k]: v }));

  const save = () => {
    setBusy(true);
    api
      .editVenue(venue.id, { ...f, priceLevel: f.priceLevel || null } as any)
      .then(onSaved)
      .catch(() => setBusy(false));
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Редактирование</h3>
        <div className="field">
          <label>Название</label>
          <input value={f.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="field">
          <label>Описание</label>
          <textarea value={f.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="field">
          <label>Часы работы</label>
          <input
            value={f.hours}
            onChange={(e) => set('hours', e.target.value)}
            placeholder="Mo-Su 10:00-22:00"
          />
        </div>
        <div className="field">
          <label>Телефон</label>
          <input value={f.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <div className="field">
          <label>Сайт</label>
          <input value={f.website} onChange={(e) => set('website', e.target.value)} />
        </div>
        <div className="field">
          <label>Ценовая категория</label>
          <select
            value={f.priceLevel}
            onChange={(e) => set('priceLevel', Number(e.target.value))}
          >
            <option value={0}>Не указана</option>
            <option value={1}>₽</option>
            <option value={2}>₽₽</option>
            <option value={3}>₽₽₽</option>
            <option value={4}>₽₽₽₽</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn secondary" onClick={onClose} disabled={busy}>
            Отмена
          </button>
          <button className="btn" onClick={save} disabled={busy}>
            {busy ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}

function VenueReviewsModal({ venue, onClose }: { venue: Listing; onClose: () => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    api.venueReviews(venue.id).then(setReviews).catch(() => {});
  }, [venue.id]);

  const send = (id: string) => {
    const text = drafts[id]?.trim();
    if (!text) return;
    api.replyReview(id, text).then((r) =>
      setReviews((rs) => rs.map((x) => (x.id === id ? { ...x, ownerReply: r.ownerReply } : x))),
    );
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 2600 }} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{venue.name}: отзывы</h3>
        {reviews.length === 0 ? (
          <div className="empty">Отзывов пока нет</div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <b>{r.user?.firstName ?? 'Гость'}</b>
                <Stars value={r.rating} />
              </div>
              {r.text && <div style={{ fontSize: 14, marginTop: 2 }}>{r.text}</div>}
              {r.ownerReply ? (
                <div className="owner-reply">
                  <b>Ваш ответ:</b> {r.ownerReply}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <input
                    placeholder="Ответить…"
                    value={drafts[r.id] ?? ''}
                    onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                    style={{
                      flex: 1,
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '9px 12px',
                    }}
                  />
                  <button className="btn" style={{ width: 'auto' }} onClick={() => send(r.id)}>
                    Ответить
                  </button>
                </div>
              )}
            </div>
          ))
        )}
        <button className="btn secondary" style={{ marginTop: 14 }} onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
}
