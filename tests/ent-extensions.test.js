import { jest } from '@jest/globals';
import Ent from '../src/objects/Ent.js';

// Factory that returns a fresh graphics mock each time
const makeGraphics = () => ({
  clear: jest.fn().mockReturnThis(),
  fillStyle: jest.fn().mockReturnThis(),
  fillRect: jest.fn().mockReturnThis(),
  fillCircle: jest.fn().mockReturnThis(),
  strokeCircle: jest.fn().mockReturnThis(),
  setDepth: jest.fn().mockReturnThis(),
});

const mockZone = {};
const mockScene = {
  add: {
    graphics: jest.fn(() => makeGraphics()),
    zone: jest.fn(() => mockZone),
  },
  physics: { add: { existing: jest.fn() } },
};

test('_bodyColor är null by default', () => {
  const e = new Ent(mockScene, 100, 100);
  expect(e._bodyColor).toBeNull();
});

test('revealMaterial sets _bodyColor and redraws', () => {
  const e = new Ent(mockScene, 100, 100);
  const drawSpy = jest.spyOn(e, '_draw');
  e.revealMaterial(0xcd7f32);
  expect(e._bodyColor).toBe(0xcd7f32);
  expect(drawSpy).toHaveBeenCalled();
});

test('setHintGlow(true) draws on glowGraphics', () => {
  const e = new Ent(mockScene, 100, 100);
  const clearSpy = jest.spyOn(e.glowGraphics, 'clear');
  const fillStyleSpy = jest.spyOn(e.glowGraphics, 'fillStyle');
  e.setHintGlow(true);
  expect(clearSpy).toHaveBeenCalled();
  expect(fillStyleSpy).toHaveBeenCalledWith(0x4488ff, 0.5);
});

test('setHintGlow(false) clears glowGraphics without drawing', () => {
  const e = new Ent(mockScene, 100, 100);
  e.setHintGlow(true);
  // Install spy then clear its call history so only calls from setHintGlow(false) are counted
  const fillRectSpy = jest.spyOn(e.glowGraphics, 'fillRect');
  fillRectSpy.mockClear();
  e.setHintGlow(false);
  expect(fillRectSpy).not.toHaveBeenCalled();
});
