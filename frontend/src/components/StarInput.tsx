import { useRef, useState } from 'react';

// Accessible 1–5 rating: touch/click, Space/Enter, and arrow keys all work.
export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const shown = hover || value;
  const selectedButton = value > 0 ? Math.max(1, Math.min(5, Math.round(value))) : 0;
  const selectAndFocus = (next: number) => {
    const rating = Math.max(1, Math.min(5, next));
    onChange(rating);
    buttons.current[rating - 1]?.focus();
  };
  return (
    <div className="star-input" role="radiogroup" aria-label="Общая оценка" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fillPct = Math.max(0, Math.min(1, shown - (i - 1))) * 100;
        return (
          <button
            key={i}
            ref={(el) => { buttons.current[i - 1] = el; }}
            type="button"
            className="s"
            role="radio"
            aria-checked={selectedButton === i}
            aria-label={`Оценка ${i} из 5`}
            tabIndex={selectedButton === i || (selectedButton === 0 && i === 1) ? 0 : -1}
            onMouseEnter={() => setHover(i)}
            onClick={() => onChange(i)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                selectAndFocus((value || i) + 1);
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                selectAndFocus((value || i) - 1);
              } else if (e.key === 'Home') {
                e.preventDefault();
                selectAndFocus(1);
              } else if (e.key === 'End') {
                e.preventDefault();
                selectAndFocus(5);
              }
            }}
          >
            ★
            <span className="fill" style={{ width: `${fillPct}%` }}>
              ★
            </span>
          </button>
        );
      })}
    </div>
  );
}
