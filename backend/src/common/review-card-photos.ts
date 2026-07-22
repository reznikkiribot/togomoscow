import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

function isTrustedCardPhoto(url?: string | null): url is string {
  if (!url) return false;
  return !/(?:\/api\/stock\/|pexels|unsplash|wikimedia|pixabay|venue-stock)/i.test(url);
}

/**
 * Adds the same safe display fallback used by the feed: author's surviving
 * upload first, then an approved menu/card photo, otherwise no image at all.
 */
export async function attachReviewCardPhotos(
  prisma: PrismaService,
  uploads: UploadsService,
  reviews: any[],
) {
  if (!reviews.length) return;
  const itemIds = [...new Set(reviews.map((review) => review.listingId).filter(Boolean))] as string[];
  const links = itemIds.length
    ? await prisma.menuLink.findMany({
        where: { itemId: { in: itemIds }, status: 'APPROVED' },
        select: { itemId: true, venueId: true, photoUrl: true, refImage: true },
      })
    : [];

  const internalUrls = new Set<string>();
  const collect = (url?: string | null) => {
    if (url?.startsWith('/api/files/')) internalUrls.add(url);
  };
  for (const review of reviews) {
    for (const url of review.photoUrls ?? []) collect(url);
    collect(review.listing?.photoUrl);
  }
  for (const link of links) {
    collect(link.photoUrl);
    collect(link.refImage);
  }
  const statuses = new Map<string, 'available' | 'missing' | 'unknown'>();
  await Promise.all([...internalUrls].map(async (url) => statuses.set(url, await uploads.storedUrlStatus(url))));
  const alive = (url?: string | null) => !!url && statuses.get(url) !== 'missing';

  const byItem = new Map<string, typeof links>();
  for (const link of links) {
    const rows = byItem.get(link.itemId) ?? [];
    rows.push(link);
    byItem.set(link.itemId, rows);
  }
  for (const review of reviews) {
    review.photoUrls = (review.photoUrls ?? []).filter((url: string) => alive(url));
    if (review.photoUrls.length) {
      review.cardPhotoUrl = null;
      continue;
    }
    const venueId = (review.attributes as any)?.venueId;
    const rows = byItem.get(review.listingId) ?? [];
    const exact = rows.filter((row) => row.venueId === venueId);
    const candidates = [
      ...exact.flatMap((row) => [row.photoUrl, row.refImage]),
      review.listing?.photoUrl,
      ...rows.flatMap((row) => [row.photoUrl, row.refImage]),
    ];
    review.cardPhotoUrl = candidates.find((url) => isTrustedCardPhoto(url) && alive(url)) ?? null;
  }
}
