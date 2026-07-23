import { metroColor } from '../metroColors';

type MetroVenue = { metro?: string | null; metroDistance?: number | null };

function formatDistance(distance: number) {
  if (distance < 50) return '';
  const step = distance < 1_000 ? 50 : 100;
  return `${Math.round(distance / step) * step} м`;
}

// The Ⓜ marker is tinted with the station's actual metro-line colour, so
// «Смоленская» reads dark-blue, «Кузнецкий Мост» purple, etc. Distance is the
// straight-line distance from that station to the venue.
export function MetroLine({ venue, className = '' }: { venue?: MetroVenue | null; className?: string }) {
  const distance = venue?.metroDistance;
  if (!venue?.metro || distance == null || distance > 3_000) return null;
  const formatted = formatDistance(distance);
  const color = metroColor(venue.metro);
  return (
    <div className={`metro-line${className ? ` ${className}` : ''}`}>
      <span className="metro-dot" style={{ background: color }} aria-hidden="true" />
      {venue.metro}{formatted ? ` · ${formatted}` : ''}
    </div>
  );
}
