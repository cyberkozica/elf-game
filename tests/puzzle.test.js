// tests/puzzle.test.js
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/objects/SceneBase.js', () => ({
  default: class SceneBase { constructor() {} }
}));
jest.unstable_mockModule('../src/objects/Ent.js', () => ({
  default: class Ent {}
}));
jest.unstable_mockModule('../src/objects/Rune.js', () => ({
  default: class Rune {},
  RuneState: class RuneState {}
}));

const { PuzzleState } = await import('../src/scenes/RuinsScene.js');

const CORRECT = ['ᚷ', 'ᚱ', 'ᚹ', 'ᚠ'];

test('puzzle počinje prazan', () => {
  const p = new PuzzleState(CORRECT);
  expect(p.sequence).toEqual([]);
  expect(p.solved).toBe(false);
});

test('točan redoslijed rješava zagonetku', () => {
  const p = new PuzzleState(CORRECT);
  p.press('ᚷ'); p.press('ᚱ'); p.press('ᚹ'); p.press('ᚠ');
  expect(p.solved).toBe(true);
});

test('krivi unos resetira sekvencu', () => {
  const p = new PuzzleState(CORRECT);
  p.press('ᚷ'); p.press('ᚠ'); // ᚠ is wrong at position 2
  expect(p.sequence).toEqual([]);
  expect(p.solved).toBe(false);
});

test('rješenje ne može biti opet resetirano', () => {
  const p = new PuzzleState(CORRECT);
  CORRECT.forEach(s => p.press(s));
  p.press('ᚷ'); // extra press after solved
  expect(p.solved).toBe(true);
});
