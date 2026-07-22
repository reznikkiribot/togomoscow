import { Prisma } from '@prisma/client';

// Public card payloads deliberately exclude text/image embeddings. Selecting the
// scalar fields explicitly prevents a future serializer regression from sending
// thousands of model floats per listing.
export const PUBLIC_LISTING_SELECT = {
  id: true,
  type: true,
  name: true,
  aliases: true,
  description: true,
  category: true,
  address: true,
  photoUrl: true,
  photos: true,
  priceLevel: true,
  lat: true,
  lng: true,
  metro: true,
  metroDistance: true,
  phone: true,
  website: true,
  brand: true,
  hours: true,
  cuisine: true,
  groupKey: true,
  amenities: true,
  deliveryYandex: true,
  deliverySamokat: true,
  deliveryVk: true,
  ownerId: true,
  parentId: true,
  avgRating: true,
  reviewCount: true,
  ratingWeightSum: true,
  views: true,
  createdAt: true,
} as const satisfies Prisma.ListingSelect;
