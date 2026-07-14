import { initData } from './telegram';
import type {
  AdminChallenge,
  AdminUser,
  BusinessSubmission,
  Challenge,
  BusinessSubmissionInput,
  CheckinResult,
  Claim,
  Correction,
  Favorite,
  GeoPoint,
  Group,
  Listing,
  ListingDetail,
  ListingType,
  PendingMenuLink,
  Profile,
  PublicProfile,
  PublicUser,
  Question,
  Review,
  Specialization,
  SupportMsg,
  UserStats,
  VenueEvent,
  VoteState,
  VoteType,
} from './types';

function decodeMaybe(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function launchParam(source: string) {
  const raw = source.replace(/^[#?]/, '');
  const variants = [raw];
  const nestedQuery = raw.indexOf('?');
  if (nestedQuery >= 0) variants.push(raw.slice(nestedQuery + 1));
  for (const part of variants) {
    const value = new URLSearchParams(part).get('tgWebAppData');
    if (value) return decodeMaybe(value);
  }
  return '';
}

// Read initData LIVE on every request. If our bundle ran before Telegram injected
// initData, the imported constant would be '' forever and every call would be
// unauthenticated (e.g. favorites showing empty on a cold launch). The live value
// falls back to the import when the WebApp object isn't present (e.g. dev).
function launchInitData() {
  try {
    const direct = window.Telegram?.WebApp?.initData || initData;
    if (direct) {
      sessionStorage.setItem('tg:initData', direct);
      return direct;
    }
    const fromUrl = launchParam(location.hash) || launchParam(location.search);
    if (fromUrl) {
      sessionStorage.setItem('tg:initData', fromUrl);
      return fromUrl;
    }
    return sessionStorage.getItem('tg:initData') || '';
  } catch {
    return window.Telegram?.WebApp?.initData || initData || '';
  }
}

async function waitForLaunchInitData(timeoutMs = 1600) {
  const first = launchInitData();
  if (first) return first;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const next = launchInitData();
    if (next) return next;
  }
  return '';
}

const authHeaders = async (): Promise<Record<string, string>> => {
  const data = await waitForLaunchInitData();
  return data ? { Authorization: `tma ${data}` } : {};
};

// Header for PUBLIC endpoints: attach initData only if it's ALREADY available —
// never wait for it. The catalog/feed/search don't need auth, so the first screen
// must not sit behind the up-to-1.6s initData wait on cold mobile starts.
const instantHeaders = (): Record<string, string> => {
  const data = launchInitData();
  return data ? { Authorization: `tma ${data}` } : {};
};

// Client-side photo shrink: decode → fit into 1600px → JPEG q0.82. Falls back to
// the original file when decoding fails (odd formats) — the server still accepts it.
async function compressImage(file: File): Promise<File> {
  if (!/^image\//.test(file.type) && file.type !== '') return file;
  if (file.size < 400_000) return file; // already small — don't touch
  try {
    const bitmap = await createImageBitmap(file).catch(async () => {
      // Safari fallback: decode through an <img>
      const url = URL.createObjectURL(file);
      try {
        const img = new Image();
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
        return img as unknown as ImageBitmap;
      } finally {
        URL.revokeObjectURL(url);
      }
    });
    const w = (bitmap as any).width as number;
    const h = (bitmap as any).height as number;
    if (!w || !h) return file;
    const scale = Math.min(1, 1600 / Math.max(w, h));
    const cw = Math.round(w * scale);
    const ch = Math.round(h * scale);
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, cw, ch);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], (file.name || 'photo').replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // some endpoints (DELETE) may return empty
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

const getJson = async <T>(path: string) => http<T>(path, { headers: await authHeaders() });
// public GET: fires immediately (no initData wait) — for catalog/search/feed
const getPublic = <T>(path: string) => http<T>(path, { headers: instantHeaders() });

const postJson = async <T>(path: string, body?: unknown) =>
  http<T>(path, {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

const del = async <T>(path: string) =>
  http<T>(path, { method: 'DELETE', headers: await authHeaders() });

const patch = async <T>(path: string, body?: unknown) =>
  http<T>(path, {
    method: 'PATCH',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

export interface CreateReviewInput {
  rating: number;
  text?: string;
  attributes?: Record<string, unknown>;
  photoUrls?: string[];
  videoUrls?: string[];
  lat?: number;
  lng?: number;
}

export const api = {
  recommended: () => getPublic<Listing[]>('/listings/recommended'),
  // AI-taste-profile ranked feed (Ollama-built profile); falls back to cold-start.
  // Personalization improves WITH auth, but must never block the first screen on it.
  recsysFeed: (take = 30) => getPublic<Listing[]>(`/recsys/feed?take=${take}`),
  // find beer by the flavor/serving tags left in reviews
  beerByTags: (tags: string[]) =>
    getPublic<Listing[]>(`/listings/beer-by-tags?tags=${encodeURIComponent(tags.join(','))}`),
  topWeekly: () => getPublic<Listing[]>('/listings/top-weekly'),
  geo: () => getPublic<GeoPoint[]>('/listings/geo'),
  listings: (
    type?: ListingType,
    search?: string,
    opts?: {
      sort?: string;
      price?: number;
      openNow?: boolean;
      cuisine?: string;
      category?: string;
      take?: number;
    },
  ) => {
    const q = new URLSearchParams();
    if (type) q.set('type', type);
    if (search) q.set('search', search);
    if (opts?.sort) q.set('sort', opts.sort);
    if (opts?.price) q.set('price', String(opts.price));
    if (opts?.openNow) q.set('openNow', '1');
    if (opts?.cuisine) q.set('cuisine', opts.cuisine);
    if (opts?.category) q.set('category', opts.category);
    if (opts?.take) q.set('take', String(opts.take));
    const qs = q.toString();
    return getPublic<Listing[]>(`/listings${qs ? `?${qs}` : ''}`);
  },
  feed: () => getPublic<Review[]>('/listings/feed'),

  // venues serving a dish/drink matching the query (Блюда / Напитки search)
  venuesServing: (type: 'DISH' | 'DRINK', q?: string) =>
    getPublic<Listing[]>(`/listings/venues-serving?type=${type}${q ? `&q=${encodeURIComponent(q)}` : ''}`),
  itemSuggest: (type: 'DISH' | 'DRINK', q: string) =>
    getPublic<string[]>(`/listings/item-suggest?type=${type}&q=${encodeURIComponent(q)}`),
  searchVenues: (q: string) =>
    getPublic<Listing[]>(`/listings/search-venues?q=${encodeURIComponent(q)}`),
  searchAll: (q: string) =>
    getPublic<Listing[]>(`/listings/search-all?q=${encodeURIComponent(q)}`),
  suggest: (q: string) =>
    getPublic<{ name: string; kind: string }[]>(`/listings/suggest?q=${encodeURIComponent(q)}`),
  searchItems: (type: 'DISH' | 'DRINK', q: string) =>
    getPublic<Listing[]>(`/listings/search-items?type=${type}&q=${encodeURIComponent(q)}`),
  // real places to taste a given dish/drink (menu links + cuisine match)
  placesForItem: (id: string) => getPublic<Listing[]>(`/listings/${id}/where`),

  // Q&A (ask the community)
  questions: (listingId: string) => getPublic<Question[]>(`/listings/${listingId}/questions`),
  askQuestion: (listingId: string, text: string) =>
    postJson<Question>(`/listings/${listingId}/questions`, { text }),
  answerQuestion: (questionId: string, text: string) =>
    postJson(`/questions/${questionId}/answers`, { text }),
  listing: (id: string) => getPublic<ListingDetail>(`/listings/${id}`),
  group: (key: string, type?: ListingType) =>
    getPublic<Group>(
      `/listings/group?key=${encodeURIComponent(key)}${type ? `&type=${type}` : ''}`,
    ),

  onboarding: () => getJson<{ onboarded: boolean; preferences: { categories?: string[]; price?: number } | null }>('/me/onboarding'),
  setOnboarding: (dto: { categories: string[]; price?: number }) =>
    postJson<{ ok: boolean }>('/me/onboarding', dto),
  recommendedFor: (cats: string[]) =>
    getJson<Listing[]>(`/listings/recommended-for?cats=${encodeURIComponent(cats.join(','))}`),
  recommendedSmart: (recentCats: string[] = []) =>
    getJson<Listing[]>(
      `/listings/recommended-smart${recentCats.length ? `?recent=${encodeURIComponent(recentCats.join(','))}` : ''}`,
    ),

  profile: () => getJson<Profile>('/me/profile'),
  // gamification: unlock progress, level, achievements (+ awards new ones)
  gameState: () => getJson<import('./types').GameState>('/game/state'),
  // admin: live gamification config (values apply within 60s, no deploy)
  adminGameConfig: () => getJson<{ current: Record<string, unknown>; defaults: Record<string, unknown> }>('/admin/game/config'),
  // AI-style UX insights from behavior analytics (public read — admin-gated in UI)
  uxInsights: () => getPublic<{ sessions: number; avgSec?: number; insights: string[]; screens: { name: string; visits: number; avgSec: number; avgScroll: number | null; exitRate: number }[] }>('/health/ux-insights'),
  adminGameConfigSet: async (key: string, value: unknown) =>
    http<{ ok: boolean }>('/admin/game/config', {
      method: 'PUT',
      headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    }),
  firstTasterItems: (take = 8) => getPublic<Listing[]>(`/listings/first-taster?take=${take}`),
  firstTasterOf: (listingId: string) =>
    getPublic<{ user: { id: string; firstName?: string | null; username?: string | null }; at: string } | null>(`/game/first-taster/${listingId}`),
  stats: () => getJson<UserStats>('/me/stats'),
  specializations: () => getJson<Specialization[]>('/me/specializations'),
  tasteProfile: () => getJson<import('./types').TasteProfile>('/me/taste-profile'),
  tasteRanking: (itemId: string) =>
    getJson<import('./types').TasteRanking | null>(`/me/taste-ranking?itemId=${itemId}`),
  compare: (dto: { winnerId: string; loserId: string; reason?: string; category?: string }) =>
    postJson<{ ok: boolean }>('/me/compare', dto),
  skips: () => getJson<string[]>('/me/skips'),
  skip: (itemId: string, category?: string) =>
    postJson<{ ok: boolean }>('/me/skip', { itemId, category }),
  challenges: () => getJson<Challenge[]>('/challenges'),
  adminChallenges: () => getJson<AdminChallenge[]>('/admin/challenges'),
  createChallenge: (dto: { title: string; category?: string; target: number; days?: number }) =>
    postJson<AdminChallenge>('/admin/challenges', dto),
  deactivateChallenge: (id: string) => postJson(`/admin/challenges/${id}/deactivate`),
  myReviews: () => getJson<Review[]>('/me/reviews'),

  // social graph
  myFollowers: () => getJson<PublicUser[]>('/me/followers'),
  myFollowing: () => getJson<PublicUser[]>('/me/following'),
  userFollowers: (id: string) => getJson<PublicUser[]>(`/users/${id}/followers`),
  userFollowing: (id: string) => getJson<PublicUser[]>(`/users/${id}/following`),
  searchUsers: (q: string) => getJson<PublicUser[]>(`/users/search?q=${encodeURIComponent(q)}`),
  userProfile: (id: string) => getJson<PublicProfile>(`/users/${id}/profile`),
  followUser: (id: string) => postJson<{ ok: boolean }>(`/users/${id}/follow`),
  unfollowUser: (id: string) => del<{ ok: boolean }>(`/users/${id}/follow`),
  followingFeed: () => getJson<Review[]>('/me/following-feed'),

  // support + corrections
  support: (text: string) => postJson<{ ok: boolean }>('/support', { text }),
  sendCorrection: (listingId: string, text: string) =>
    postJson<{ ok: boolean }>(`/listings/${listingId}/correction`, { text }),
  adminUsers: () => getJson<AdminUser[]>('/admin/users'),
  adminCorrections: () => getJson<Correction[]>('/admin/corrections'),
  resolveCorrection: (id: string) => postJson(`/admin/corrections/${id}/resolve`),
  adminSupport: () => getJson<SupportMsg[]>('/admin/support'),

  // app-open sessions (for admin analytics)
  sessionStart: () => postJson<{ id: string }>('/session/start'),
  sessionEnd: (id: string) => postJson('/session/end', { id }),
  favorites: () => getJson<Favorite[]>('/me/favorites'),
  addFavorite: (id: string) => postJson<{ ok: boolean }>(`/me/favorites/${id}`),
  removeFavorite: (id: string) => del<{ ok: boolean }>(`/me/favorites/${id}`),
  createReview: (id: string, dto: CreateReviewInput) =>
    postJson<Review>(`/listings/${id}/reviews`, dto),
  deleteReview: (reviewId: string) => del<{ ok: boolean }>(`/reviews/${reviewId}`),
  vote: (reviewId: string, type: VoteType) =>
    postJson<VoteState>(`/reviews/${reviewId}/vote`, { type }),
  voteState: (reviewId: string) => getJson<VoteState>(`/reviews/${reviewId}/vote`),
  comments: (reviewId: string) =>
    getJson<import('./types').Comment[]>(`/reviews/${reviewId}/comments`),
  // add a photo to a card WITHOUT a review/rating (just the picture)
  addPhoto: (listingId: string, url: string) =>
    postJson<{ ok: boolean }>(`/listings/${listingId}/photo`, { url }),
  addComment: (reviewId: string, text: string, parentId?: string) =>
    postJson<import('./types').Comment>(`/reviews/${reviewId}/comments`, { text, parentId }),
  deleteComment: (commentId: string) => del<{ ok: boolean }>(`/comments/${commentId}`),
  // prepare a rich shareable message (photo + caption + open-app button) for a friend
  preparePost: (dto: { listingId: string; text?: string; photoUrl?: string }) =>
    postJson<{ id: string }>('/share/prepare', dto),

  // check-in (GPS proximity verified; photo feeds the venue gallery)
  checkin: (
    listingId: string,
    dto: { lat?: number; lng?: number; photoUrl?: string; note?: string },
  ) => postJson<CheckinResult>(`/listings/${listingId}/checkin`, dto),

  // link an existing dish/drink to a restaurant the user picks
  linkItemToVenue: (itemId: string, venueId: string) =>
    postJson<{ ok: boolean }>(`/listings/${itemId}/served-at`, { venueId }),

  // category unlock progress (rankings open after N reviews in a category)
  categoryProgress: () =>
    getJson<{
      threshold: number;
      total: number;
      categories: { name: string; count: number; unlocked: boolean }[];
    }>('/me/category-progress'),

  // venue events parsed from their site & Telegram channel
  events: (take = 30) => getPublic<VenueEvent[]>(`/events?take=${take}`),
  eventsFeed: (take = 24) => getPublic<VenueEvent[]>(`/events/feed?take=${take}`),
  myEvents: () => getJson<VenueEvent[]>('/events/mine'),

  // recommender: implicit-feedback logging + transparent "probability you'll like"
  logEvent: (listingId: string, type: 'OPEN' | 'VIEW' | 'SAVE') =>
    postJson('/recsys/event', { listingId, type }).catch(() => {}),
  likeProbability: (id: string) =>
    getJson<{ probability: number | null; reason: string }>(`/recsys/probability/${id}`),

  // a user proposes a dish/drink for a venue (then can review it immediately)
  addItem: (
    venueId: string,
    dto: {
      type: 'DISH' | 'DRINK';
      name: string;
      description?: string;
      photoUrl?: string;
      category?: string;
    },
  ) => postJson<Listing>(`/listings/${venueId}/items`, dto),

  // owner / business cabinet
  me: () => getJson<Profile['user']>('/me'),
  pendingMenuItems: (venueId: string) =>
    getJson<PendingMenuLink[]>(`/owner/venues/${venueId}/pending-items`),
  setMenuItem: (
    venueId: string,
    itemId: string,
    body: { status: 'APPROVED' | 'REJECTED'; price?: number },
  ) => postJson(`/owner/venues/${venueId}/items/${itemId}`, body),
  claim: (listingId: string, message?: string) =>
    postJson<Claim>(`/owner/claims/${listingId}`, { message }),
  myClaims: () => getJson<Claim[]>('/me/claims'),
  ownerVenues: () => getJson<Listing[]>('/owner/venues'),
  editVenue: (id: string, dto: Partial<Listing>) => patch<Listing>(`/owner/venues/${id}`, dto),
  venueReviews: (id: string) => getJson<Review[]>(`/owner/venues/${id}/reviews`),
  replyReview: (id: string, text: string) =>
    postJson<Review>(`/owner/reviews/${id}/reply`, { text }),

  // add a business (Yelp-style suggestion)
  submitBusiness: (dto: BusinessSubmissionInput) =>
    postJson<BusinessSubmission>('/business', dto),
  mySubmissions: () => getJson<BusinessSubmission[]>('/me/business'),
  adminBusiness: () => getJson<BusinessSubmission[]>('/admin/business'),
  setBusiness: (
    id: string,
    action: 'approve' | 'reject',
    overrides?: { name?: string; address?: string; phone?: string; category?: string },
  ) => postJson(`/admin/business/${id}/${action}`, overrides),

  // admin (manual verification)
  adminClaims: () => getJson<Claim[]>('/admin/claims'),
  approveClaim: (id: string) => postJson<Claim>(`/admin/claims/${id}/approve`),
  rejectClaim: (id: string) => postJson<Claim>(`/admin/claims/${id}/reject`),
  adminReviews: () => getJson<Review[]>('/admin/reviews'),
  moderateReview: (id: string, action: 'approve' | 'reject', price?: number) =>
    postJson(`/admin/reviews/${id}/${action}`, price != null ? { price } : {}),
  adminPendingItems: () => getJson<PendingMenuLink[]>('/admin/items'),
  adminSetItem: (venueId: string, itemId: string, body: { status: 'APPROVED' | 'REJECTED'; price?: number }) =>
    postJson(`/admin/items/${venueId}/${itemId}`, body),

  async upload(file: File): Promise<string> {
    // compress ON THE PHONE before sending: an 8MB camera shot over LTE takes
    // many seconds and aborts ("Request aborted" in multer) — a 1600px JPEG
    // (~300KB) uploads in well under a second and looks identical on cards
    const body = await compressImage(file);
    const fd = new FormData();
    fd.append('file', body, body.name);
    const res = await fetch('/api/uploads', {
      method: 'POST',
      headers: await authHeaders(),
      body: fd,
    });
    if (!res.ok) throw new Error(`upload HTTP ${res.status}`);
    const { url } = (await res.json()) as { url: string };
    return url;
  },

  // ── photo recognition ──────────────────────────────────────────────────────
  async recognize(file: File, mode = 'auto'): Promise<import('./types').RecognizeResult> {
    const body = await compressImage(file); // CLIP works on 224px crops — 1600px is plenty
    const fd = new FormData();
    fd.append('file', body, body.name);
    fd.append('mode', mode);
    const res = await fetch('/api/vision/recognize', { method: 'POST', headers: await authHeaders(), body: fd });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`recognize HTTP ${res.status}${text ? `: ${text.slice(0, 180)}` : ''}`);
    }
    return res.json();
  },
  visionFeedback: (body: {
    photoUrl?: string;
    caption?: string;
    mode?: string;
    predictedIds?: string[];
    topConfidence?: number;
    chosenId?: string;
  }) => postJson<{ ok: boolean }>('/vision/feedback', body),
  visionSimilar: (id: string) =>
    getJson<{ locked: boolean; items: Listing[] }>(`/vision/similar/${id}`),
};
