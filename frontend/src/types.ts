export type ListingType = 'RESTAURANT' | 'DISH' | 'DRINK';

export interface Amenities {
  accessibility?: string[];
  payments?: string[];
  features?: string[];
  diet?: string[];
}

export interface Listing {
  id: string;
  type: ListingType;
  name: string;
  description?: string | null;
  category?: string | null;
  address?: string | null;
  photoUrl?: string | null;
  photos?: string[] | null; // accumulating gallery (card + review uploads)
  priceLevel?: number | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  website?: string | null;
  brand?: string | null;
  hours?: string | null;
  cuisine?: string | null;
  groupKey?: string | null;
  amenities?: Amenities | null;
  branchCount?: number; // >1 means it's a chain (set by grouped search)
  deliveryYandex?: string | null;
  deliverySamokat?: string | null;
  deliveryVk?: string | null;
  avgRating: number;
  reviewCount: number;
  snippet?: { text: string; rating: number } | null; // one review shown on cards
  bestVenue?: { name: string; rating: number } | null; // for dish/drink: best place to have it
  recVenue?: { id: string; name: string; price?: number | null } | null; // recommended place (+ its price for this item)
  recReason?: string; // why recommended (taste match) — shown on feed rec cards
  matchPct?: number; // % taste match (unlocked after 10 ratings)
  placeholderPhoto?: string | null; // stock photo when no real photo
  cityLabel?: string; // shown when there's no street address yet
  metro?: string | null; // nearest metro station → "м. …"
}

export interface Branch {
  id: string;
  name: string;
  address?: string | null;
  lat: number | null;
  lng: number | null;
  avgRating: number;
  reviewCount: number;
  type: ListingType;
  photoUrl?: string | null;
  website?: string | null;
}

export interface Group {
  key: string;
  name: string;
  type: ListingType;
  website?: string | null;
  branchCount: number;
  avgRating: number;
  reviewCount: number;
  branches: Branch[];
}

export interface GeoPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: ListingType;
}

export interface ReviewUser {
  id: string;
  firstName?: string | null;
  username?: string | null;
  photoUrl?: string | null;
}

export interface Review {
  id: string;
  listingId: string;
  rating: number;
  text?: string | null;
  attributes?: Record<string, unknown> | null;
  photoUrls: string[];
  videoUrls?: string[];
  createdAt: string;
  status?: 'PENDING' | 'APPROVED';
  ownerReply?: string | null;
  listing?: Listing;
  venue?: { id: string | null; name: string } | null; // for dish/drink reviews: where it's served
  user?: ReviewUser;
  voteCounts?: { USEFUL: number; FUNNY: number; COOL: number; OHNO: number };
  commentCount?: number;
  topComment?: Comment | null;
}

// bell / notification-center item
export interface AppNotification {
  id: string;
  kind: 'vote' | 'comment' | 'follow' | 'friend_post';
  text: string;
  actorId?: string | null;
  actorName?: string | null;
  reviewId?: string | null;
  listingId?: string | null;
  listingName?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export type VoteType = 'USEFUL' | 'FUNNY' | 'COOL' | 'OHNO';
export interface VoteState {
  counts: { USEFUL: number; FUNNY: number; COOL: number; OHNO: number };
  mine: VoteType[];
}

export interface ListingDetail extends Listing {
  openNow?: boolean | null;
  links?: { website?: string | null; telegram?: string | null; vk?: string | null };
  reviews: Review[];
  topDishes: Listing[];
  topDrinks: Listing[];
  venues: Listing[];
  pendingItems: Listing[];
  chain?: { avgRating: number; reviewCount: number; branchCount: number } | null;
  branches?: {
    id: string;
    name: string;
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
    avgRating: number;
    reviewCount: number;
  }[];
  tags?: string[];
  cityLabel?: string | null;
  summary?: string | null;
  checkinCount?: number;
  checkinPhotos?: string[];
  placeholderPhotos?: string[]; // illustrative stock, shown only when no real photos
  featuredReview?: {
    text: string;
    rating: number;
    user?: ReviewUser;
    venue?: { id: string | null; name: string } | null;
  } | null;
  tastedAt?: (Listing & { pending?: boolean; menuPrice?: number | null })[];
  bestVenue?: { name: string; rating: number; count: number } | null;
  events?: VenueEvent[];
  similar?: Listing[];
}

export interface VenueEvent {
  id: string;
  venueId: string;
  kind: 'dish' | 'schedule';
  title?: string | null;
  text?: string | null;
  price?: number | null;
  photoUrl?: string | null;
  url?: string | null;
  source: string;
  publishedAt: string;
  venue?: { id: string; name: string; photoUrl?: string | null; category?: string | null; address?: string | null };
}

export interface CheckinResult {
  id: string;
  verified: boolean;
  distance: number | null;
  radius: number;
}

export interface PendingMenuLink {
  venueId: string;
  itemId: string;
  status: string;
  price?: number | null;
  item: Listing;
  venue?: { id: string; name: string } | null;
  addedBy?: { firstName?: string | null; username?: string | null } | null;
}

export interface RecognizeCandidate {
  id: string;
  type: string;
  name: string;
  photoUrl: string | null;
  avgRating: number;
  reviewCount: number;
  confidence: number; // 0..1
}
export interface RecognizeResult {
  caption: string;
  mode: string;
  candidates: RecognizeCandidate[];
  autoOpen: boolean;
  topConfident?: boolean; // AI is >0.9 sure of the top match (pre-highlight, still confirm)
  diagnostic?: string;
  labelText?: string; // wine/beer label brand read by OCR (Vivino-style)
}

export interface Favorite {
  listingId: string;
  createdAt: string;
  listing: Listing;
}

export interface Profile {
  user: {
    id: string;
    telegramId?: string;
    firstName?: string | null;
    username?: string | null;
    photoUrl?: string | null;
    role?: 'CUSTOMER' | 'OWNER' | 'ADMIN';
  };
  counts: {
    reviews: number;
    followers: number;
    following: number;
    favorites: number;
  };
}

export interface Answer {
  id: string;
  text: string;
  createdAt: string;
  user?: ReviewUser;
}
export interface Question {
  id: string;
  text: string;
  createdAt: string;
  user?: ReviewUser;
  answers: Answer[];
}

export interface BusinessSubmissionInput {
  relationship: 'customer' | 'owner';
  name: string;
  address?: string; // optional — city is enough
  city?: string;
  category: string;
  phone?: string;
  website?: string;
  notes?: string;
  country?: string;
}
export interface BusinessSubmission extends BusinessSubmissionInput {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user?: { firstName?: string | null; username?: string | null };
}

export interface PublicUser {
  id: string;
  firstName?: string | null;
  username?: string | null;
  photoUrl?: string | null;
  reviews: number;
  followers: number;
  following: number;
  isFollowing: boolean;
  isMe: boolean;
}
export interface PublicProfile extends PublicUser {
  reviewList: Review[];
}

export interface AdminUser {
  id: string;
  firstName?: string | null;
  username?: string | null;
  telegramId: string;
  role: string;
  createdAt: string;
  lastSeen?: string;
  session?: { startedAt: string; endedAt?: string | null } | null;
}
export interface SupportMsg {
  id: string;
  text: string;
  createdAt: string;
  user?: { firstName?: string | null; username?: string | null; telegramId?: string };
}
export interface Correction {
  id: string;
  text: string;
  createdAt: string;
  listing?: Listing;
  user?: { firstName?: string | null; username?: string | null };
}

export interface UserStats {
  total: number;
  streak: number;
  ratedToday: boolean;
  todayCount: number;
  dailyGoal: number;
  level: string;
  nextAt: number | null;
  badges: { id: string; label: string; icon: string; earned: boolean }[];
}

export interface Specialization {
  id: string;
  label: string;
  icon: string;
  count: number;
  tier: string | null;
  next: number | null;
  earned: boolean;
  unlocked: boolean; // category reached the 5-review threshold
}

export interface TasteRanking {
  category: string;
  rank: number;
  total: number;
  thisRating: number | null;
  thisName: string;
  delta: number | null;
  top: { id: string; name: string; rating: number }[];
  next: { id: string; name: string } | null;
  compareWith: { id: string; name: string } | null;
}

export interface Comment {
  id: string;
  reviewId: string;
  userId: string;
  parentId: string | null;
  text: string;
  createdAt: string;
  user?: ReviewUser;
}

export interface TasteProfile {
  total: number;
  avg?: number;
  favorite?: { name: string; count: number; avg: number } | null;
  topCategories?: { name: string; count: number; avg: number }[];
  loves?: string[];
  best?: { name: string; rating: number } | null;
  categoriesTried?: number;
}

export interface Challenge {
  id: string;
  title: string;
  target: number;
  endsAt: string;
  progress: number;
  done: boolean;
}
export interface AdminChallenge {
  id: string;
  title: string;
  category?: string | null;
  target: number;
  endsAt: string;
  active: boolean;
}

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export interface Claim {
  id: string;
  listingId: string;
  status: ClaimStatus;
  message?: string | null;
  createdAt: string;
  listing?: Listing;
  user?: { id: string; firstName?: string | null; username?: string | null; telegramId?: string };
}

// ===== gamification =====
export interface GameUnlock {
  key: string; title: string; icon: string; need: number; metric: string;
  teaser: string; have: number; unlocked: boolean;
}
export interface GameAchievement {
  key: string; title: string; icon: string; metric: string; need: number;
  have: number; earned: boolean;
}
export interface GameState {
  counters: Record<string, number>;
  level: { key: string; title: string; icon: string; need: number; nextAt: number | null; nextTitle: string | null };
  unlocks: GameUnlock[];
  achievements: GameAchievement[];
  justEarned: string[];
}
