# Dvorana kipova Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "Dvorana kipova" level between RuinsScene and HeartScene where the player identifies the real Ent among three statues.

**Architecture:** Extend `Ent.js` with material variants and hint glow, update `HUD.js`/`RuinsScene.js`/`HeartScene.js` for the 7-rune chain, then create `StatueScene.js` as a new scene following the existing scene patterns. StatueScene exports a pure `StatueState` class for testability (same pattern as `PuzzleState` in RuinsScene).

**Tech Stack:** Phaser 3.60.0 (CDN), ES6 modules, Jest 29 (tests)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/objects/Ent.js` | Modify | Add `_bodyColor`, `revealMaterial(hex)`, `glowGraphics`, `setHintGlow(active)` |
| `src/ui/HUD.js` | Modify | 7 rune slots; updated `symbols`/`colors` arrays |
| `src/scenes/RuinsScene.js` | Modify | `_fromStatue` flag; dual Ent dialog; transition → `'Statue'` |
| `src/scenes/HeartScene.js` | Modify | 7 rune arrays in `ringRunes`, `ringAngles`, `allRunes` ×2, `allCollected` |
| `src/scenes/StatueScene.js` | Create | New scene + exported `StatueState` class |
| `src/main.js` | Modify | Import and register `StatueScene` |
| `tests/statue.test.js` | Create | Unit tests for `StatueState` |

---

## Task 1: Extend Ent.js — material variants and hint glow

**Files:**
- Modify: `src/objects/Ent.js`
- Test: `tests/ent-extensions.test.js`

- [ ] **Step 1.1: Write failing tests for revealMaterial and setHintGlow**

Create `tests/ent-extensions.test.js`:

```js
import { jest } from '@jest/globals';

// Mock Phaser graphics
const mockGraphics = {
  clear: jest.fn().mockReturnThis(),
  fillStyle: jest.fn().mockReturnThis(),
  fillRect: jest.fn().mockReturnThis(),
  fillCircle: jest.fn().mockReturnThis(),
  strokeCircle: jest.fn().mockReturnThis(),
  setDepth: jest.fn().mockReturnThis(),
};
const mockZone = {};
const mockScene = {
  add: {
    graphics: jest.fn(() => ({ ...mockGraphics })),
    zone: jest.fn(() => mockZone),
  },
  physics: { add: { existing: jest.fn() } },
};

jest.unstable_mockModule('../src/objects/Ent.js', () => {
  return { default: (await import('../src/objects/Ent.js')).default };
});

const { default: Ent } = await import('../src/objects/Ent.js');

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
  const fillRectSpy = jest.spyOn(e.glowGraphics, 'fillRect');
  e.setHintGlow(false);
  expect(fillRectSpy).not.toHaveBeenCalled();
});
```

- [ ] **Step 1.2: Run tests to verify they fail**

```bash
cd "/Users/mbiberovic/Library/CloudStorage/OneDrive-InfobipLtd/Documents/Claude Code/ShiftMag/elf-game"
node --experimental-vm-modules node_modules/.bin/jest tests/ent-extensions.test.js --no-coverage
```

Expected: FAIL — `_bodyColor`, `revealMaterial`, `glowGraphics`, `setHintGlow` not found.

- [ ] **Step 1.3: Implement changes in Ent.js**

Replace the full content of `src/objects/Ent.js` with:

```js
// src/objects/Ent.js
export default class Ent {
  constructor(scene, x, y, options = {}) {
    this.scene = scene;
    this.awake = false;
    this.x = x;
    this.y = y;
    this._bodyColor = null;  // null = use default wood color
    this._material = options.material ?? 'wood';

    this.graphics = scene.add.graphics();
    this._draw();

    // Separate graphics layer for hint glow (depth+1 over body)
    this.glowGraphics = scene.add.graphics();

    // Zona za interakciju
    this.zone = scene.add.zone(x, y, 60, 80);
    scene.physics.add.existing(this.zone, true);
  }

  _draw() {
    const { x, y, awake } = this;
    this.graphics.clear();

    // Tijelo enta — _bodyColor overrides default wood color
    const bodyHex = this._bodyColor ?? (awake ? 0x2a1a05 : 0x1a1208);
    this.graphics.fillStyle(bodyHex);
    this.graphics.fillRect(x - 18, y - 40, 36, 55);

    // Oči
    const eyeColor = awake ? 0xc8a040 : 0x3a2808;
    this.graphics.fillStyle(eyeColor);
    this.graphics.fillRect(x - 8, y - 30, 6, 6);
    this.graphics.fillRect(x + 2, y - 30, 6, 6);

    // Usta (samo kad je budan)
    if (awake) {
      this.graphics.fillStyle(0xc8a040);
      this.graphics.fillRect(x - 6, y - 18, 12, 3);
    }

    // Grane
    this.graphics.fillStyle(awake ? 0x2a1a05 : 0x120e06);
    this.graphics.fillRect(x - 26, y - 35, 10, 4);
    this.graphics.fillRect(x + 16, y - 35, 10, 4);
    this.graphics.fillRect(x - 4, y - 56, 8, 18);

    // Krošnja
    this.graphics.fillStyle(awake ? 0x1a4a10 : 0x0f2a0a);
    this.graphics.fillCircle(x, y - 60, 20);

    // Korijeni/noge
    this.graphics.fillStyle(awake ? 0x2a1a05 : 0x120e06);
    this.graphics.fillRect(x - 16, y + 14, 10, 10);
    this.graphics.fillRect(x - 2, y + 14, 10, 10);
    this.graphics.fillRect(x + 8, y + 14, 8, 10);
  }

  wake() {
    this.awake = true;
    this._draw();
  }

  isAwake() {
    return this.awake;
  }

  // Reveal statue material by changing body color and redrawing
  revealMaterial(hex) {
    this._bodyColor = hex;
    this._draw();
  }

  // Subtle blue eye glow for hint (drawn on separate graphics layer)
  setHintGlow(active) {
    this.glowGraphics.clear();
    if (active) {
      this.glowGraphics.fillStyle(0x4488ff, 0.5);
      this.glowGraphics.fillRect(this.x - 8, this.y - 30, 6, 6);
      this.glowGraphics.fillRect(this.x + 2, this.y - 30, 6, 6);
    }
  }
}
```

- [ ] **Step 1.4: Run tests to verify they pass**

```bash
node --experimental-vm-modules node_modules/.bin/jest tests/ent-extensions.test.js --no-coverage
```

Expected: PASS (4 tests).

- [ ] **Step 1.5: Run all tests to verify no regressions**

```bash
node --experimental-vm-modules node_modules/.bin/jest --no-coverage
```

Expected: all existing tests still pass.

- [ ] **Step 1.6: Commit**

```bash
git add src/objects/Ent.js tests/ent-extensions.test.js
git commit -m "feat: extend Ent with revealMaterial and setHintGlow"
```

---

## Task 2: Update HUD.js for 7 rune slots

**Files:**
- Modify: `src/ui/HUD.js`

No automated test — visual change. Verified manually by running the game.

- [ ] **Step 2.1: Update HUD.js**

Make these three changes to `src/ui/HUD.js`:

1. Line 37 — update comment:
```js
// Staro:
// Rune slotovi (6 runa: ᚱ ᚠ ᛩ ᛜ ᚹ ᚷ)
// Novo:
// Rune slotovi (7 runa: ᚱ ᚠ ᛩ ᛜ ᚹ ᛈ ᚷ)
```

2. Line 39 — change loop upper bound:
```js
// Staro:
for (let i = 0; i < 6; i++) {
// Novo:
for (let i = 0; i < 7; i++) {
```

3. Lines 62–63 — update symbols and colors arrays (insert ᛈ at position 5):
```js
// Staro:
const symbols = ['ᚱ', 'ᚠ', 'ᛩ', 'ᛜ', 'ᚹ', 'ᚷ'];
const colors  = ['#ffcc44', '#ff8844', '#44cc66', '#ff4488', '#44ccee', '#ffffff'];
// Novo:
const symbols = ['ᚱ', 'ᚠ', 'ᛩ', 'ᛜ', 'ᚹ', 'ᛈ', 'ᚷ'];
const colors  = ['#ffcc44', '#ff8844', '#44cc66', '#ff4488', '#44ccee', '#cd7f32', '#ffffff'];
```

- [ ] **Step 2.2: Run all tests**

```bash
node --experimental-vm-modules node_modules/.bin/jest --no-coverage
```

Expected: all pass.

- [ ] **Step 2.3: Commit**

```bash
git add src/ui/HUD.js
git commit -m "feat: update HUD for 7 rune slots (add runa ᛈ)"
```

---

## Task 3: Update RuinsScene.js

**Files:**
- Modify: `src/scenes/RuinsScene.js`

- [ ] **Step 3.1: Add `_fromStatue` flag in `create()`**

In `RuinsScene.create()`, after line 29 (`this._baseCreate(...)`) add:

```js
this._fromStatue = this.sys.settings.data?.fromStatue ?? false;
```

- [ ] **Step 3.2: Update sleeping Ent dialog to two variants**

In `_updateEnt()`, the branch for `!this.ent.isAwake()` (currently lines 193–195):

```js
// Staro:
if (!this.ent.isAwake()) {
  this.dialog.show('Drevno drvo', '"...zzz... stari stupovi... pamte red... zzz..."');
  this.time.delayedCall(2500, () => this.dialog.hide());
}
// Novo:
if (!this.ent.isAwake()) {
  const sleepMsg = this._fromStatue
    ? '"...zzz... stari stupovi... pamte red... zzz..."'
    : '"...zzz... stari stupovi... pamte red... Moj prijatelj u dvorani iza voli kipove. Ali pazite — nije sve što stoji, živo... zzz..."';
  this.dialog.show('Drevno drvo', sleepMsg);
  this.time.delayedCall(2500, () => this.dialog.hide());
}
```

- [ ] **Step 3.3: Update awake Ent post-runa dialog**

In `_updateEnt()`, the collected-runa branch (currently line 198):

```js
// Staro:
'"Srce šume te čeka na istoku."'
// Novo:
'"Dvorana kipova te čeka na istoku."'
```

Note: `_entSpokenAfterRune = true` on line 201 remains untouched.

- [ ] **Step 3.4: Update `_checkExit()` transition target**

Line 211:
```js
// Staro:
this.scene.start('Heart', { runes: this.collectedRunes });
// Novo:
this.scene.start('Statue', { runes: this.collectedRunes });
```

- [ ] **Step 3.5: Run all tests**

```bash
node --experimental-vm-modules node_modules/.bin/jest --no-coverage
```

Expected: all pass.

- [ ] **Step 3.6: Commit**

```bash
git add src/scenes/RuinsScene.js
git commit -m "feat: update RuinsScene — fromStatue flag, dialog, transition to Statue"
```

---

## Task 4: Update HeartScene.js for 7 runes

**Files:**
- Modify: `src/scenes/HeartScene.js`

- [ ] **Step 4.1: Update ringRunes and ringAngles**

Lines 27–28:
```js
// Staro:
const ringRunes  = ['ᚱ', 'ᚠ', 'ᛩ', 'ᛜ', 'ᚹ', 'ᚷ'];
const ringAngles = [0, 60, 120, 180, 240, 300];
// Novo:
const ringRunes  = ['ᚱ', 'ᚠ', 'ᛩ', 'ᛜ', 'ᚹ', 'ᛈ', 'ᚷ'];
const ringAngles = [0, 51, 103, 154, 206, 257, 309];
```

Fix comment on line 26:
```js
// Staro:
// 5 runes on the ring
// Novo:
// 7 runa na prstenu
```

- [ ] **Step 4.2: Update `_updateRingGlow` allRunes**

Line 124:
```js
// Staro:
const allRunes = ['ᚱ', 'ᚠ', 'ᛩ', 'ᛜ', 'ᚹ', 'ᚷ'];
// Novo:
const allRunes = ['ᚱ', 'ᚠ', 'ᛩ', 'ᛜ', 'ᚹ', 'ᛈ', 'ᚷ'];
```

- [ ] **Step 4.3: Update `_updatePortal` allCollected check**

Line 132:
```js
// Staro:
const allCollected = ['ᚱ', 'ᚠ', 'ᛩ', 'ᛜ', 'ᚹ', 'ᚷ'].every(r => this.collectedRunes.includes(r));
// Novo:
const allCollected = ['ᚱ', 'ᚠ', 'ᛩ', 'ᛜ', 'ᚹ', 'ᛈ', 'ᚷ'].every(r => this.collectedRunes.includes(r));
```

- [ ] **Step 4.4: Run all tests**

```bash
node --experimental-vm-modules node_modules/.bin/jest --no-coverage
```

Expected: all pass.

- [ ] **Step 4.5: Commit**

```bash
git add src/scenes/HeartScene.js
git commit -m "feat: update HeartScene for 7 runes (add runa ᛈ to ring)"
```

---

## Task 5: Create StatueScene.js + tests

**Files:**
- Create: `src/scenes/StatueScene.js`
- Create: `tests/statue.test.js`

### 5a — StatueState tests

- [ ] **Step 5.1: Write failing tests for StatueState**

Create `tests/statue.test.js`:

```js
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
```

- [ ] **Step 5.2: Run tests to verify they fail**

```bash
node --experimental-vm-modules node_modules/.bin/jest tests/statue.test.js --no-coverage
```

Expected: FAIL — `StatueState` not found.

### 5b — Implement StatueScene.js

- [ ] **Step 5.3: Create StatueScene.js**

Create `src/scenes/StatueScene.js`:

```js
// src/scenes/StatueScene.js
import SceneBase from '../objects/SceneBase.js';
import Ent from '../objects/Ent.js';
import Rune from '../objects/Rune.js';

// Exported for testing
export class StatueState {
  constructor() {
    this.realIndex = Math.floor(Math.random() * 4);
  }
  isReal(index) {
    return index === this.realIndex;
  }
}

export default class StatueScene extends SceneBase {
  constructor() { super('Statue'); }

  create() {
    this._baseCreate('DVORANA KIPOVA', 0x080508);

    this.player.sprite.setPosition(40, 160);

    // If runa ᛈ already collected (shouldn't happen in normal flow) — open door
    this._alreadySolved = this.sys.settings.data?.runes?.includes('ᛈ') ?? false;

    // Stone floor
    const floor = this.add.graphics().setDepth(1);
    floor.fillStyle(0x1a1510);
    floor.fillRect(60, 60, 360, 200);
    floor.lineStyle(1, 0x2a2018);
    for (let fx = 60; fx < 420; fx += 40) {
      floor.lineBetween(fx, 60, fx, 260);
    }
    for (let fy = 60; fy < 260; fy += 40) {
      floor.lineBetween(60, fy, 420, fy);
    }

    // Decorative columns (left and right edges, visual only)
    const cols = this.add.graphics().setDepth(2);
    cols.fillStyle(0x2a2018);
    [[30, 110], [30, 210], [450, 110], [450, 210]].forEach(([cx, cy]) => {
      cols.fillRect(cx - 8, cy - 25, 16, 50);
    });

    // Door (locked until real Ent chosen)
    this.door = this.add.graphics().setDepth(2);
    this.doorOpen = false;
    this._drawDoor(false);

    // Mushrooms
    this._createMushrooms([[80, 250], [400, 80]]);

    // Randomize which Ent is real and which materials are statues
    this.statueState = new StatueState();
    const materials = ['bronze', 'silver', 'gold'];
    // positions for 2x2 grid
    const positions = [[185, 110], [295, 110], [185, 210], [295, 210]];

    // Distribute materials: real Ent gets 'wood', others get the 3 statue materials
    const shuffledMaterials = Phaser.Utils.Array.Shuffle([...materials]);
    let matIdx = 0;

    this.ents = positions.map(([ ex, ey ], i) => {
      const isReal = this.statueState.isReal(i);
      const mat = isReal ? 'wood' : shuffledMaterials[matIdx++];
      return { ent: new Ent(this, ex, ey, { material: mat }), x: ex, y: ey, isReal, mat };
    });

    // Rune ᛈ — hidden until real Ent is chosen
    // Place it near center; will be positioned near the real Ent on solve
    this.rune = new Rune(this, 240, 160, 'ᛈ');
    this.rune.label.setVisible(false);
    this.rune.sprite.setVisible(false);

    this._transitioning = false;
    this._revealed = false;
    this._hintActive = false;
    this._sceneStartTime = this.time.now;

    if (this._alreadySolved) {
      this._openDoor();
    }
  }

  update(time, delta) {
    this._baseUpdate(delta);
    this._updateMushrooms();
    this._updateHint();
    this._updateEnts();
    this._updateRune();
    this._checkExit();
  }

  _drawDoor(open) {
    this.door.clear();
    if (!open) {
      this.door.fillStyle(0x1a1510);
      this.door.fillRect(400, 120, 30, 60);
    }
  }

  _openDoor() {
    this.doorOpen = true;
    this._drawDoor(true);
  }

  _updateHint() {
    if (this._hintActive || this._revealed) return;
    if (this.time.now - this._sceneStartTime < 60000) return;
    // Activate subtle blue eye glow on real Ent
    this._hintActive = true;
    const realEntData = this.ents.find(e => e.isReal);
    if (realEntData) realEntData.ent.setHintGlow(true);
  }

  _updateEnts() {
    if (this._revealed || this._transitioning) return;
    this.ents.forEach((entData, i) => {
      const d = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, entData.x, entData.y
      );
      if (d < 60 && (Phaser.Input.Keyboard.JustDown(this.keyE) || this.touch.actionJustDown())) {
        if (entData.isReal) {
          this._solveCorrect(entData);
        } else {
          this._solveWrong();
        }
      }
    });
  }

  _solveCorrect(entData) {
    this._revealed = true;
    // Turn off hint glow
    if (this._hintActive) entData.ent.setHintGlow(false);
    // Show rune near the real Ent
    this.rune.sprite.setPosition(entData.x, entData.y + 20);
    this.rune.label.setPosition(entData.x, entData.y + 20);
    this.rune.sprite.setVisible(true);
    this.rune.label.setVisible(true);
    this._openDoor();
  }

  _solveWrong() {
    this._revealed = true;
    // Shake all four Ents, then reveal statue materials
    this.ents.forEach(entData => {
      this.tweens.add({
        targets: entData.ent.graphics,
        x: { from: entData.x - 3, to: entData.x + 3 },
        duration: 80,
        yoyo: true,
        repeat: 2,
      });
    });
    // Reveal statue materials after shake
    this.time.delayedCall(300, () => {
      const matColors = { bronze: 0xcd7f32, silver: 0xc0c0c0, gold: 0xffd700 };
      this.ents.forEach(entData => {
        if (!entData.isReal) {
          entData.ent.revealMaterial(matColors[entData.mat]);
        }
      });
      this.dialog.show('', '"Kažnjen si vraćanjem u ruševine!"');
    });
    // Transition back to Ruins after 2500ms
    this.time.delayedCall(2500, () => {
      if (!this._transitioning) {
        this._transitioning = true;
        this.scene.start('Ruins', { runes: this.collectedRunes, fromStatue: true });
      }
    });
  }

  _updateRune() {
    if (this.rune.isCollected() || !this.doorOpen || !this._revealed) return;
    const d = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.rune.x, this.rune.y
    );
    const inLight = d < this.lantern.state.getRadius();
    this.rune.label.setVisible(inLight);
    if (inLight && d < 24) {
      this.rune.collect();
      this.collectedRunes.push('ᛈ');
      this.dialog.show('', '✦ Pronašao si runu ᛈ!');
      this.time.delayedCall(2000, () => this.dialog.hide());
    }
  }

  _checkExit() {
    if (this.rune.isCollected() && this.player.x > 460 && !this._transitioning) {
      this._transitioning = true;
      this.scene.start('Heart', { runes: this.collectedRunes });
    }
  }
}
```

- [ ] **Step 5.4: Run StatueState tests to verify they pass**

```bash
node --experimental-vm-modules node_modules/.bin/jest tests/statue.test.js --no-coverage
```

Expected: PASS (4 tests).

- [ ] **Step 5.5: Run all tests**

```bash
node --experimental-vm-modules node_modules/.bin/jest --no-coverage
```

Expected: all pass.

- [ ] **Step 5.6: Commit**

```bash
git add src/scenes/StatueScene.js tests/statue.test.js
git commit -m "feat: add StatueScene (Dvorana kipova) with StatueState logic"
```

---

## Task 6: Register StatueScene in main.js

**Files:**
- Modify: `src/main.js`

- [ ] **Step 6.1: Add import and register StatueScene**

In `src/main.js`:

1. Add import after line 7 (`import RuinsScene`):
```js
import StatueScene from './scenes/StatueScene.js';
```

2. In the `scene` array (line 22), insert `StatueScene` between `RuinsScene` and `HeartScene`:
```js
// Staro:
scene: [BootScene, MenuScene, ForestScene, LakeScene, CaveScene, StairsScene, RuinsScene, HeartScene, EndScene],
// Novo:
scene: [BootScene, MenuScene, ForestScene, LakeScene, CaveScene, StairsScene, RuinsScene, StatueScene, HeartScene, EndScene],
```

- [ ] **Step 6.2: Run all tests**

```bash
node --experimental-vm-modules node_modules/.bin/jest --no-coverage
```

Expected: all pass.

- [ ] **Step 6.3: Commit**

```bash
git add src/main.js
git commit -m "feat: register StatueScene in game config"
```

---

## Task 7: Manual smoke test

- [ ] **Step 7.1: Start the game**

```bash
cd "/Users/mbiberovic/Library/CloudStorage/OneDrive-InfobipLtd/Documents/Claude Code/ShiftMag/elf-game"
npm start
```

Open http://localhost:8080 in browser.

- [ ] **Step 7.2: Verify HUD**

On any scene, check that HUD shows 7 rune slots (not 6).

- [ ] **Step 7.3: Play through to Dvorana kipova**

Complete Forest → Lake → Cave → Stairs → Ruins. After solving the Ruins puzzle and talking to the Ent ("Dvorana kipova te čeka na istoku."), exit east. Verify you arrive at DVORANA KIPOVA.

- [ ] **Step 7.4: Test wrong Ent**

Press E on a wrong Ent. Verify: all four shake, three reveal bronze/silver/gold colors, dialog shows "Kažnjen si vraćanjem u ruševine!", then returns to Ruins with puzzle reset.

- [ ] **Step 7.5: Test hint**

Wait 60 seconds. Verify the real Ent's eyes gain a subtle blue glow.

- [ ] **Step 7.6: Test correct Ent**

Press E on the real Ent (blue-glowing after hint). Verify: runa ᛈ appears, door opens, can exit east to HeartScene.

- [ ] **Step 7.7: Verify HeartScene ring**

Complete to HeartScene. Verify the rune ring shows 7 runes at even spacing, with ᛈ lit in bronze between ᚹ and ᚷ.

- [ ] **Step 7.8: Commit smoke test sign-off**

```bash
git commit --allow-empty -m "chore: smoke test passed — Dvorana kipova complete"
```
