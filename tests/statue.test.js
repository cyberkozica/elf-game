import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/objects/SceneBase.js', () => ({
  default: class SceneBase { constructor() {} }
}));
jest.unstable_mockModule('../src/objects/Ent.js', () => ({
  default: class Ent {}
}));
jest.unstable_mockModule('../src/objects/Rune.js', () => ({
  default: class Rune {}
}));

const { StatueState } = await import('../src/scenes/StatueScene.js');

test('realIndex je između 0 i 3', () => {
  for (let i = 0; i < 20; i++) {
    const s = new StatueState();
    expect(s.realIndex).toBeGreaterThanOrEqual(0);
    expect(s.realIndex).toBeLessThanOrEqual(3);
  }
});

test('isReal vraća true samo za realIndex', () => {
  const s = new StatueState();
  let trueCount = 0;
  for (let i = 0; i < 4; i++) {
    if (s.isReal(i)) trueCount++;
  }
  expect(trueCount).toBe(1);
});

test('isReal(realIndex) je uvijek true', () => {
  const s = new StatueState();
  expect(s.isReal(s.realIndex)).toBe(true);
});

test('isReal na krivom indexu je false', () => {
  const s = new StatueState();
  const wrongIndex = (s.realIndex + 1) % 4;
  expect(s.isReal(wrongIndex)).toBe(false);
});
