import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { placeholderKeys } from '../stock/stock.data';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const favs = await this.prisma.favorite.findMany({
      where: { userId },
      include: { listing: true },
      orderBy: { createdAt: 'desc' },
    });
    // stock fallback photo so cards aren't bare letter tiles
    return favs.map((f) => ({
      ...f,
      listing: {
        ...f.listing,
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
    return { ok: true };
  }

  async remove(userId: string, listingId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId, listingId } });
    return { ok: true };
  }
}
