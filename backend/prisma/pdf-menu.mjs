// Extracts official PDF menus using the PDF text layer and its coordinates.
// Physical columns are parsed independently so rows from opposite columns can
// never be glued into one catalog item.
//   node prisma/pdf-menu.mjs <domain> <pdf-url-or-local-path>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRICE_RE = /(?<!\d)(\d{2,5})(?:[.,]\d{1,2})?\s*(?:₽|руб(?:\.|лей|ля)?|р\.?(?=\s|$))/giu;
const AMOUNT_RE = /(?<!\d)\d+(?:[.,]\d+)?(?:\s*[/xх×]\s*\d+(?:[.,]\d+)?)*\s*(?:литр(?:а|ов)?|кг|гр|мл|шт(?:ук(?:а|и)?)?|ml|cl|kg|oz|г|л|g|l)\.?/giu;
const VOLUME_RE = /(?<![\dа-яёa-z])(\d+(?:[.,]\d+)?)\s*(мл|литр(?:а|ов)?|л)\.?/giu;
const BOILERPLATE_RE = /аллерги|предупредите официанта|время сервиса|в сыром виде|все цены|правилами ресторана|уголке потребителя|для наших новостей|рекомендуемая прожарка|осторожно|могут попадаться|дата публикации|per mangiare|заказать|форлабланка|кассов|qr|кьюар/i;
const MERCH_RE = /значок|носки|пиво\s*$|бейсболк|стикер|мерч|бутылка\s+1\s*литр/i;
const SECTION_RE = /^(?:закуски|салаты|римская пицца|бургеры|супы|хлеб|гарниры|разное|десерты|соусы|лимонады|прохладительные напитки|пиво|the бык|вино б\/а|согревающие напитки|чай|кофе и кофейные напитки|кофе на альтернативном молоке|бабл ти|пробковый сбор|prime|хоспер|дневное предложение|основное меню|альтернативные стейки)$/iu;

function cleanText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\u00a0/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s*[·•]\s*/g, ' ')
    .replace(/\bne\s+w\b/giu, 'NEW')
    // This font occasionally exposes the final glyph as a separate text item.
    .replace(/индейк\s+и(?![а-яёa-z0-9])/giu, 'индейки')
    .replace(/(?<!\d)(?:\d\s+){2,}\d(?!\d)/g, (digits) => digits.replace(/\s+/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
}

function uppercaseRatio(value) {
  const letters = value.match(/[а-яёa-z]/giu) ?? [];
  if (!letters.length) return 0;
  const upper = letters.filter((letter) => letter === letter.toLocaleUpperCase('ru-RU')).length;
  return upper / letters.length;
}

function sentenceCaseAllCaps(value) {
  // Some PDFs expose visually-capitalized glyphs with a few lowercase Unicode
  // codepoints, so a strict 100% uppercase check leaves noisy mixed casing.
  if (uppercaseRatio(value) < 0.58) return value;
  const abbreviations = new Set(['BBQ', 'IPA', 'NY', 'Б/А']);
  let started = false;
  return value.replace(/[а-яёa-z]+/giu, (word) => {
    if (abbreviations.has(word)) {
      started = true;
      return word;
    }
    const lower = word.toLocaleLowerCase('ru-RU');
    if (started) return lower;
    started = true;
    return lower[0].toLocaleUpperCase('ru-RU') + lower.slice(1);
  });
}

function joinFragments(fragments) {
  let value = '';
  let right = null;
  for (const fragment of [...fragments].sort((a, b) => a.x - b.x)) {
    const raw = String(fragment.text ?? '').replace(/[\r\n]+/g, ' ');
    const normalized = raw.replace(/\s+/g, ' ');
    if (!normalized.trim()) {
      if (value && !value.endsWith(' ')) value += ' ';
      right = Math.max(right ?? fragment.x, fragment.x + (fragment.width || 0));
      continue;
    }
    const gap = right == null ? 0 : fragment.x - right;
    if (value && !value.endsWith(' ') && !/^[,.;:!?%)\/]/u.test(normalized) && gap > 2) value += ' ';
    value += normalized;
    right = Math.max(right ?? fragment.x, fragment.x + (fragment.width || 0));
  }
  return cleanText(value).replace(/\s+([,.;:!?%])/g, '$1');
}

function groupRows(fragments) {
  const rows = [];
  for (const fragment of [...fragments].sort((a, b) => a.y - b.y || a.x - b.x)) {
    if (!fragment.text?.trim() && !String(fragment.text ?? '').includes(' ')) continue;
    const tolerance = Math.max(1.25, Math.min(2.5, (fragment.height || 10) * 0.18));
    let row = rows.findLast((candidate) => Math.abs(candidate.y - fragment.y) <= tolerance);
    if (!row) {
      row = { y: fragment.y, fragments: [] };
      rows.push(row);
    }
    row.fragments.push(fragment);
    row.y = row.fragments.reduce((sum, item) => sum + item.y, 0) / row.fragments.length;
  }
  return rows.sort((a, b) => a.y - b.y);
}

function hasTwoColumns(rows, pageWidth) {
  const middle = pageWidth / 2;
  let separatedRows = 0;
  for (const row of rows) {
    const visible = row.fragments.filter((fragment) => fragment.text?.trim()).sort((a, b) => a.x - b.x);
    const left = visible.filter((fragment) => fragment.x + fragment.width <= middle - 3);
    const right = visible.filter((fragment) => fragment.x >= middle + 3);
    if (!left.length || !right.length) continue;
    const leftEdge = Math.max(...left.map((fragment) => fragment.x + fragment.width));
    const rightEdge = Math.min(...right.map((fragment) => fragment.x));
    const leftmost = Math.min(...visible.map((fragment) => fragment.x));
    const rightmost = Math.max(...visible.map((fragment) => fragment.x + fragment.width));
    if (rightEdge - leftEdge >= 20 && leftmost < middle - 80 && rightmost > middle + 80) separatedRows++;
  }
  return separatedRows >= 5;
}

/** Convert positioned PDF.js fragments into top-to-bottom column streams. */
export function buildColumnLines(page) {
  const rows = groupRows(page.fragments);
  if (!hasTwoColumns(rows, page.width)) {
    return [{ page: page.number, column: 0, lines: rows.map((row) => joinFragments(row.fragments)).filter(Boolean) }];
  }

  const middle = page.width / 2;
  const columns = [[], []];
  for (const row of rows) {
    for (let column = 0; column < 2; column++) {
      const fragments = row.fragments.filter((fragment) => {
        const center = fragment.x + fragment.width / 2;
        return column === 0 ? center < middle : center >= middle;
      });
      const text = joinFragments(fragments);
      if (text) columns[column].push(text);
    }
  }
  const rightWithPrices = columns[1].filter((line) => extractPrices(line).length > 0).length;
  const isPriceGutter = columns[1].length >= 5 && rightWithPrices / columns[1].length >= 0.65;
  if (isPriceGutter) {
    return [{ page: page.number, column: 0, lines: rows.map((row) => joinFragments(row.fragments)).filter(Boolean) }];
  }
  return columns.map((lines, column) => ({ page: page.number, column, lines }));
}

function trailingPlainPrice(line) {
  const match = line.match(/^(\d{2,5})$/u) ?? line.match(/(?:\.{2,}|\s)(\d{2,5})\s*$/u);
  if (!match) return null;
  const price = Number.parseInt(match[1], 10);
  if (price < 50 || price > 20000 || (price >= 1900 && price <= 2100)) return null;
  return price;
}

function extractPrices(line) {
  const prices = [...line.matchAll(PRICE_RE)]
    .map((match) => Number.parseInt(match[1], 10))
    .filter((price) => price >= 50 && price <= 20000);
  if (prices.length) return prices;

  // Some official PDFs omit the currency sign but keep a final price cell.
  // Never treat a size as a price, and never infer a number not present in text.
  const plain = trailingPlainPrice(line);
  if (plain != null) return [plain];
  return [];
}

function extractVolumes(line) {
  return [...line.matchAll(VOLUME_RE)].map((match) => `${match[1].replace('.', ',')} ${match[2].toLocaleLowerCase('ru-RU')}`);
}

function titleLike(name) {
  const words = name.match(/[а-яёa-z]+/giu) ?? [];
  if (!words.length || words.length > 12 || name.length > 100) return false;
  if (uppercaseRatio(name) >= 0.58) return true;
  if (/^(?:19|20)\d{2}\s+[А-ЯЁA-Z]/u.test(name)) return true;
  return /^[«"']?[А-ЯЁA-Z]/u.test(name);
}

function isSection(line) {
  const clean = cleanText(line).replace(/^new\s+/iu, '').replace(/[—–-]+\s*\d.*$/u, '').trim();
  if (SECTION_RE.test(clean)) return true;
  if (/:$/u.test(clean) && titleLike(clean.replace(/:$/u, ''))) return true;
  AMOUNT_RE.lastIndex = 0;
  PRICE_RE.lastIndex = 0;
  const hasAmount = AMOUNT_RE.test(clean);
  const hasPrice = PRICE_RE.test(clean);
  AMOUNT_RE.lastIndex = 0;
  PRICE_RE.lastIndex = 0;
  return uppercaseRatio(clean) >= 0.88 && clean.split(/\s+/).length <= 5 && !hasAmount && !hasPrice;
}

export function parseCandidate(rawLine) {
  const line = cleanText(rawLine);
  if (!line || BOILERPLATE_RE.test(line)) return null;

  PRICE_RE.lastIndex = 0;
  AMOUNT_RE.lastIndex = 0;
  const prices = extractPrices(line);
  PRICE_RE.lastIndex = 0;
  AMOUNT_RE.lastIndex = 0;
  const amounts = [...line.matchAll(AMOUNT_RE)].map((match) => cleanText(match[0]));
  if (!amounts.length && !prices.length) return null;

  const volumes = extractVolumes(line);
  const plainPrice = trailingPlainPrice(line);
  let name = line
    .replace(/\b(?:new|hit|хит)\b\s*/giu, ' ')
    .replace(PRICE_RE, ' ')
    .replace(AMOUNT_RE, ' ')
    .replace(/цена\s+за/giu, ' ')
    .replace(/\*+/g, ' ')
    .replace(/(?:\s*[/|—–-]\s*)+$/u, ' ')
    .replace(/^(?:\s*[/|—–-]\s*)+/u, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (plainPrice != null) {
    name = name
      .replace(/(?:\.{2,}|\s)\d{2,5}\s*$/u, '')
      .replace(/(?:\s*[/|—–-]\s*)+$/u, '')
      .trim();
  }
  name = name
    .replace(/\s+(?:France|Italy|Germany)(?:\s*,.*)?$/iu, '')
    .replace(/(?:,?\s*\d+(?:[.,]\d+)?%)\s*$/u, '')
    .replace(/(?<=[а-яё])\d$/iu, '')
    .trim();

  if (!name || SECTION_RE.test(name) || BOILERPLATE_RE.test(name) || MERCH_RE.test(name)) return null;
  if (!titleLike(name)) return null;
  const letters = name.match(/[а-яёa-z]/giu) ?? [];
  if (letters.length < 2 || letters.length < name.length * 0.35) return null;
  const singleLetterWords = (name.match(/(?<![а-яёa-z])[а-яёa-z](?![а-яёa-z])/giu) ?? []).length;
  if (singleLetterWords >= 5) return null;

  name = sentenceCaseAllCaps(name);
  const distinctVolumes = [...new Set(volumes)];
  const multiVolume = distinctVolumes.length >= 2 && /\//u.test(line);
  return {
    name,
    price: prices.length ? Math.min(...prices) : null,
    image: null,
    volumeDescription: multiVolume ? `Объёмы: ${distinctVolumes.join(' / ')}` : null,
  };
}

function isDescription(line) {
  const value = cleanText(line);
  if (!value || BOILERPLATE_RE.test(value) || isSection(value)) return false;
  if (/(?:19|20)\d{2}\s*$/u.test(value)) return false;
  PRICE_RE.lastIndex = 0;
  AMOUNT_RE.lastIndex = 0;
  if (PRICE_RE.test(value) || AMOUNT_RE.test(value) || trailingPlainPrice(value) != null) return false;
  const words = value.match(/[а-яёa-z]+/giu) ?? [];
  return words.length >= 2 && words.length <= 24 && uppercaseRatio(value) < 0.65;
}

function looksLikeWrappedName(line, nextLine) {
  const first = cleanText(line);
  const second = cleanText(nextLine);
  if (!first || !second || BOILERPLATE_RE.test(first) || SECTION_RE.test(first)) return false;
  const words = first.match(/[а-яёa-z]+/giu) ?? [];
  if (words.length < 2 || words.length > 9) return false;

  PRICE_RE.lastIndex = 0;
  AMOUNT_RE.lastIndex = 0;
  const firstHasMetadata = PRICE_RE.test(first) || AMOUNT_RE.test(first);
  PRICE_RE.lastIndex = 0;
  AMOUNT_RE.lastIndex = 0;
  const secondHasMetadata = PRICE_RE.test(second) || AMOUNT_RE.test(second);
  PRICE_RE.lastIndex = 0;
  AMOUNT_RE.lastIndex = 0;
  if (firstHasMetadata || !secondHasMetadata) return false;

  const uppercaseName = uppercaseRatio(first) >= 0.5;
  const titleThenConnector = /^[«"']?[А-ЯЁA-Z]/u.test(first) && /^(?:и|с|со)\s+/u.test(second);
  return (uppercaseName || titleThenConnector) && Boolean(parseCandidate(`${first} ${second}`));
}

/** Parse independent column streams into clean menu items. */
export function parseMenuColumns(streams) {
  const items = new Map();
  for (const stream of streams) {
    for (let index = 0; index < stream.lines.length; index++) {
      let candidateLine = stream.lines[index];
      const previousLine = index > 0 ? cleanText(stream.lines[index - 1]) : '';
      const previousLooksLikeWrappedName = looksLikeWrappedName(previousLine, candidateLine);
      if (previousLooksLikeWrappedName) candidateLine = `${previousLine} ${candidateLine}`;
      const candidate = parseCandidate(candidateLine);
      if (!candidate) continue;

      const descriptions = [];
      for (let offset = 1; offset <= 3 && index + offset < stream.lines.length; offset++) {
        const next = stream.lines[index + offset];
        const following = stream.lines[index + offset + 1];
        if (following && looksLikeWrappedName(next, following)) break;
        if (parseCandidate(next) || isSection(next)) break;
        if (isDescription(next)) descriptions.push(cleanText(next));
      }
      const description = [candidate.volumeDescription, ...descriptions].filter(Boolean).join(' · ') || null;
      const key = candidate.name.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/[^а-яa-z0-9]+/giu, ' ').trim();
      const item = { name: candidate.name, price: candidate.price, description, image: null };
      const previous = items.get(key);
      if (!previous) items.set(key, item);
      else {
        if (previous.price == null && item.price != null) previous.price = item.price;
        if ((item.description?.length ?? 0) > (previous.description?.length ?? 0)) previous.description = item.description;
      }
    }
  }
  return [...items.values()];
}

export async function extractPositionedPages(buffer) {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const info = await parser.getInfo({ parsePageInfo: true });
    const pages = [];
    for (let number = 1; number <= info.total; number++) {
      // pdf-parse exposes plain text, while its loaded PDF.js document retains
      // the exact text-item transforms required for column reconstruction.
      const pdfPage = await parser.doc.getPage(number);
      const viewport = pdfPage.getViewport({ scale: 1 });
      const content = await pdfPage.getTextContent();
      const fragments = content.items
        .filter((item) => 'str' in item)
        .map((item) => {
          const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
          return { text: item.str, x, y, width: item.width || 0, height: item.height || 0 };
        });
      pages.push({ number, width: viewport.width, height: viewport.height, fragments });
    }
    return pages;
  } finally {
    await parser.destroy();
  }
}

async function fetchPdf(source) {
  if (!/^https?:\/\//iu.test(source)) return fs.readFileSync(path.resolve(source));
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(source, {
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126.0' },
        signal: AbortSignal.timeout(90000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
  throw lastError;
}

export async function parsePdfBuffer(buffer) {
  const pages = await extractPositionedPages(buffer);
  const streams = pages.flatMap(buildColumnLines);
  return { pages, streams, items: parseMenuColumns(streams) };
}

async function main() {
  const [domain, source] = process.argv.slice(2);
  if (!domain || !source) {
    console.log('usage: node prisma/pdf-menu.mjs <domain> <pdf-url-or-local-path>');
    process.exitCode = 1;
    return;
  }
  const buffer = await fetchPdf(source);
  console.log('pdf:', (buffer.length / 1024).toFixed(0), 'KB');
  const { pages, streams, items } = await parsePdfBuffer(buffer);
  const columns = streams.filter((stream) => stream.column === 1).length;
  console.log(`layout: ${pages.length} pages, ${columns} two-column pages`);
  const out = {
    domain,
    method: 'pdf-coordinates',
    status: items.length >= 10 ? 'ok' : 'manual_required',
    source,
    count: items.length,
    withPhoto: 0,
    items,
  };
  const file = path.join(__dirname, 'menu-out', `${domain.replace(/[^\w.-]/g, '_')}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(`Итог: ${items.length} позиций → menu-out/${domain}.json`);
  console.log(items.slice(0, 12).map((item) => `${item.name} — ${item.price ?? 'цена не указана'}${item.description ? ` (${item.description})` : ''}`).join('\n'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
