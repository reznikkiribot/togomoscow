type MetroVenue = { metro?: string | null; metroDistance?: number | null };

function formatDistance(distance: number) {
  if (distance < 50) return '';
  const step = distance < 1_000 ? 50 : 100;
  return `${Math.round(distance / step) * step} м`;
}

export function MetroLine({ venue, className = '' }: { venue?: MetroVenue | null; className?: string }) {
  const distance = venue?.metroDistance;
  if (!venue?.metro || distance == null || distance > 3_000) return null;
  const formatted = formatDistance(distance);
  return (
    <div className={`metro-line${className ? ` ${className}` : ''}`}>
      Ⓜ {venue.metro}{formatted ? ` · ${formatted}` : ''}
    </div>
  );
}
