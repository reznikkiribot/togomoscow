// Human-readable Russian labels for everything the admin cabinet shows.
// The backend speaks in snake_case codes (fraud flags, location/photo statuses,
// live-config keys); the cabinet must not — owner rule: «Сделай в кабинете всё
// понятным. Без терминов. Всё на русском!»
// An unknown code falls back to itself, so a new backend signal is still visible.

const FRAUD_FLAGS: Record<string, string> = {
  repeated_identical_ratings: 'Одинаковые оценки подряд',
  location_too_far: 'Слишком далеко от заведения',
  location_missing: 'Геопозиция не передана',
  low_location_accuracy: 'Неточная геопозиция',
  impossible_travel: 'Нереальная скорость перемещения',
  excessive_review_velocity: 'Слишком много оценок за короткое время',
  duplicate_photo: 'Повтор того же фото',
  similar_photo: 'Похожее фото',
  reused_photo_across_accounts: 'Фото используется с других аккаунтов',
  similar_review_text: 'Похожий текст отзыва',
  linked_accounts: 'Связанные аккаунты',
  suspicious_device: 'Подозрительное устройство',
  ai_content_mismatch: 'Фото не совпадает с блюдом',
  manual_violation: 'Отмечено вручную как нарушение',
};

const SEVERITY: Record<string, string> = {
  low: 'слабый сигнал',
  medium: 'средний сигнал',
  high: 'сильный сигнал',
  critical: 'критично',
};

const LOCATION_STATUS: Record<string, string> = {
  confirmed: 'подтверждена на месте',
  location_confirmed: 'подтверждена на месте',
  probable: 'скорее всего на месте',
  location_probable: 'скорее всего на месте',
  not_confirmed: 'не подтверждена',
  unavailable: 'нет доступа к геопозиции',
  unknown: 'неизвестно',
  legacy: 'старая дегустация (без гео)',
};

const PHOTO_SOURCE: Record<string, string> = {
  camera: 'снято на камеру',
  gallery: 'из галереи',
  none: 'без фото',
  unknown: 'неизвестно',
};

const TRUST_LEVEL: Record<string, string> = {
  trusted: 'доверенный',
  unverified: 'без подтверждения',
  under_review: 'на проверке',
  excluded_from_rating: 'исключён из рейтинга',
};

/** Live-config keys (game_config) → what the admin actually edits there. */
const CONFIG_KEYS: Record<string, string> = {
  quality: 'Что считается качественной дегустацией',
  unlocks: 'Что открывается по мере дегустаций',
  levels: 'Уровни дегустатора',
  achievements: 'Достижения',
  specializations: 'Звания по категориям',
  discovery: 'Первооткрыватели блюд',
  home: 'Настройки главного экрана',
  recsysExploration: 'Показ незнакомых категорий в рекомендациях',
  goalRanking: 'Персональные цели: веса и лимиты показа',
  goalTemplates: 'Тексты персональных целей',
};

const dict = (map: Record<string, string>) => (code?: string | null) =>
  (code && map[code]) || code || '—';

export const fraudFlagLabel = dict(FRAUD_FLAGS);
export const severityLabel = dict(SEVERITY);
export const locationStatusLabel = dict(LOCATION_STATUS);
export const photoSourceLabel = dict(PHOTO_SOURCE);
export const trustLevelLabel = dict(TRUST_LEVEL);
export const configKeyLabel = dict(CONFIG_KEYS);

/** Distance in metres → «250 м» / «5,4 км», because «556030 м» reads as noise. */
export function distanceLabel(metres?: number | null): string | null {
  if (metres == null || !Number.isFinite(metres)) return null;
  if (metres < 1000) return `${Math.round(metres)} м`;
  return `${(metres / 1000).toFixed(1).replace('.', ',')} км`;
}

/** Rating weight 0..1 → plain words instead of a bare number. */
export function weightLabel(weight?: number | null): string {
  if (weight == null || !Number.isFinite(weight)) return 'не задан';
  if (weight <= 0) return 'не влияет на рейтинг';
  if (weight >= 1) return 'полный вес';
  return `вес ${Math.round(weight * 100)}%`;
}

/**
 * A tracked tap is stored as a CSS-ish selector + label («button.acc-head
 * «Комментарии▾»»). Show only the human label the user actually saw.
 */
export function tapLabel(raw: string): string {
  const quoted = raw.match(/[«"]([^»"]+)[»"]/);
  const text = (quoted?.[1] ?? raw.replace(/^[a-z]+(\.[\w-]+)*\s*/i, '')).trim();
  return (text || raw).replace(/[▾▴]/g, '').trim();
}
