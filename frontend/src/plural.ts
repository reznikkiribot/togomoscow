// Russian pluralization + a best-effort open/closed status from an hours string.

/** forms = [1, 2–4, 5+] → e.g. ['оценка','оценки','оценок'] */
export function pluralRu(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

/** "1 оценка", "2 оценки", "5 оценок" — the count word only (caller prepends the number). */
export const ratingsWord = (n: number) => pluralRu(n, ['оценка', 'оценки', 'оценок']);

/**
 * Best-effort open/closed status from a free-form hours string.
 * Handles "09:00-22:00", "Пн-Вс 10:00–23:00", "24/7". Uses the LAST time range as
 * "today's" (good enough for the common uniform-week case). Returns null if unparseable.
 */
export function openStatus(hours?: string | null): { open: boolean; text: string } | null {
  if (!hours) return null;
  const s = hours.trim();
  if (/24\s*\/\s*7|круглосуточ/i.test(s)) return { open: true, text: 'Открыто круглосуточно' };
  const ranges = [...s.matchAll(/(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})/g)];
  if (!ranges.length) return null;
  const r = ranges[ranges.length - 1];
  const oh = +r[1], om = +r[2], ch = +r[3], cm = +r[4];
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const openMin = oh * 60 + om;
  let closeMin = ch * 60 + cm;
  if (closeMin <= openMin) closeMin += 24 * 60; // closes after midnight
  const isOpen = (cur >= openMin && cur < closeMin) || (cur + 1440 >= openMin && cur + 1440 < closeMin);
  const pad = (h: number, m: number) => `${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return isOpen
    ? { open: true, text: `Открыто до ${pad(ch, cm)}` }
    : { open: false, text: `Закрыто · до ${pad(oh, om)}` };
}
