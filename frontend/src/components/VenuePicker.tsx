import { useEffect, useState } from 'react';
import { api } from '../api';
import { useEscClose } from '../modalEsc';
import type { Listing } from '../types';

// collapse chain branches into one row ("Бургер Кинг" once, not 7×)
function dedupeChains(list: Listing[]): (Listing & { branchCount?: number })[] {
  const groups = new Map<string, Listing & { branchCount?: number }>();
  for (const v of list) {
    const key = (v.groupKey || v.name).toLowerCase().trim();
    const existing = groups.get(key);
    // keep the server's chain size if it already collapsed the chain into one card
    if (existing) existing.branchCount = (existing.branchCount ?? 1) + 1;
    else groups.set(key, { ...v, branchCount: v.branchCount && v.branchCount > 1 ? v.branchCount : 1 });
  }
  return [...groups.values()];
}

export function VenuePicker({
  itemId,
  onPick,
  onAdded,
  onClose,
}: {
  itemId?: string; // when set, the default list = venues that SERVE this item
  onPick: (venue: Listing) => void;
  // a new (pending-moderation) place was submitted → proceed to the review form
  onAdded?: (name: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Listing[]>([]);
  const [addMode, setAddMode] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('Москва');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  useEscClose(onClose);

  useEffect(() => {
    const query = q.trim();
    const t = setTimeout(() => {
      // no query → venues that already SERVE this item (the honest default);
      // typing → translit-aware search across all venues
      (query
        ? api.searchVenues(query)
        : itemId
          ? api.placesForItem(itemId).then((v) => (v.length ? v : api.listings('RESTAURANT', undefined, { take: 25 })))
          : api.listings('RESTAURANT', undefined, { take: 25 })
      )
        .then(setResults)
        .catch(() => {});
    }, 180);
    return () => clearTimeout(t);
  }, [q, itemId]);

  const startAdd = () => {
    setName(q.trim());
    setAddress('');
    setAddMode(true);
  };

  const submit = () => {
    if (!name.trim() || !city.trim()) return;
    setBusy(true);
    const placeName = name.trim();
    api
      .submitBusiness({
        relationship: 'customer',
        name: placeName,
        city: city.trim(),
        address: address.trim() || undefined,
        category: 'Ресторан',
      })
      .then(() => {
        // go straight to the review form — the place is pending moderation but
        // the user can rate it now; we attach the name and link once approved.
        if (onAdded) onAdded(placeName);
        else setSent(true);
      })
      .catch(() => setBusy(false));
  };

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 2700 }}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 40 }}>✅</div>
            <h3>Заявка отправлена</h3>
            <p className="meta" style={{ color: 'var(--hint)', fontSize: 14, margin: '8px 0 16px' }}>
              Заведение появится после проверки модератором.
            </p>
            <button className="btn" onClick={onClose}>
              Готово
            </button>
          </div>
        ) : addMode ? (
          <>
            <h3>Добавить заведение</h3>
            <div className="field">
              <label>Название</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Север" />
            </div>
            <div className="field">
              <label>Город</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Москва" />
            </div>
            <div className="field">
              <label>Адрес (необязательно)</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Улица, дом" />
            </div>
            <p className="meta" style={{ color: 'var(--hint)', fontSize: 12 }}>
              Найдём заведение по карте. Если у сети много точек — добавим все.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button className="btn secondary" onClick={() => setAddMode(false)} disabled={busy}>
                Назад
              </button>
              <button className="btn" onClick={submit} disabled={busy || !name.trim() || !city.trim()}>
                {busy ? 'Отправка…' : 'Отправить'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>Где вы это пробовали?</h3>
            <div className="pu-search">
              <span className="search-ico">🔍</span>
              <input
                placeholder="Найти ресторан или бар…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="pu-list">
              {dedupeChains(results).map((v) => (
                <button key={v.id} className="pick-row" onClick={() => onPick(v)}>
                  <div className="pu-name">{v.name}</div>
                  {v.branchCount && v.branchCount > 1 ? (
                    <div className="pu-meta">Сеть · {v.branchCount} точек</div>
                  ) : (
                    v.address && <div className="pu-meta">{v.address}</div>
                  )}
                </button>
              ))}
              {q.trim().length >= 2 && (
                <button className="pick-row add-row" onClick={startAdd}>
                  <div className="pu-name" style={{ color: 'var(--accent)' }}>
                    ➕ Нет в списке — добавить «{q.trim()}»
                  </div>
                  <div className="pu-meta">Добавим сразу, если адрес подтвердится</div>
                </button>
              )}
            </div>
            <button className="btn secondary" style={{ marginTop: 12 }} onClick={onClose}>
              Отмена
            </button>
          </>
        )}
      </div>
    </div>
  );
}
