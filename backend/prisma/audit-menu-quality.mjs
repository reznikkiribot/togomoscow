// Audits every menu-out JSON, including failed/empty attempts, without changing data.
// Writes a reproducible JSON + Russian Markdown report next to this script.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify, isJunk, normalizeMenuName } from './menu-import.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'menu-out');
const quantile = (sorted, q) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] : null;
const PARTIAL_SOURCE_RE = /recommendations|\/events|sailplay\/gifts|barnoe-menu|mindbox|catalog\/\*|company\.pdf|special/i;
const KNOWN_PARTIAL_DOMAINS = new Set(['bruno.lucky-group.rest', 'ilpatio.ru']);
const KNOWN_COMPACT_DOMAINS = new Set(['skuratovcoffee.ru']);
const SHARED_PRICE_DOMAINS = new Set(['thebull.ru']);
const NON_FOOD_RE = /серьг|браслет|подвеск|ожерель|бриллиант|жемчуг|кольц[оа]?[^а-яё]*(?:серебр|золот|женщ|мужчин|карат|размер)|футболк|игрушк|сертификат|мастер-класс|творческ[а-яё]* встреч|beer pong/i;
const RESIDUAL_META_RE = /(?:₽|руб\.?|\bnew\b|\[new\]|\d+(?:[.,]\d+)?\s*(?:кг|гр|г|мл|л|шт)\.?$|&#\d+;)/i;
const GLUED_RE = /\s\+\s.*\s\+\s|(?:соус|пицца|бургер).*(?:соус|пицца|бургер).*(?:соус|пицца|бургер)/i;

const files = fs.readdirSync(outDir).filter((file) => file.endsWith('.json') && file !== '_import-log.json').sort();
const menus = [];
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(outDir, file), 'utf8'));
  const items = Array.isArray(data.items) ? data.items : [];
  const testArtifact = /(?:-test|thebull-local)\.json$/i.test(file);
  const prices = items.map((item) => Number(item.price)).filter((price) => Number.isFinite(price) && price > 0).sort((a, b) => a - b);
  const median = quantile(prices, 0.5);
  const q1 = quantile(prices, 0.25);
  const q3 = quantile(prices, 0.75);
  const iqr = q1 != null && q3 != null ? Math.max(1, q3 - q1) : null;
  const findings = [];
  for (const item of items) {
    const raw = String(item.name ?? '').trim();
    const normalized = normalizeMenuName(raw);
    const type = classify(normalized).type;
    const reasons = [];
    if (!normalized || isJunk(normalized, item.price, type)) reasons.push('junk');
    if (raw !== normalized) reasons.push('needs-normalization');
    if (RESIDUAL_META_RE.test(raw)) reasons.push('metadata-in-name');
    if (GLUED_RE.test(raw)) reasons.push('possible-glue');
    if (NON_FOOD_RE.test(raw)) reasons.push('non-food');
    if ((raw.match(/[а-яёa-z]+/gi) ?? []).length > 11 || raw.length > 90) reasons.push('description-like');
    const price = Number(item.price);
    if (Number.isFinite(price) && price > 0 && iqr != null && median != null && prices.length >= 12) {
      if (price > q3 + 4 * iqr && price > median * 4) reasons.push('high-price-outlier');
      if (price < Math.max(20, q1 - 3 * iqr) && price < median / 8) reasons.push('low-price-outlier');
    }
    if (reasons.length) findings.push({ name: raw, price: item.price ?? null, reasons: [...new Set(reasons)] });
  }

  const count = items.length;
  const issueCounts = {};
  for (const finding of findings) for (const reason of finding.reasons) issueCounts[reason] = (issueCounts[reason] ?? 0) + 1;
  const reasons = [];
  const domain = data.domain ?? file.replace(/\.json$/, '');
  if (!testArtifact && count > 0 && count < 30 && !KNOWN_COMPACT_DOMAINS.has(domain)) reasons.push(`подозрительно мало позиций: ${count}`);
  if (!testArtifact && (PARTIAL_SOURCE_RE.test(String(data.source ?? '')) || KNOWN_PARTIAL_DOMAINS.has(domain))) reasons.push('источник является частичной витриной/спецменю, не полным меню');
  if (!testArtifact && count && (issueCounts['non-food'] ?? 0) / count >= 0.1) reasons.push(`не-еды: ${issueCounts['non-food']}`);
  if (!testArtifact && count && prices.length / count < 0.5 && !SHARED_PRICE_DOMAINS.has(domain)) reasons.push(`нет цен у ${count - prices.length} из ${count}`);
  if (!testArtifact && count && ((issueCounts['possible-glue'] ?? 0) > 5 || (issueCounts['description-like'] ?? 0) / count >= 0.1)) {
    reasons.push(`структурно повреждённых строк: ${(issueCounts['possible-glue'] ?? 0) + (issueCounts['description-like'] ?? 0)}`);
  }
  const cleanupReasons = [];
  if (!testArtifact && (issueCounts['junk'] ?? 0)) cleanupReasons.push(`мусорных строк: ${issueCounts['junk']}`);
  if (!testArtifact && (issueCounts['needs-normalization'] ?? 0)) cleanupReasons.push(`грязных названий: ${issueCounts['needs-normalization']}`);
  if (!testArtifact && ((issueCounts['high-price-outlier'] ?? 0) || (issueCounts['low-price-outlier'] ?? 0))) {
    cleanupReasons.push(`ценовых выбросов для ручной проверки: ${(issueCounts['high-price-outlier'] ?? 0) + (issueCounts['low-price-outlier'] ?? 0)}`);
  }
  menus.push({
    file, domain, status: data.status ?? null,
    source: data.source ?? null, count, priced: prices.length, medianPrice: median,
    testArtifact, issueCounts, reparseReasons: reasons, cleanupReasons, findings,
  });
}

const parsed = menus.filter((menu) => menu.count > 0 && !menu.testArtifact);
const reparse = parsed.filter((menu) => menu.reparseReasons.length > 0);
const cleanup = parsed.filter((menu) => menu.cleanupReasons.length > 0);
const empty = menus.filter((menu) => menu.count === 0 && !menu.testArtifact);
const report = {
  generatedAt: new Date().toISOString(),
  filesChecked: menus.length,
  parsedMenus: parsed.length,
  emptyOrFailed: empty.length,
  emptyOrFailedDomains: empty.map(({ domain, status, source }) => ({ domain, status, source })),
  testArtifacts: menus.filter((menu) => menu.testArtifact).length,
  reparse: reparse.map(({ domain, count, source, reparseReasons }) => ({ domain, count, source, reasons: reparseReasons })),
  cleanup: cleanup.map(({ domain, count, cleanupReasons }) => ({ domain, count, reasons: cleanupReasons })),
  menus,
};
fs.writeFileSync(path.join(__dirname, 'menu-quality-report.json'), JSON.stringify(report, null, 2) + '\n');

const md = [
  '# Аудит menu-out', '',
  `Проверено JSON: **${report.filesChecked}**; реально извлечённых меню: **${report.parsedMenus}**; пустых/неудачных: **${report.emptyOrFailed}**; тестовых дублей: **${report.testArtifacts}**.`, '',
  '## Требуют нового источника или перепарсинга', '',
  ...reparse.flatMap((menu) => [
    `- **${menu.domain}** — ${menu.count} поз.; ${menu.reparseReasons.join('; ')}. Источник: ${menu.source ?? 'не указан'}.`,
  ]), '',
  '## Достаточно фильтрации/нормализации без перепарсинга', '',
  ...cleanup.map((menu) => `- **${menu.domain}** — ${menu.cleanupReasons.join('; ')}.`), '',
  '## Пустые или не найденные меню', '',
  `Всего: **${empty.length}**. Полный список со статусом и источником находится в \`emptyOrFailedDomains\` JSON-отчёта.`, '',
  '## Сводка всех извлечённых меню', '',
  '| Домен | Позиций | С ценой | Медиана | Авто-флаги |',
  '|---|---:|---:|---:|---|',
  ...parsed.map((menu) => `| ${menu.domain} | ${menu.count} | ${menu.priced} | ${menu.medianPrice ?? '—'} | ${Object.entries(menu.issueCounts).map(([key, value]) => `${key}: ${value}`).join(', ') || '—'} |`),
  '',
  '> Авто-флаги — консервативная диагностика, а не разрешение менять цену. Цены в отчёте не исправляются и не выводятся из соседних строк.',
];
fs.writeFileSync(path.join(__dirname, 'menu-quality-report.md'), md.join('\n') + '\n');
console.log(JSON.stringify({ filesChecked: report.filesChecked, parsedMenus: report.parsedMenus, reparse: report.reparse }, null, 2));
