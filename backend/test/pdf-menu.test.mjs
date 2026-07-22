import test from 'node:test';
import assert from 'node:assert/strict';
import { buildColumnLines, parseMenuColumns } from '../prisma/pdf-menu.mjs';

test('separates physical columns before joining rows', () => {
  const fragments = [];
  for (let row = 0; row < 8; row++) {
    fragments.push(
      { text: `ЛЕВОЕ ${row} 200гр`, x: 20, y: 20 + row * 12, width: 100, height: 10 },
      { text: `ПРАВОЕ ${row} 250гр`, x: 330, y: 20 + row * 12, width: 110, height: 10 },
    );
  }
  const streams = buildColumnLines({ number: 1, width: 600, fragments });
  assert.equal(streams.length, 2);
  assert.deepEqual(streams[0].lines, Array.from({ length: 8 }, (_, row) => `ЛЕВОЕ ${row} 200гр`));
  assert.deepEqual(streams[1].lines, Array.from({ length: 8 }, (_, row) => `ПРАВОЕ ${row} 250гр`));
});

test('keeps composition as description and never invents a missing price', () => {
  const items = parseMenuColumns([{ page: 1, column: 0, lines: [
    '130/40гр КРЕВЕТКИ В КЛЯРЕ',
    'Маринованные креветки в кляре, Соус медово-горчичный',
    'САЛАТ С РОСТБИФОМ 190гр — 500₽',
    'Говядина, Микс салатов, Томаты',
  ] }]);
  assert.deepEqual(items, [
    { name: 'Креветки в кляре', price: null, description: 'Маринованные креветки в кляре, Соус медово-горчичный', image: null },
    { name: 'Салат с ростбифом', price: 500, description: 'Говядина, Микс салатов, Томаты', image: null },
  ]);
});

test('creates one two-volume item with the smaller explicit price', () => {
  const [item] = parseMenuColumns([{ page: 1, column: 0, lines: [
    'NEW Личи – земляника – юдзу 300мл / 1000мл – 390₽ / 490₽',
  ] }]);
  assert.deepEqual(item, {
    name: 'Личи – земляника – юдзу',
    price: 390,
    description: 'Объёмы: 300 мл / 1000 мл',
    image: null,
  });
});

test('keeps a right-hand price gutter on the same physical row', () => {
  const fragments = [];
  for (let row = 0; row < 8; row++) {
    fragments.push(
      { text: `Блюдо ${row}`, x: 20, y: 20 + row * 12, width: 110, height: 10 },
      { text: String(500 + row * 10), x: 540, y: 20 + row * 12, width: 30, height: 10 },
    );
  }
  const streams = buildColumnLines({ number: 1, width: 600, fragments });
  assert.equal(streams.length, 1);
  assert.equal(streams[0].lines[0], 'Блюдо 0 500');
});

test('accepts an explicit plain price but not a trailing vintage', () => {
  const items = parseMenuColumns([{ page: 1, column: 0, lines: [
    'Фокачча с томатами 590',
    'Vina Albali Sparkling White, 2023',
  ] }]);
  assert.deepEqual(items, [
    { name: 'Фокачча с томатами', price: 590, description: null, image: null },
  ]);
});

test('repairs a final Cyrillic glyph split by the PDF font', () => {
  const [item] = parseMenuColumns([{ page: 1, column: 0, lines: [
    '1шт/245гр КОЛБАСКА ИЗ ИНДЕЙК И',
  ] }]);
  assert.equal(item.name, 'Колбаска из индейки');
  assert.equal(item.price, null);
});
