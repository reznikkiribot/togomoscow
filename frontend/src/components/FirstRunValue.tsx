import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Listing } from '../types';
import { QuickRatingFlow } from './QuickRatingFlow';

const QUICK_ITEMS = ['Капучино', 'Раф', 'Бургер', 'Пицца', 'Суши', 'Паста'];

export function FirstRunValue({ onDone, onScan }: { onDone: () => void; onScan: () => void }) {
  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [quickItem, setQuickItem] = useState<Listing | null>(null);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    if (!picker || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      api.searchAll(query.trim())
        .then((items) => {
          if (!cancelled) setResults(items.filter((item) => item.type === 'DISH' || item.type === 'DRINK').slice(0, 12));
        })
        .catch(() => { if (!cancelled) setResults([]); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 180);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [picker, query]);

  const chooseQuick = async (name: string) => {
    setPicker(true);
    setQuery(name);
    setLoading(true);
    try {
      const items = await api.searchAll(name);
      const candidates = items.filter((item) => item.type === 'DISH' || item.type === 'DRINK');
      const exact = candidates.find((item) => item.name.trim().toLowerCase() === name.toLowerCase()) ?? candidates[0];
      if (exact) setQuickItem(exact);
      else setResults([]);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  if (quickItem) {
    return (
      <QuickRatingFlow
        listing={quickItem}
        onSaved={() => setRated(true)}
        onClose={() => {
          if (rated) onDone();
          else setQuickItem(null);
        }}
      />
    );
  }

  return (
    <div className="quiz first-run-value">
      <div className="quiz-inner">
        {!picker ? (
          <>
            <div className="first-run-mark">★</div>
            <h2 className="quiz-h">Находите блюда и напитки, которые понравятся именно вам</h2>
            <p className="quiz-sub">Поставьте несколько оценок — и мы начнём подбирать места под ваш вкус</p>
            <button className="btn first-run-primary" type="button" onClick={() => setPicker(true)}>Поставить первую оценку</button>
            <button className="btn secondary" type="button" onClick={onScan}>📷 Распознать блюдо по фото</button>
            <button className="first-run-skip" type="button" onClick={onDone}>Пропустить</button>
          </>
        ) : (
          <>
            <button className="first-run-back" type="button" onClick={() => { setPicker(false); setQuery(''); }}>← Назад</button>
            <h2 className="quiz-h">Что вы пробовали?</h2>
            <p className="quiz-sub">Выберите знакомую позицию или найдите свою</p>
            <div className="first-run-chips">
              {QUICK_ITEMS.map((item) => <button type="button" key={item} onClick={() => chooseQuick(item)}>{item}</button>)}
            </div>
            <div className="pu-search first-run-search">
              <span className="search-ico">🔍</span>
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск блюда или напитка" />
            </div>
            <div className="first-run-results">
              {loading && <div className="quick-loading">Ищем…</div>}
              {!loading && results.map((item) => (
                <button type="button" key={item.id} onClick={() => setQuickItem(item)}>
                  <span>{item.name}</span><small>{item.category || (item.type === 'DRINK' ? 'Напиток' : 'Блюдо')}</small>
                </button>
              ))}
            </div>
            <button className="first-run-skip" type="button" onClick={onDone}>Пропустить</button>
          </>
        )}
      </div>
    </div>
  );
}
