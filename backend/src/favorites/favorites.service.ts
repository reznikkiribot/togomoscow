import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { placeholderKeys } from '../stock/stock.data';
import { recordExplorationReaction } from '../common/exploration';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const favs = await this.prisma.favorite.findMany({
      where: { userId },
      include: { listing: true },
      orderBy: { createdAt: 'desc' },
    });
    const missingItemIds = favs
      .filter((f) => f.listing.type !== 'RESTAURANT' && !f.listing.photoUrl)
      .map((f) => f.listingId);
    const menuPhotos = missingItemIds.length
      ? await this.prisma.menuLink.findMany({
          where: { itemId: { in: missingItemIds }, photoUrl: { not: null } },
          select: { itemId: true, photoUrl: true },
        })
      : [];
    const photoByItem = new Map<string, string>();
    for (const link of menuPhotos) {
      if (!link.photoUrl) continue;
      const current = photoByItem.get(link.itemId);
      if (!current || link.photoUrl.startsWith('/api/files/aigen-')) {
        photoByItem.set(link.itemId, link.photoUrl);
      }
    }
    // stock fallback photo so cards aren't bare letter tiles
    return favs.map((f) => ({
      ...f,
      listing: {
        ...f.listing,
        photoUrl: f.listing.photoUrl ?? photoByItem.get(f.listingId) ?? null,
        placeholderPhoto: `/api/stock/${placeholderKeys(f.listing.type, f.listing.category, f.listing.name, f.listing.id, 1)[0]}`,
      },
    }));
  }

  async add(userId: string, listingId: string) {
    await this.prisma.favorite.upsert({
      where: { userId_listingId: { userId, listingId } },
      create: { userId, listingId },
      update: {},
    });
    void recordExplorationReaction(this.prisma, userId, listingId, 'SAVE').catch(() => {});
    return { ok: true };
  }

  async remove(userId: string, listingId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId, listingId } });
    return { ok: true };
  }
}
