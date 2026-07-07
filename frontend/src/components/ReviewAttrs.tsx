import { ATTR_LABEL } from '../tasting';

// Compact display of expert tasting data stored in Review.attributes:
// selected chips (grape/kind/style…) + 1–5 attribute mini-bars.
export function ReviewAttrs({ attributes }: { attributes?: Record<string, unknown> | null }) {
  if (!attributes) return null;
  const choices = (attributes.choices ?? {}) as Record<string, string[]>;
  const ratings = (attributes.ratings ?? {}) as Record<string, number>;
  const taggedUsers = (attributes.taggedUsers ?? []) as { id: string; name: string }[];

  // "Не знаю" answers carry no info — never show them
  const chips = Object.values(choices)
    .flat()
    .filter((c) => c && c !== 'Не знаю');
  const bars = Object.entries(ratings).filter(([, v]) => v > 0);

  if (chips.length === 0 && bars.length === 0 && taggedUsers.length === 0) return null;

  return (
    <div className="rev-attrs">
      {taggedUsers.length > 0 && (
        <div className="rev-tagged">👥 с {taggedUsers.map((u) => u.name).join(', ')}</div>
      )}
      {chips.length > 0 && (
        <div className="rev-attr-chips">
          {chips.map((c) => (
            <span key={c} className="rev-attr-chip">
              {c}
            </span>
          ))}
        </div>
      )}
      {bars.map(([k, v]) => (
        <div key={k} className="rev-attr-row">
          <span className="rev-attr-name">{ATTR_LABEL[k] ?? k}</span>
          <span className="rev-attr-bar">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={'rev-attr-pip' + (v >= n ? ' on' : '')} />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}
