import { useState } from 'react';
import { useCategoryProgress } from '../categoryGate';

// A few appetising categories to suggest when the user hasn't rated anything yet.
const SEED_CATS = ['Фастфуд', 'Бургеры', 'Пицца', 'Кофе', 'Пиво', 'Вино', 'Суши', 'Десерты', 'Завтраки', 'Стейки'];

// Compact top-of-home "training" card: short pitch + ONE category line that changes
// on every visit (a random in-progress category, or a random suggestion at 0 reviews).
export function TrainingScale() {
  const { data, threshold } = useCategoryProgress();
  const inProgress = (data?.categories ?? []).filter((c) => !c.unlocked);
  const hasAny = (data?.categories?.length ?? 0) > 0;

  // pick ONE category to show, re-rolled each time the component mounts (each home open)
  const [roll] = useState(() => Math.random());
  if (hasAny && inProgress.length === 0) return null; // everything trained → hide

  const shown = inProgress.length
    ? inProgress[Math.floor(roll * inProgress.length) % inProgress.length]
    : { name: SEED_CATS[Math.floor(roll * SEED_CATS.length) % SEED_CATS.length], count: 0 };
  const pct = Math.min(100, (shown.count / threshold) * 100);

  return (
    <div className="train-scale">
      <div className="train-title">🎯 Обучение рекомендаций</div>
      <p className="train-desc">
        Оценивайте блюда и напитки — боритесь за право считаться лучшим дегустатором Москвы!
      </p>
      <p className="train-desc train-tip">
        💡 Для начала оцените {threshold} блюд или напитков категории.
      </p>
      <div className="acc-row">
        <span className="acc-name">{shown.name}</span>
        <div className="acc-track">
          <div className="acc-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="acc-val">
          {Math.min(shown.count, threshold)}/{threshold}
        </span>
      </div>
    </div>
  );
}
