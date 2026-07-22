import { useEffect, useState } from 'react';
import { onCategoryUnlock } from '../categoryGate';
import { haptic } from '../telegram';

// Center-screen congratulation when a category reaches the review threshold and
// its rankings + specialization unlock. Mounted once at the app root.
export function CategoryCelebration() {
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => onCategoryUnlock((cat) => {
    haptic('heavy');
    setCategory(cat);
  }), []);

  if (!category) return null;

  return (
    <div className="celebrate-backdrop" onClick={() => setCategory(null)}>
      <div className="celebrate-card" onClick={(e) => e.stopPropagation()}>
        <div className="celebrate-emoji">🎉</div>
        <h2 className="celebrate-h">Категория открыта!</h2>
        <p className="celebrate-sub">
          Вы добавили 5 дегустаций в категории «<b>{category}</b>». Теперь открыты её
          рейтинги и специализация — и рекомендации стали точнее.
        </p>
        <button className="btn" onClick={() => setCategory(null)}>
          Отлично!
        </button>
      </div>
    </div>
  );
}
