import { useState } from 'react';

// Tappable star rating with half-star precision (tap left half = .5).
// Hovering previews the rating (desktop): hovering the 4th star lights 1–4.
export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="star-input" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fillPct = Math.max(0, Math.min(1, shown - (i - 1))) * 100;
        return (
          <span key={i} className="s">
            ★
            <span className="fill" style={{ width: `${fillPct}%` }}>
              ★
            </span>
            <span style={{ position: 'absolute', inset: 0, display: 'flex' }}>
              <span
                style={{ flex: 1 }}
                onMouseEnter={() => setHover(i - 0.5)}
                onClick={() => onChange(i - 0.5)}
              />
              <span
                style={{ flex: 1 }}
                onMouseEnter={() => setHover(i)}
                onClick={() => onChange(i)}
              />
            </span>
          </span>
        );
      })}
    </div>
  );
}
