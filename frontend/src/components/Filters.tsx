import { useState } from 'react';
import { useEscClose } from '../modalEsc';

export type SortKey = 'recommended' | 'rating' | 'reviews' | 'distance';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'recommended', label: 'Рекомендуемые' },
  { value: 'distance', label: 'По расстоянию' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'reviews', label: 'По дегустациям' },
];

const PRICES: { value: number; label: string }[] = [
  { value: 0, label: 'Любая' },
  { value: 1, label: '₽' },
  { value: 2, label: '₽₽' },
  { value: 3, label: '₽₽₽' },
  { value: 4, label: '₽₽₽₽' },
];

const CUISINES: { value: string; label: string }[] = [
  { value: '', label: 'Любая' },
  { value: 'russian', label: 'Русская' },
  { value: 'georgian', label: 'Грузинская' },
  { value: 'italian', label: 'Итальянская' },
  { value: 'pizza', label: 'Пицца' },
  { value: 'sushi', label: 'Японская / суши' },
  { value: 'asian', label: 'Азиатская' },
  { value: 'chinese', label: 'Китайская' },
  { value: 'burger', label: 'Бургеры' },
  { value: 'coffee', label: 'Кофе' },
  { value: 'barbecue', label: 'Шашлык / гриль' },
  { value: 'fast_food', label: 'Фастфуд' },
];

export interface FilterState {
  sort: SortKey;
  price: number;
  openNow: boolean;
  cuisine: string;
}

const DEFAULTS: FilterState = { sort: 'recommended', price: 0, openNow: false, cuisine: '' };

function SlidersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="7" x2="21" y2="7" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="17" x2="21" y2="17" />
      <circle cx="8" cy="7" r="2.4" fill="#fff" />
      <circle cx="16" cy="12" r="2.4" fill="#fff" />
      <circle cx="9" cy="17" r="2.4" fill="#fff" />
    </svg>
  );
}

type DropKey = 'sort' | 'price' | 'cuisine';

export function Filters({
  state,
  onChange,
  variant = 'venue',
}: {
  state: FilterState;
  onChange: (next: Partial<FilterState>) => void;
  variant?: 'venue' | 'item'; // items: sort only (price/openNow/cuisine don't apply)
}) {
  const isItem = variant === 'item';
  const [sheet, setSheet] = useState(false);
  const [open, setOpen] = useState<DropKey | null>(null);
  const toggle = (k: DropKey) => setOpen((o) => (o === k ? null : k));
  const pick = (patch: Partial<FilterState>) => {
    onChange(patch);
    setOpen(null);
  };

  const sortLabel = SORTS.find((s) => s.value === state.sort)!.label;
  const cuisineLabel = CUISINES.find((c) => c.value === state.cuisine)?.label;

  return (
    <div className="filters-wrap">
      <div className="filterbar">
        {!isItem && (
          <button className="fbtn-icon" onClick={() => setSheet(true)} aria-label="Все фильтры">
            <SlidersIcon />
          </button>
        )}
        <button
          className={'chip' + (state.sort !== 'recommended' ? ' active' : '') + (open === 'sort' ? ' open' : '')}
          onClick={() => toggle('sort')}
        >
          {state.sort === 'recommended' ? 'Сортировка' : sortLabel} ▾
        </button>
        {!isItem && (
          <>
            <button
              className={'chip' + (state.openNow ? ' active' : '')}
              onClick={() => onChange({ openNow: !state.openNow })}
            >
              Открыто сейчас
            </button>
            <button
              className={'chip' + (state.price > 0 ? ' active' : '') + (open === 'price' ? ' open' : '')}
              onClick={() => toggle('price')}
            >
              {state.price ? '₽'.repeat(state.price) : 'Цена'} ▾
            </button>
            <button
              className={'chip' + (state.cuisine ? ' active' : '') + (open === 'cuisine' ? ' open' : '')}
              onClick={() => toggle('cuisine')}
            >
              {state.cuisine ? cuisineLabel : 'Кухня'} ▾
            </button>
          </>
        )}
      </div>

      {open && (
        <>
          <div className="fdrop-backdrop" onClick={() => setOpen(null)} />
          <div className="fdrop">
            {open === 'sort' &&
              (isItem ? SORTS.filter((s) => s.value !== 'distance') : SORTS).map((s) => (
                <button
                  key={s.value}
                  className={'fdrop-item' + (state.sort === s.value ? ' active' : '')}
                  onClick={() => pick({ sort: s.value })}
                >
                  {s.label}
                </button>
              ))}
            {open === 'price' &&
              PRICES.map((p) => (
                <button
                  key={p.value}
                  className={'fdrop-item' + (state.price === p.value ? ' active' : '')}
                  onClick={() => pick({ price: p.value })}
                >
                  {p.label}
                </button>
              ))}
            {open === 'cuisine' &&
              CUISINES.map((c) => (
                <button
                  key={c.value}
                  className={'fdrop-item' + (state.cuisine === c.value ? ' active' : '')}
                  onClick={() => pick({ cuisine: c.value })}
                >
                  {c.label}
                </button>
              ))}
          </div>
        </>
      )}

      {sheet && (
        <FiltersSheet
          initial={state}
          onApply={(next) => {
            onChange(next);
            setSheet(false);
          }}
          onClose={() => setSheet(false)}
        />
      )}
    </div>
  );
}

function FiltersSheet({
  initial,
  onApply,
  onClose,
}: {
  initial: FilterState;
  onApply: (next: FilterState) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<FilterState>(initial);
  const set = (p: Partial<FilterState>) => setDraft((d) => ({ ...d, ...p }));
  // Esc / Back / tap-outside closes ONLY this sheet (one step back), not the whole
  // map-browse behind it — the global stack pops the topmost layer first.
  useEscClose(onClose);

  return (
    <div className="modal-backdrop" style={{ zIndex: 80 }} onClick={onClose}>
      <div className="modal filters-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <button className="link-btn" onClick={onClose}>Закрыть</button>
          <b>Фильтры</b>
          <button className="link-btn" onClick={() => setDraft(DEFAULTS)}>Сбросить</button>
        </div>

        <div className="filters-scroll">
        <div className="section-title">Цена</div>
        <div className="opt-chips">
          {PRICES.map((p) => (
            <button
              key={p.value}
              className={'chip' + (draft.price === p.value ? ' active' : '')}
              onClick={() => set({ price: p.value })}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="section-title">Популярное</div>
        <label className="opt-row">
          <span>Открыто сейчас</span>
          <input type="checkbox" checked={draft.openNow} onChange={(e) => set({ openNow: e.target.checked })} />
        </label>

        <div className="section-title">Сортировка</div>
        {SORTS.map((s) => (
          <label key={s.value} className="opt-row">
            <span>{s.label}</span>
            <input
              type="radio"
              name="sort"
              checked={draft.sort === s.value}
              onChange={() => set({ sort: s.value })}
            />
          </label>
        ))}

        <div className="section-title">Кухня</div>
        <div className="opt-chips">
          {CUISINES.map((c) => (
            <button
              key={c.value}
              className={'chip' + (draft.cuisine === c.value ? ' active' : '')}
              onClick={() => set({ cuisine: c.value })}
            >
              {c.label}
            </button>
          ))}
        </div>
        </div>

        <div className="apply-sticky">
          <button className="btn" onClick={() => onApply(draft)}>
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}
