// tests/lantern.test.js
import { LanternState } from '../src/objects/Lantern.js';

test('počinje na 100%', () => {
  const l = new LanternState();
  expect(l.energy).toBe(100);
});

test('troši energiju s vremenom', () => {
  const l = new LanternState();
  l.update(2); // 2 sekunde
  expect(l.energy).toBe(99); // 0.5% * 2s = 1%
});

test('ne ide ispod 0', () => {
  const l = new LanternState();
  l.update(300);
  expect(l.energy).toBe(0);
});

test('puni se na izvoru', () => {
  const l = new LanternState();
  l.update(100); // troši do ~50%
  const before = l.energy;
  l.refill();
  expect(l.energy).toBe(Math.min(100, before + 25));
});

test('radijus je manji pri manjoj energiji', () => {
  const l = new LanternState();
  const fullRadius = l.getRadius();
  l.update(300); // troši do 0
  const emptyRadius = l.getRadius();
  expect(fullRadius).toBeGreaterThan(emptyRadius);
});
