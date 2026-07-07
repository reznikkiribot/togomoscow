import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SheetRow {
  id: string;
  name?: string;
  category?: string;
  address?: string;
  phone?: string;
  website?: string;
  telegram?: string; // handle or t.me link
  vk?: string; // handle or vk.com link
  menu?: string; // "Капучино|200|DRINK" per line
}

@Injectable()
export class SheetService {
  constructor(private readonly prisma: PrismaService) {}

  /** All venues as flat rows for the Google Sheet (paginated). */
  async exportRows(offset = 0, limit = 1000) {
    const venues = await this.prisma.listing.findMany({
      where: { type: 'RESTAURANT' },
      orderBy: { name: 'asc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        name: true,
        category: true,
        address: true,
        phone: true,
        website: true,
        sources: { select: { type: true, handle: true, url: true } },
      },
    });
    return venues.map((v) => ({
      id: v.id,
      name: v.name,
      category: v.category ?? '',
      address: v.address ?? '',
      phone: v.phone ?? '',
      website: v.website ?? '',
      telegram: v.sources.find((s) => s.type === 'telegram')?.handle ?? '',
      vk: v.sources.find((s) => s.type === 'vk')?.handle ?? '',
    }));
  }

  private handleFrom(raw: string, re: RegExp): string | null {
    const s = raw.trim().replace(/^@/, ''); // accept "@channel" form too
    const m = raw.match(re);
    if (m) return m[1].toLowerCase();
    if (/^[A-Za-z0-9_.]{3,}$/.test(s)) return s.toLowerCase();
    return null;
  }

  /** Apply one edited row from the sheet: update the venue + its sources + menu. */
  async sync(row: SheetRow) {
    const v = await this.prisma.listing.findUnique({ where: { id: row.id } });
    if (!v) return { ok: false, reason: 'venue not found' };

    const data: any = {};
    if (row.name && row.name !== v.name) data.name = row.name.trim();
    if (row.category) data.category = row.category.trim();
    if (row.address) data.address = row.address.trim();
    if (row.phone) data.phone = row.phone.trim();
    if (row.website) data.website = row.website.trim();
    if (Object.keys(data).length) await this.prisma.listing.update({ where: { id: v.id }, data });

    const sources: { type: string; url: string; handle: string | null }[] = [];
    if (row.website?.trim()) sources.push({ type: 'website', url: row.website.trim(), handle: null });
    if (row.telegram?.trim()) {
      const h = this.handleFrom(row.telegram.trim(), /t\.me\/(?:s\/)?([A-Za-z0-9_]{4,})/i);
      if (h) sources.push({ type: 'telegram', url: `https://t.me/${h}`, handle: h });
    }
    if (row.vk?.trim()) {
      const h = this.handleFrom(row.vk.trim(), /vk\.com\/([A-Za-z0-9_.]{3,})/i);
      if (h) sources.push({ type: 'vk', url: `https://vk.com/${h}`, handle: h });
    }
    for (const s of sources) {
      await this.prisma.venueSource.upsert({
        where: { venueId_type: { venueId: v.id, type: s.type } },
        create: { venueId: v.id, type: s.type, url: s.url, handle: s.handle, status: 'active' },
        update: { url: s.url, handle: s.handle, status: 'active' },
      });
    }

    let menuAdded = 0;
    if (row.menu?.trim()) menuAdded = await this.syncMenu(v.id, row.menu);

    return { ok: true, updated: Object.keys(data), sources: sources.map((s) => s.type), menuAdded };
  }

  /** Menu cell: lines "Name|Price|TYPE" (TYPE = DISH|DRINK, default DISH). */
  private async syncMenu(venueId: string, menu: string) {
    let n = 0;
    for (const line of menu.split(/[\n;]+/)) {
      const [nameRaw, priceRaw, typeRaw] = line.split('|').map((x) => (x ?? '').trim());
      if (!nameRaw) continue;
      const type = /drink|напит/i.test(typeRaw ?? '') ? 'DRINK' : 'DISH';
      const price = priceRaw ? Number(priceRaw.replace(/[^\d]/g, '')) : null;
      const item = await this.prisma.listing.upsert({
        where: { source_externalId: { source: 'sheet', externalId: `${venueId}:${nameRaw.toLowerCase()}` } },
        create: {
          type: type as any,
          name: nameRaw,
          category: type === 'DRINK' ? 'Напиток' : 'Блюдо',
          groupKey: nameRaw.toLowerCase(),
          source: 'sheet',
          externalId: `${venueId}:${nameRaw.toLowerCase()}`,
        },
        update: {},
      });
      await this.prisma.menuLink.upsert({
        where: { venueId_itemId: { venueId, itemId: item.id } },
        create: { venueId, itemId: item.id, status: 'APPROVED', ...(price ? { price } : {}) },
        update: price ? { price } : {},
      });
      n++;
    }
    return n;
  }
}
