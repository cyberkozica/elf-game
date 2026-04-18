// src/scenes/CaveScene.js
import SceneBase from '../objects/SceneBase.js';
import Ent from '../objects/Ent.js';
import Rune from '../objects/Rune.js';

// Crystal cave between Lake and Ruins.
// 5 crystals must be activated in the correct (randomised) order.
// Wrong activation resets all progress. Stone altar shows the sequence.
// Rune ᛩ is awarded when all 5 crystals are activated correctly.

const CRYSTAL_COLORS = [0x44aaff, 0x00eeff, 0x7766ff, 0x00cccc, 0xaaaaee];
const CRYSTAL_LABELS = ['◆', '◆', '◆', '◆', '◆'];

export default class CaveScene extends SceneBase {
  constructor() { super('Cave'); }

  create() {
    this._baseCreate('KRISTALNA ŠPILJA', 0x020406);

    this.player.sprite.setPosition(30, 160);

    // Cave floor — cold stone
    const floor = this.add.graphics().setDepth(1);
    floor.fillStyle(0x0a0c10);
    floor.fillRect(0, 40, 480, 240);
    floor.lineStyle(1, 0x141820);
    for (let fx = 0; fx < 480; fx += 40) {
      floor.lineBetween(fx, 40, fx, 280);
    }
    for (let fy = 40; fy < 280; fy += 40) {
      floor.lineBetween(0, fy, 480, fy);
    }

    // Wall physics — top and bottom cave walls
    this.wallGroup = this.physics.add.staticGroup();
    const wTop = this.wallGroup.create(240, 32, null);
    wTop.setVisible(false).setSize(480, 24).refreshBody();   // y=20-44
    const wBot = this.wallGroup.create(240, 292, null);
    wBot.setVisible(false).setSize(480, 24).refreshBody();   // y=280-304
    this.physics.add.collider(this.player.sprite, this.wallGroup);

    // Stalactites (from ceiling) and stalagmites (from floor)
    this._drawFormations();

    // Stone altar at center — shows activation sequence hint
    this._buildAltar();

    // 5 crystals — randomised activation order
    const order = Phaser.Utils.Array.Shuffle([0, 1, 2, 3, 4]);
    this.crystalOrder = order;   // correct sequence of indices
    this.crystalProgress = 0;    // how many correct presses so far
    this.crystalSolved = false;

    this.crystals = this._buildCrystals();

    // Mushrooms
    this._createMushrooms([[60, 250], [420, 60]]);

    // Trees/rocks along edges
    this._createTrees([[30, 50], [450, 50], [30, 275], [450, 275]]);

    // Ent — wakes when puzzle solved
    this.ent = new Ent(this, 440, 160);

    // Rune ᛩ — hidden until all crystals activated
    this.rune = new Rune(this, 440, 160, 'ᛩ');
    this.rune.label.setVisible(false);
    this.rune.sprite.setVisible(false);

    this._entSpokenAfterRune = false;
    this._transitioning = false;
    this._sceneStartTime = this.time.now;
  }

  update(time, delta) {
    this._baseUpdate(delta);
    this._updateMushrooms();
    this._updateAltar();
    this._updateCrystals();
    this._updateRune();
    this._updateEnt();
    this._checkExit();
  }

  // ─── Private builders ─────────────────────────────────────────────────────

  _drawFormations() {
    const g = this.add.graphics().setDepth(2);

    // Stalactites
    const stalactites = [
      [60, 40, 10, 28], [130, 40, 8, 22], [200, 40, 12, 32],
      [300, 40, 9, 25], [380, 40, 11, 30], [440, 40, 7, 18],
    ];
    stalactites.forEach(([x, y, w, h]) => {
      g.fillStyle(0x1a1e26);
      g.fillTriangle(x - w, y, x + w, y, x, y + h);
      g.fillStyle(0x2a2e38, 0.6);
      g.fillTriangle(x - w * 0.4, y, x + w * 0.4, y, x, y + h * 0.7);
    });

    // Stalagmites
    const stalagmites = [
      [90, 280, 9, 24], [170, 280, 7, 18], [250, 280, 11, 30],
      [340, 280, 8, 22], [410, 280, 10, 26],
    ];
    stalagmites.forEach(([x, y, w, h]) => {
      g.fillStyle(0x1a1e26);
      g.fillTriangle(x - w, y, x + w, y, x, y - h);
      g.fillStyle(0x2a2e38, 0.6);
      g.fillTriangle(x - w * 0.4, y, x + w * 0.4, y, x, y - h * 0.7);
    });
  }

  _buildAltar() {
    const ax = 240, ay = 160;

    // Altar base
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0x141820);
    g.fillRect(ax - 50, ay - 20, 100, 40);
    g.lineStyle(1, 0x2a3040);
    g.strokeRect(ax - 50, ay - 20, 100, 40);

    // Altar label
    this.add.text(ax, ay - 10, 'REDOSLIJED', {
      fontSize: '7px', color: '#3a4a5a', letterSpacing: 1
    }).setOrigin(0.5).setDepth(5);

    // Sequence hint text — 5 slots, one per crystal
    this.altarSlots = [];
    for (let i = 0; i < 5; i++) {
      const t = this.add.text(ax - 36 + i * 18, ay + 6, '?', {
        fontSize: '9px', color: '#3a4a5a', fontFamily: 'serif'
      }).setOrigin(0.5).setDepth(5);
      this.altarSlots.push(t);
    }

    // Fill slots with coloured crystal numbers once order is known
    // (called after crystalOrder is set in create())
    this._altarBuilt = true;
  }

  _fillAltarSlots() {
    // Show the correct order using crystal numbers 1–5
    const colorHex = ['#44aaff', '#00eeff', '#7766ff', '#00cccc', '#aaaaee'];
    this.crystalOrder.forEach((crystalIdx, position) => {
      this.altarSlots[position].setText(String(crystalIdx + 1));
      this.altarSlots[position].setColor(colorHex[crystalIdx]);
    });
  }

  _buildCrystals() {
    // Fixed positions for the 5 crystals
    const positions = [
      [120, 100],
      [120, 220],
      [360, 100],
      [360, 220],
      [240, 80],
    ];

    return positions.map(([ x, y ], idx) => {
      const color = CRYSTAL_COLORS[idx];

      // Crystal shape (two overlapping diamonds)
      const g = this.add.graphics().setDepth(3);
      this._drawCrystal(g, 0, 0, color, 0.5);
      g.x = x; g.y = y;

      // Number label
      const label = this.add.text(x, y + 18, String(idx + 1), {
        fontSize: '9px', color: '#334455'
      }).setOrigin(0.5).setDepth(5);

      return { g, label, x, y, idx, lit: false, activated: false };
    });
  }

  _drawCrystal(g, cx, cy, color, alpha = 1) {
    g.fillStyle(color, alpha);
    // Outer diamond
    g.fillTriangle(cx, cy - 12, cx - 7, cy, cx + 7, cy);
    g.fillTriangle(cx - 7, cy, cx + 7, cy, cx, cy + 10);
    // Inner highlight
    g.fillStyle(0xffffff, alpha * 0.3);
    g.fillTriangle(cx - 2, cy - 10, cx + 4, cy - 3, cx - 2, cy - 3);
  }

  // ─── Update methods ────────────────────────────────────────────────────────

  _updateAltar() {
    // Show hint only after 45 seconds AND when close to the altar
    if (this._altarFilled) return;
    if (this.time.now - this._sceneStartTime < 90000) return;
    const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, 240, 160);
    if (d >= 60) return;
    this._altarFilled = true;
    this._fillAltarSlots();
  }

  _updateCrystals() {
    if (this.crystalSolved) return;

    this.crystals.forEach((crystal, idx) => {
      const d = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, crystal.x, crystal.y
      );
      const inLight = d < this.lantern.state.getRadius();

      // Light up when in lantern radius
      if (inLight !== crystal.lit) {
        crystal.lit = inLight;
        crystal.g.clear();
        const alpha = crystal.activated ? 1.0 : (inLight ? 0.8 : 0.35);
        this._drawCrystal(crystal.g, 0, 0, CRYSTAL_COLORS[idx], alpha);
        crystal.label.setColor(inLight ? '#aabbcc' : '#334455');
      }

      // E key press near crystal
      if (d < 35 && !crystal.activated &&
          (Phaser.Input.Keyboard.JustDown(this.keyE) || this.touch.actionJustDown())) {

        const expectedIdx = this.crystalOrder[this.crystalProgress];

        if (idx === expectedIdx) {
          // Correct
          this.crystalProgress++;
          crystal.activated = true;
          crystal.g.clear();
          this._drawCrystal(crystal.g, 0, 0, CRYSTAL_COLORS[idx], 1.0);

          // Inner glow pulse
          crystal.g.fillStyle(0xffffff, 0.25);
          crystal.g.fillCircle(0, -2, 6);

          if (this.crystalProgress === 5) {
            this._allCrystalsActivated();
          } else {
            this.audio.correctStep();
            this.dialog.show('', `✦ Kristal ${idx + 1} aktiviran. (${this.crystalProgress}/5)`);
            this.time.delayedCall(1500, () => this.dialog.hide());
          }
        } else {
          // Wrong — reset all
          this._resetCrystals();
          this._showBoing(crystal.x, crystal.y, 'BOING!', 'Nije to!');
          this.dialog.show('', '✦ Krivi redoslijed. Sve se resetiralo.');
          this.time.delayedCall(2000, () => this.dialog.hide());
        }
      }
    });
  }

  _resetCrystals() {
    this.crystalProgress = 0;
    this.crystals.forEach((crystal, idx) => {
      crystal.activated = false;
      crystal.g.clear();
      this._drawCrystal(crystal.g, 0, 0, CRYSTAL_COLORS[idx], crystal.lit ? 0.8 : 0.35);
    });
  }

  _allCrystalsActivated() {
    this.crystalSolved = true;
    this.ent.wake();
    this.audio.entWake();
    this.audio.rune();
    this.dialog.show('Drevno drvo', '"Kamenje pamti... Runa ᛩ je tvoja. Putuj prema istoku — čekaju te začarane stube."');
    this.time.delayedCall(3500, () => {
      this.dialog.hide();
      this.rune.sprite.setVisible(true);
      this.rune.label.setVisible(true);
    });
  }

  _updateRune() {
    if (this.rune.isCollected() || !this.crystalSolved) return;
    const d = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.rune.x, this.rune.y
    );
    const inLight = d < this.lantern.state.getRadius();
    this.rune.label.setVisible(inLight);
    if (inLight && d < 24) {
      this.rune.collect();
      this.collectedRunes.push('ᛩ');
      this.dialog.show('', '✦ Pronašao si runu ᛩ!');
      this.time.delayedCall(2000, () => this.dialog.hide());
    }
  }

  _updateEnt() {
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.ent.x, this.ent.y
    );
    if (dist < 60 && (Phaser.Input.Keyboard.JustDown(this.keyE) || this.touch.actionJustDown())) {
      if (!this.ent.isAwake()) {
        this.dialog.show('Drevno drvo', '"...zzz... kristali... trepere... zzz..."');
        this.time.delayedCall(2500, () => this.dialog.hide());
      } else if (!this.dialog.visible) {
        const msg = this.rune.isCollected()
          ? '"Začarane stube čekaju te na istoku. Budi oprezan."'
          : '"Uzmi runu iz kristalnog srca špilje."';
        this.dialog.show('Drevno drvo', msg);
        if (this.rune.isCollected()) this._entSpokenAfterRune = true;
      } else {
        this.dialog.hide();
      }
    }
  }

  _checkExit() {
    if (this.rune.isCollected() && this.player.x > 460 && !this._transitioning) {
      this._transitioning = true;
      this.scene.start('Stairs', { runes: this.collectedRunes });
    }
  }
}
