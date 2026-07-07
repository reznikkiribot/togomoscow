import { useEffect, useState } from 'react';
import { api } from '../api';

// labels shown to the user → keyword stored (used to match catalog categories)
// only categories that are actually recommended (no alcohol/breakfast — those are
// excluded from the recommendation system, so don't offer them in onboarding)
const CATEGORIES: { label: string; key: string; icon: string }[] = [
  { label: 'Кофе', key: 'кофе', icon: '☕' },
  { label: 'Стейки', key: 'стейк', icon: '🥩' },
  { label: 'Бургеры', key: 'бургер', icon: '🍔' },
  { label: 'Пицца', key: 'пицц', icon: '🍕' },
  { label: 'Суши', key: 'японск', icon: '🍣' },
  { label: 'Грузинская', key: 'грузин', icon: '🫓' },
  { label: 'Десерты', key: 'десерт', icon: '🍰' },
  { label: 'Морепродукты', key: 'морепрод', icon: '🦐' },
];
const PRICES = [
  { label: '₽ доступно', value: 1 },
  { label: '₽₽ средне', value: 2 },
  { label: '₽₽₽ премиум', value: 3 },
];

export function QuizModal({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [cats, setCats] = useState<string[]>([]);
  const [price, setPrice] = useState<number>(0);
  const [busy, setBusy] = useState(false);

  // pre-select what was chosen before, so "Изменить вкусы" shows the current picks
  useEffect(() => {
    api
      .onboarding()
      .then((o) => {
        if (o.preferences?.categories) setCats(o.preferences.categories);
        if (o.preferences?.price) setPrice(o.preferences.price);
      })
      .catch(() => {});
  }, []);

  const toggle = (k: string) =>
    setCats((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]));

  const finish = () => {
    setBusy(true);
    api
      .setOnboarding({ categories: cats, price: price || undefined })
      .then(onDone)
      .catch(() => setBusy(false));
  };

  return (
    <div className="quiz">
      <div className="quiz-inner">
        {step === 0 ? (
          <>
            <div className="quiz-hero">🍷☕🥩</div>
            <h2 className="quiz-h">Добро пожаловать в клуб дегустаторов!</h2>
            <p className="quiz-sub">Дегустатором чего вы хотите стать? Выберите, что вам интересно — под это подберём, что пробовать.</p>
            <div className="quiz-grid">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  className={'quiz-cat' + (cats.includes(c.key) ? ' on' : '')}
                  onClick={() => toggle(c.key)}
                >
                  <span className="quiz-cat-ico">{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
            <button className="btn" disabled={cats.length === 0} onClick={() => setStep(1)}>
              Далее
            </button>
          </>
        ) : step === 1 ? (
          <>
            <h2 className="quiz-h">Ваш сегмент</h2>
            <p className="quiz-sub">Какие места вам ближе? (необязательно)</p>
            <div className="chips wrap" style={{ justifyContent: 'center' }}>
              {PRICES.map((p) => (
                <button
                  key={p.value}
                  className={'chip' + (price === p.value ? ' active' : '')}
                  onClick={() => setPrice(price === p.value ? 0 : p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button className="btn secondary" onClick={() => setStep(0)} disabled={busy}>
                Назад
              </button>
              <button className="btn" onClick={() => setStep(2)} disabled={busy}>
                Далее
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="quiz-hero">🎯</div>
            <h2 className="quiz-h">Как это работает</h2>
            <p className="quiz-sub">
              Каждая ваша оценка <b>обучает алгоритм вашему вкусу</b>. Чем больше блюд и напитков
              вы оцениваете, тем точнее мы понимаем, что вам зайдёт, и тем лучше подбираем похожее.
            </p>
            <ul className="quiz-how">
              <li>⭐ Оценивайте — система учится на ваших оценках</li>
              <li>🧠 Находит дегустаторов с похожим вкусом</li>
              <li>🍷 Показывает «вероятность, что вам понравится»</li>
            </ul>
            <p className="quiz-sub" style={{ marginTop: 4 }}>
              Уже после первых оценок рекомендации станут точнее.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn secondary" onClick={() => setStep(1)} disabled={busy}>
                Назад
              </button>
              <button className="btn" onClick={finish} disabled={busy}>
                {busy ? 'Сохранение…' : 'Начать дегустировать'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
