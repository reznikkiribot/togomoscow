import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MenuItemStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const PLATFORM_OWNER_TELEGRAM_ID = BigInt('1029738735'); // @reznik_kir1ll

export interface EditVenueDto {
  name?: string;
  description?: string;
  hours?: string;
  phone?: string;
  website?: string;
  cuisine?: string;
  priceLevel?: number;
  photoUrl?: string;
  deliveryYandex?: string;
  deliverySamokat?: string;
  deliveryVk?: string;
}

@Injectable()
export class OwnerService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- owner side ----

  private async canManageVenue(userId: string, listing: { ownerId: string | null; source: string | null }) {
    if (listing.ownerId === userId) return true;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true, role: true },
    });
    if (user?.role === Role.ADMIN) return true;
    return user?.telegramId === PLATFORM_OWNER_TELEGRAM_ID && listing.source === 'production-seed';
  }

  claim(userId: string, listingId: string, message?: string) {
    return this.prisma.ownershipClaim.upsert({
      where: { listingId_userId: { listingId, userId } },
      create: { listingId, userId, message: message ?? null },
      update: { message: message ?? null, status: 'PENDING' },
    });
  }

  myClaims(userId: string) {
    return this.prisma.ownershipClaim.findMany({
      where: { userId },
      include: { listing: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async myVenues(userId: string) {
    const owned = await this.prisma.listing.findMany({
      where: { ownerId: userId },
      orderBy: { name: 'asc' },
    });
    if (owned.length > 0) return owned;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true, role: true },
    });
    if (user?.telegramId === PLATFORM_OWNER_TELEGRAM_ID || user?.role === Role.ADMIN) {
      return this.prisma.listing.findMany({
        where: { type: 'RESTAURANT', source: 'production-seed' },
        orderBy: { name: 'asc' },
      });
    }
    return owned;
  }

  async editVenue(userId: string, listingId: string, dto: EditVenueDto) {
    const l = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!l || !(await this.canManageVenue(userId, l))) throw new ForbiddenException('Not your venue');
    const data: EditVenueDto = {
      name: dto.name,
      description: dto.description,
      hours: dto.hours,
      phone: dto.phone,
      website: dto.website,
      cuisine: dto.cuisine,
      photoUrl: dto.photoUrl,
      priceLevel: dto.priceLevel != null ? Number(dto.priceLevel) : undefined,
      deliveryYandex: dto.deliveryYandex,
      deliverySamokat: dto.deliverySamokat,
      deliveryVk: dto.deliveryVk,
    };
    (Object.keys(data) as (keyof EditVenueDto)[]).forEach(
      (k) => data[k] === undefined && delete data[k],
    );
    return this.prisma.listing.update({ where: { id: listingId }, data });
  }

  venueReviews(listingId: string) {
    return this.prisma.review.findMany({
      where: { listingId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reply(userId: string, reviewId: string, text: string) {
    const r = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { listing: true },
    });
    if (!r || !(await this.canManageVenue(userId, r.listing))) {
      throw new ForbiddenException('Not your venue');
    }
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { ownerReply: text },
    });
  }

  // ---- admin side (manual verification) ----

  pendingClaims() {
    return this.prisma.ownershipClaim.findMany({
      where: { status: 'PENDING' },
      include: { listing: true, user: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveClaim(claimId: string) {
    const c = await this.prisma.ownershipClaim.findUnique({ where: { id: claimId } });
    if (!c) throw new NotFoundException();
    await this.prisma.listing.update({
      where: { id: c.listingId },
      data: { ownerId: c.userId },
    });
    const u = await this.prisma.user.findUnique({ where: { id: c.userId } });
    if (u?.role === Role.CUSTOMER) {
      await this.prisma.user.update({ where: { id: c.userId }, data: { role: Role.OWNER } });
    }
    return this.prisma.ownershipClaim.update({
      where: { id: claimId },
      data: { status: 'APPROVED' },
    });
  }

  rejectClaim(claimId: string) {
    return this.prisma.ownershipClaim.update({
      where: { id: claimId },
      data: { status: 'REJECTED' },
    });
  }

  // ---- menu moderation (owner approves user-proposed dishes/drinks) ----

  private async assertOwner(userId: string, venueId: string) {
    const l = await this.prisma.listing.findUnique({ where: { id: venueId } });
    if (!l || !(await this.canManageVenue(userId, l))) throw new ForbiddenException('Not your venue');
  }

  async pendingItems(userId: string, venueId: string) {
    await this.assertOwner(userId, venueId);
    return this.prisma.menuLink.findMany({
      where: { venueId, status: 'PENDING' },
      include: { item: true, addedBy: true },
      orderBy: { item: { createdAt: 'desc' } },
    });
  }

  async setItemStatus(
    userId: string,
    venueId: string,
    itemId: string,
    status: MenuItemStatus,
    price?: number,
  ) {
    await this.assertOwner(userId, venueId);
    return this.prisma.menuLink.update({
      where: { venueId_itemId: { venueId, itemId } },
      data: { status, ...(price != null ? { price: Number(price) } : {}) },
    });
  }

  // ---- admin: support messages ----
  adminSupport() {
    return this.prisma.supportMessage.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---- admin: card corrections ----
  adminCorrections() {
    return this.prisma.correction.findMany({
      include: { listing: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  resolveCorrection(id: string) {
    return this.prisma.correction.delete({ where: { id } });
  }

  // ---- admin: all users who entered the bot ----
  async adminUsers() {
    const us = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { sessions: { orderBy: { startedAt: 'desc' }, take: 1 } },
    });
    return us.map((u) => {
      const s = u.sessions[0];
      return {
        id: u.id,
        firstName: u.firstName,
        username: u.username,
        telegramId: String(u.telegramId),
        role: u.role,
        createdAt: u.createdAt,
        lastSeen: u.updatedAt,
        session: s ? { startedAt: s.startedAt, endedAt: s.endedAt } : null,
      };
    });
  }

  // ---- admin menu moderation (admin can approve any venue's proposed items) ----
  adminPendingItems() {
    return this.prisma.menuLink.findMany({
      where: { status: 'PENDING' },
      include: { item: true, venue: true, addedBy: true },
      orderBy: { item: { createdAt: 'desc' } },
    });
  }

  adminSetItem(venueId: string, itemId: string, status: MenuItemStatus, price?: number) {
    return this.prisma.menuLink.update({
      where: { venueId_itemId: { venueId, itemId } },
      data: { status, ...(price != null ? { price: Number(price) } : {}) },
    });
  }

  // ---- admin COMMENT moderation (profanity/spam held instead of rejected) ----
  pendingComments() {
    return this.prisma.comment.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { id: true, firstName: true, username: true, photoUrl: true } },
        review: { select: { id: true, listing: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async moderateComment(id: string, action: 'approve' | 'reject') {
    const c = await this.prisma.comment.findUnique({ where: { id } });
    if (!c) throw new NotFoundException();
    if (action === 'reject') {
      await this.prisma.comment.delete({ where: { id } }); // replies cascade
      return { ok: true, deleted: true };
    }
    await this.prisma.comment.update({
      where: { id },
      data: { status: 'APPROVED', modReason: null },
    });
    return { ok: true };
  }

  // ---- admin review moderation (geo-unverified reviews land here) ----
  pendingReviews() {
    return this.prisma.review.findMany({
      where: { status: 'PENDING' },
      include: { user: true, listing: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async moderateReview(id: string, action: 'approve' | 'reject', price?: number) {
    const r = await this.prisma.review.findUnique({ where: { id } });
    if (!r) throw new NotFoundException();
    if (action === 'approve') {
      const attrs = (r.attributes as any) ?? {};
      // moderator may correct the price; otherwise take what the reviewer entered
      const finalPrice = price != null ? Number(price) : attrs.price != null ? Number(attrs.price) : null;
      await this.prisma.review.update({
        where: { id },
        data: {
          status: 'APPROVED',
          ...(price != null ? { attributes: { ...attrs, price: Number(price) } } : {}),
        },
      });
      // push the (corrected) price onto the venue's menu item so the card shows it
      const venueId = attrs.venueId as string | undefined;
      if (venueId && finalPrice != null) {
        await this.prisma.menuLink
          .update({
            where: { venueId_itemId: { venueId, itemId: r.listingId } },
            data: { price: finalPrice },
          })
          .catch(() => {});
      }
    } else {
      await this.prisma.review.delete({ where: { id } });
    }
    const agg = await this.prisma.review.aggregate({
      where: { listingId: r.listingId, status: 'APPROVED' },
      _avg: { rating: true },
      _count: true,
    });
    await this.prisma.listing.update({
      where: { id: r.listingId },
      data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count },
    });
    return { ok: true };
  }

  // ---- add-a-business submissions ----
  // OpenStreetMap Nominatim search (free, no key). Returns matching places.
  private async searchOsm(query: string, limit = 1): Promise<any[]> {
    try {
      const url =
        `https://nominatim.openstreetmap.org/search?format=json&namedetails=1&addressdetails=1` +
        `&limit=${limit}&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'togomoscow/1.0 (tasting club; reznik.kiri@gmail.com)' },
      });
      if (!res.ok) return [];
      return (await res.json()) as any[];
    } catch {
      return [];
    }
  }

  private static osmAddr(r: any): string | null {
    const a = r.address ?? {};
    const line = [a.road, a.house_number].filter(Boolean).join(', ');
    if (line) return line;
    return (r.display_name ?? '').split(',').slice(0, 2).join(',').trim() || null;
  }

  async submitBusiness(userId: string, dto: SubmitBusinessDto) {
    const norm = (s: string) => (s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    const city = (dto.city || (dto.country && !/росси/i.test(dto.country) ? dto.country : 'Москва')).trim();
    const groupKey = dto.name.toLowerCase().trim();

    const sub = await this.prisma.businessSubmission.create({
      data: {
        userId,
        relationship: dto.relationship === 'owner' ? 'owner' : 'customer',
        name: dto.name,
        address: dto.address ?? '',
        category: dto.category,
        phone: dto.phone ?? null,
        website: dto.website ?? null,
        notes: dto.notes ?? null,
        country: city,
      },
    });

    const makeOwner = async () => {
      if (dto.relationship !== 'owner') return;
      const u = await this.prisma.user.findUnique({ where: { id: userId } });
      if (u?.role === Role.CUSTOMER) {
        await this.prisma.user.update({ where: { id: userId }, data: { role: Role.OWNER } });
      }
    };
    const approve = () =>
      this.prisma.businessSubmission.update({ where: { id: sub.id }, data: { status: 'APPROVED' } });

    // ── case A: exact address given → single venue ──────────────────────────
    if (dto.address && dto.address.trim()) {
      const exists = await this.prisma.listing.findFirst({
        where: {
          type: 'RESTAURANT',
          name: { equals: dto.name, mode: 'insensitive' },
          address: { equals: dto.address, mode: 'insensitive' },
        },
      });
      if (exists) {
        await approve();
        return { submission: sub, auto: true, count: 0, listing: exists };
      }
      const hit =
        (await this.searchOsm(`${dto.name}, ${dto.address}, ${city}`))[0] ??
        (await this.searchOsm(`${dto.address}, ${city}`))[0];
      if (hit?.lat) {
        const listing = await this.prisma.listing.create({
          data: {
            type: 'RESTAURANT',
            name: dto.name,
            address: dto.address,
            category: dto.category,
            cuisine: dto.category,
            phone: dto.phone ?? null,
            website: dto.website ?? null,
            source: 'user',
            groupKey,
            ownerId: dto.relationship === 'owner' ? userId : null,
            lat: parseFloat(hit.lat),
            lng: parseFloat(hit.lon),
          },
        });
        await makeOwner();
        await approve();
        return { submission: sub, auto: true, count: 1, listing };
      }
      return { submission: sub, auto: false, count: 0 };
    }

    // ── case B: only a city → find ALL branches by name (chain) ─────────────
    const results = await this.searchOsm(`${dto.name}, ${city}`, 25);
    const wanted = norm(dto.name);
    // exact name match only — so we don't fabricate a venue named "Римская пицца"
    // from any nearby pizzeria. Real chains share the exact name across branches.
    const branches = results.filter(
      (r) => norm(r.namedetails?.name || (r.display_name ?? '').split(',')[0]) === wanted,
    );

    let count = 0;
    for (const b of branches.slice(0, 30)) {
      if (!b.lat) continue;
      const lat = parseFloat(b.lat);
      const lng = parseFloat(b.lon);
      // skip if we already have this branch (same chain, ~same spot)
      const near = await this.prisma.listing.findFirst({
        where: {
          groupKey,
          lat: { gte: lat - 0.0008, lte: lat + 0.0008 },
          lng: { gte: lng - 0.0008, lte: lng + 0.0008 },
        },
      });
      if (near) continue;
      await this.prisma.listing.create({
        data: {
          type: 'RESTAURANT',
          name: b.namedetails?.name || dto.name, // prefer OSM's actual name
          address: OwnerService.osmAddr(b),
          category: dto.category,
          cuisine: dto.category,
          phone: dto.phone ?? null,
          website: dto.website ?? null,
          source: 'user',
          groupKey, // shared key → shown as a chain ("N точек")
          ownerId: dto.relationship === 'owner' ? userId : null,
          lat,
          lng,
        },
      });
      count++;
    }

    if (count > 0) {
      await makeOwner();
      await approve();
      return { submission: sub, auto: true, count };
    }
    // nothing confirmed online → manual moderation in the cabinet
    return { submission: sub, auto: false, count: 0 };
  }

  mySubmissions(userId: string) {
    return this.prisma.businessSubmission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  pendingSubmissions() {
    return this.prisma.businessSubmission.findMany({
      where: { status: 'PENDING' },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async setSubmission(
    id: string,
    action: 'approve' | 'reject',
    overrides?: { name?: string; address?: string; phone?: string; category?: string; website?: string },
  ) {
    const s = await this.prisma.businessSubmission.findUnique({ where: { id } });
    if (!s) throw new NotFoundException();
    if (action !== 'approve') {
      return this.prisma.businessSubmission.update({ where: { id }, data: { status: 'REJECTED' } });
    }
    // admin can fill/fix info before approving
    const name = overrides?.name?.trim() || s.name;
    const address = overrides?.address?.trim() || s.address || null;
    const category = overrides?.category?.trim() || s.category;
    const phone = overrides?.phone?.trim() || s.phone;
    const website = overrides?.website?.trim() || s.website;
    // try to geocode the (now filled) address so the card has a map location
    const geo = address
      ? (await this.searchOsm(`${name}, ${address}, ${s.country || 'Москва'}`))[0] ??
        (await this.searchOsm(`${address}, ${s.country || 'Москва'}`))[0]
      : null;
    const listing = await this.prisma.listing.create({
      data: {
        type: 'RESTAURANT',
        name,
        address,
        category,
        cuisine: category,
        phone,
        website,
        source: 'user',
        groupKey: name.toLowerCase().trim(),
        ownerId: s.relationship === 'owner' ? s.userId : null,
        lat: geo?.lat ? parseFloat(geo.lat) : null,
        lng: geo?.lon ? parseFloat(geo.lon) : null,
      },
    });
    if (s.relationship === 'owner') {
      const u = await this.prisma.user.findUnique({ where: { id: s.userId } });
      if (u?.role === Role.CUSTOMER) {
        await this.prisma.user.update({ where: { id: s.userId }, data: { role: Role.OWNER } });
      }
    }
    await this.prisma.businessSubmission.update({ where: { id }, data: { status: 'APPROVED' } });
    return listing;
  }
}

export interface SubmitBusinessDto {
  relationship: 'customer' | 'owner';
  name: string;
  address?: string; // optional now — city is enough
  city?: string;
  category: string;
  phone?: string;
  website?: string;
  notes?: string;
  country?: string;
}
