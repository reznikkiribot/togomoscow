import type { Listing } from '../types';
import { cuisineTags } from '../cuisine';
import { telHref, callPhone } from '../telegram';
import { useCategoryProgress } from '../categoryGate';
import { ratingsWord, openStatus } from '../plural';
import { Stars } from './Stars';
import { VenuePhoto } from './VenuePhoto';
import { NotInterested } from './NotInterested';

const TYPE_LABEL: Record<Listing['type'], string> = {
  RESTAURANT: 'Ресторан',
  DISH: 'Блюдо',
  DRINK: 'Напиток',
};

// Yelp-style list card: image banner + name/rating/meta + a Call button.
export function ListRow({
  listing,
  rank,
  favorite,
  onToggleFavorite,
  onClick,
  onTagClick,
  onNotInterested,
}: {
  listing: Listing;
  rank?: number;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  onClick?: () => void;
  onTagClick?: (tag: string) => void;
  onNotInterested?: () => void;
}) {
  const isItem = listing.type === 'DISH' || listing.type === 'DRINK';
  const { isUnlocked } = useCategoryProgress();
  // when the search matched a dish/drink this venue serves, show ITS rating here
  const matched = (listing as any).matchedItem as { name: string; rating: number | null; count: number } | undefined;
  const status = !isItem ? openStatus(listing.hours) : null;
  let tags = cuisineTags(listing.cuisine);
  // fall back to a meaningful category when no cuisine; never the generic type word
  if (tags.length === 0 && listing.category && !/ресторан|заведение|блюдо|напиток/i.test(listing.category)) {
    tags = [listing.category];
  }

  return (
    <div className="vcard">
      {onClick && (
        <button
          type="button"
          className="card-open-action"
          aria-label={`Открыть ${listing.name}`}
          onClick={onClick}
        />
      )}
      <div className="vcard-media">
        <VenuePhoto listing={listing} className="vcard-photo" />
        {onToggleFavorite && (
          <button
            className="heart"
            aria-label={favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            {favorite ? '♥' : '♡'}
          </button>
        )}
        {onNotInterested && <NotInterested onNotInterested={onNotInterested} />}
      </div>

      <div className="vcard-body">
        <div className="vcard-top">
          <div className="name">
            {rank ? `${rank}. ` : ''}
            {listing.name}
          </div>
          {listing.priceLevel ? (
            <span className="price">{'₽'.repeat(listing.priceLevel)}</span>
          ) : null}
        </div>

        {/* recommendation card → the recommended place (from recsys) */}
        {isItem && !listing.bestVenue && listing.recVenue && (
          <div className="sub" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            {listing.reviewCount === 0 ? 'Попробуйте в:' : ''}📍{listing.recVenue.name}
          </div>
        )}
        {/* no best venue yet → a random venue that serves it */}
        {isItem && !listing.bestVenue && !listing.recVenue && (listing as any).tryAt && (
          <div className="sub">
            {listing.reviewCount === 0 ? 'Попробуйте в:' : ''}📍{(listing as any).tryAt.name}
          </div>
        )}
        {/* dish/drink: «Лучшее в» is earned by ratings — zero reviews means it's
            just a place to try, not the best one */}
        {isItem && listing.bestVenue && (
          listing.reviewCount > 0 ? (
            <div className="sub" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              🏆 Лучшее в: {listing.bestVenue.name}
            </div>
          ) : (
            <div className="sub">Попробуйте в: 📍{listing.bestVenue.name}</div>
          )
        )}
        {/* searched a dish/drink → this venue shows ITS name above the rating */}
        {matched && (
          <div className="sub" style={{ color: 'var(--accent)', fontWeight: 700 }}>
            ☕ {matched.name}
          </div>
        )}
        {/* rating: the searched item's rating here (or the venue's own for items/no
            search). 5 GREY stars when there are no ratings yet. */}
        <div className="rowline">
          {(() => {
            const val = matched ? matched.rating : listing.reviewCount > 0 ? listing.avgRating : null;
            const cnt = matched ? matched.count : listing.reviewCount;
            return (
              <>
                <Stars value={val ?? 0} />
                {val != null ? (
                  <span className="cnt">
                    {val.toFixed(1)} ({cnt} {ratingsWord(cnt)})
                  </span>
                ) : (
                  <span className="cnt" style={{ color: 'var(--hint)' }}>Нет оценок</span>
                )}
              </>
            );
          })()}
        </div>

        {/* venue: location · price · open/closed — Yelp-style. No "Ресторан"/"Сеть". */}
        {!isItem && (
          <div className="sub loc-line">
            {/* a chain spans many points → no single metro; show the city instead.
                A single venue shows its nearest metro station ("м. …"). */}
            📍 {(listing.branchCount ?? 1) > 1
              ? (listing.cityLabel || 'Москва')
              : listing.metro
                ? `м. ${listing.metro}`
                : listing.cityLabel || 'Москва'}
            {listing.priceLevel ? ` · ${'₽'.repeat(listing.priceLevel)}` : ''}
            {status && (
              <>
                {' · '}
                <span style={{ color: status.open ? '#2e7d32' : 'var(--accent)', fontWeight: 700 }}>
                  {status.text}
                </span>
              </>
            )}
          </div>
        )}
        {listing.snippet && (
          <div className="card-review">
            «{listing.snippet.text.length > 120
              ? listing.snippet.text.slice(0, 120) + '…'
              : listing.snippet.text}»
          </div>
        )}
        {tags.length > 0 && (
          <div className="card-tags">
            {tags.map((t) => (
              <button
                key={t}
                className="ctag"
                onClick={(e) => {
                  e.stopPropagation(); // never open the card from a tag
                  onTagClick?.(t);
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="vcard-actions">
        {onToggleFavorite && (
          <button
            className={'fav-btn' + (favorite ? ' on' : '')}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          >
            {favorite ? '✓ Хочу попробовать' : '♡ Хочу попробовать'}
          </button>
        )}
        {listing.phone && (
          <a
            className="call-btn"
            href={telHref(listing.phone)}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); callPhone(listing.phone!, listing.name, `l_${listing.id}`); }}
          >
            📞 Позвонить
          </a>
        )}
      </div>
    </div>
  );
}
