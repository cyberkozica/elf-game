// tests/rune.test.js
import { RuneState } from '../src/objects/Rune.js';

test('runa nije skupljena na početku', () => {
  const r = new RuneState('ᚱ');
  expect(r.collected).toBe(false);
});

test('skupljanje rune mijenja stanje', () => {
  const r = new RuneState('ᚱ');
  r.collect();
  expect(r.collected).toBe(true);
});

test('runa zna svoj simbol', () => {
  const r = new RuneState('ᚠ');
  expect(r.symbol).toBe('ᚠ');
});
