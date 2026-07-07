// Yelp-style rating: red rounded squares with a white star, grey when empty,
// half-filled square for fractional ratings. `size` in px (default 16).
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="stars" style={{ ['--star-size' as string]: `${size}px` }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const f = value - i;
        const cls = f >= 1 ? ' full' : f >= 0.5 ? ' half' : '';
        return (
          <span key={i} className={`star-box${cls}`}>
            ★
          </span>
        );
      })}
    </span>
  );
}
