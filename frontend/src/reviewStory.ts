import type { Listing } from './types';
import { shareToStory } from './telegram';
import { composeStoryImage, markStoryShared, portraitStoryFallback, storyAlreadyShared } from './storyImage';
import type { ReviewSavedMedia } from './components/ReviewForm';

/** Opens Telegram's story editor for a freshly saved dish/drink review. */
export async function shareReviewToStory(listing: Pick<Listing, 'id' | 'name' | 'type'>, media?: ReviewSavedMedia) {
  const myMedia = media?.photo ?? media?.video;
  let noStory = false;
  try { noStory = localStorage.getItem('noStoryOnReview') === '1'; } catch { /* use the default */ }
  if (!myMedia || listing.type === 'RESTAURANT' || noStory) return false;

  const caption = media?.text?.trim() || `${listing.name} — пробую в togomoscow 🍽`;
  if (!media?.photo) return shareToStory(myMedia, caption, `l_${listing.id}`);
  if (storyAlreadyShared(media.photo)) return false;

  const prebuilt = media.slides?.[media.photo];
  const url = prebuilt
    ?? (await composeStoryImage(media.photo))
    ?? (await portraitStoryFallback(media.photo));
  if (!url || !shareToStory(url, caption, `l_${listing.id}`)) return false;
  markStoryShared(media.photo);

  // A second attached photo becomes a separate story after the first editor closes.
  const second = media.photos?.[1];
  if (!second || storyAlreadyShared(second)) return true;
  let fired = false;
  const openSecond = async () => {
    if (fired) return;
    fired = true;
    document.removeEventListener('visibilitychange', onVisibility);
    const secondUrl = media.slides?.[second]
      ?? (await composeStoryImage(second))
      ?? (await portraitStoryFallback(second));
    if (secondUrl && shareToStory(secondUrl, '', `l_${listing.id}`)) markStoryShared(second);
  };
  const onVisibility = () => {
    if (document.visibilityState === 'visible') window.setTimeout(openSecond, 600);
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.setTimeout(() => {
    if (document.visibilityState === 'visible') void openSecond();
  }, 5000);
  return true;
}
