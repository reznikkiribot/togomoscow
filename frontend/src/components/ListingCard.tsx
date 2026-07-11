import { useState } from 'react';
import type { Listing } from '../types';
import { ratingsWord } from '../plural';
import { Stars } from './Stars';
import { VenuePhoto } from './VenuePhoto';

const TYPE_LABEL: Record<Listing['type'], string> = {
  RESTAURANT: 'Ресторан',
  DISH: 'Блюдо',
  DRINK: 'Напиток',
};

export function ListingCard({
  listing,
  favorite,
  onToggleFavorite,
  onClick,
  onRate,
}: {
  listing: Listing;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  onClick?: () => void;
  onRate?: (rating: number) => void; // tap a star → ask where → fill card
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="card-wrap">
      <div className="card" onClick={onClick}>
        <div className="card-photo-wrap">
          <VenuePhoto listing={listing} className="photo" />
          {(listing as any).matchPct != null && (
            <span className="match-pct">🤖 {(listing as any).matchPct}%</span>
          )}
          {/* price on the photo (bottom-left) only when tied to a specific venue */}
          {listing.recVenue && (listing.recVenue as any).price != null && (
            <span className="newdish-price">{(listing.recVenue as any).price} ₽</span>
          )}
        </div>
        <div className="body">
          {/* "Блюдо"/"Напиток" is implied — only label real venues */}
          {listing.type === 'RESTAURANT' && (
            <span className="badge-type">{TYPE_LABEL[listing.type]}</span>
          )}
          <div className="name" style={{ marginTop: listing.type === 'RESTAURANT' ? 6 : 0 }}>
            {listing.name}
          </div>
          {(listing as any).matchedItem ? (
            // searched a dish/drink → show ITS rating at this venue (empty if none yet)
            <div className="meta best-on-card">
              {(listing as any).matchedItem.name}{' '}
              {(listing as any).matchedItem.rating != null
                ? `★ ${(listing as any).matchedItem.rating.toFixed(1)} (${(listing as any).matchedItem.count})`
                : '· пока без оценок'}
            </div>
          ) : listing.bestVenue ? (
            // where this dish/drink is rated best — right on the card face
            <div className="meta best-on-card">🏆 Лучшее в: {listing.bestVenue.name}</div>
          ) : listing.recVenue ? (
            // recommended dish "в конкретном месте" → venue name (price is on the photo)
            <div className="meta">📍 {listing.recVenue.name}</div>
          ) : (listing as any).tryAt ? (
            // no best venue → a random place that serves it
            <div className="meta">
              {listing.reviewCount === 0 ? 'Попробуйте в:' : ''}📍{(listing as any).tryAt.name}
            </div>
          ) : (
            <div className="meta">
              {listing.category && !/^(блюдо|напиток)$/i.test(listing.category) ? listing.category : ''}
              {listing.priceLevel ? ` · ${'₽'.repeat(listing.priceLevel)}` : ''}
            </div>
          )}
          {listing.type === 'RESTAURANT' && (listing.address || listing.cityLabel) && (
            <div className="meta">📍 {listing.address || listing.cityLabel}</div>
          )}
          <div className="row">
            {listing.reviewCount > 0 ? (
              <>
                <Stars value={listing.avgRating} />
                <span style={{ fontWeight: 600 }}>{listing.avgRating.toFixed(1)}</span>
                <span className="meta">({listing.reviewCount} {ratingsWord(listing.reviewCount)})</span>
              </>
            ) : (
              // consistent everywhere: 5 grey stars + "Нет оценок". When others are
              // already eyeing this card, say so — social proof beats a bare zero.
              <>
                <Stars value={0} />
                {((listing as any).wantCount ?? 0) > 0 || ((listing as any).viewCount ?? 0) > 1 ? (
                  <span className="no-rating proof">
                    {((listing as any).viewCount ?? 0) > 1 ? `👀 ${(listing as any).viewCount}` : ''}
                    {((listing as any).viewCount ?? 0) > 1 && ((listing as any).wantCount ?? 0) > 0 ? ' · ' : ''}
                    {((listing as any).wantCount ?? 0) > 0 ? `❤️ ${(listing as any).wantCount}` : ''}
                  </span>
                ) : (
                  <span className="no-rating">Нет оценок</span>
                )}
              </>
            )}
          </div>
          {/* pinned to the card bottom so every card is the same height */}
          <div className="card-foot">
            {(listing.type === 'DISH' || listing.type === 'DRINK') && onRate && (
              <div className="qr" onMouseLeave={() => setHover(0)} onClick={(e) => e.stopPropagation()}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={'qr-star' + (n <= hover ? ' on' : '')}
                    onMouseEnter={() => setHover(n)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRate(n);
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            )}
            {onToggleFavorite && (
              <button
                className={'fav-btn' + (favorite ? ' on' : '')}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
              >
                {favorite ? '✓ Хочу попробовать' : 'Хочу попробовать'}
              </button>
            )}
          </div>
        </div>
      </div>
      {onToggleFavorite && (
        <button
          className="heart"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          {favorite ? '♥' : '♡'}
        </button>
      )}
    </div>
  );
}
