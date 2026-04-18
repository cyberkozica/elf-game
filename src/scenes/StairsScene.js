// src/scenes/StairsScene.js
// Two identical stone staircases — one leads forward, one back to the start.
// The correct staircase is randomised on every visit.
// Wrong choice → Forest (no runes). Correct → rune ᛜ + exit to Ruins.

import SceneBase from '../objects/SceneBase.js';
import Rune from '../objects/Rune.js';

export default class StairsScene extends SceneBase {
  constructor() { super('Stairs'); }

  create() {
    this._baseCreate('ZAČARANE STUBE', 0x030205);

    this.player.sprite.setPosition(30, 160);

    // Correct staircase index (0 = left, 1 = right) — randomised each visit
    this._correct = Phaser.Math.Between(0, 1);
    this._chosen = false;
    this._transitioning = false;

    // Stone floor
    const floor = this.add.graphics().setDepth(1);
    floor.fillStyle(0x0d0b12);
    floor.fillRect(0, 50, 480, 220);
    floor.lineStyle(1, 0x15121e);
    for (let fx = 0; fx < 480; fx += 40) floor.lineBetween(fx, 50, fx, 270);
    for (let fy = 50; fy < 270; fy += 40) floor.lineBetween(0, fy, 480, fy);

    // Wall physics — top and bottom
    this.wallGroup = this.physics.add.staticGroup();
    const wTop = this.wallGroup.create(240, 32, null);
    wTop.setVisible(false).setSize(480, 24).refreshBody();
    const wBot = this.wallGroup.create(240, 292, null);
    wBot.setVisible(false).setSize(480, 24).refreshBody();
    this.physics.add.collider(this.player.sprite, this.wallGroup);

    // Atmospheric rune carvings on the floor
    this._drawFloorRunes();

    // Two identical staircases
    this.stairs = [
      this._buildStaircase(150, 180),
      this._buildStaircase(330, 180),
    ];

    // Subtle hint — faint ᛜ above the correct staircase, blends with stone floor
    const hintX = this.stairs[this._correct].cx;
    this.add.text(hintX, 100, 'ᛜ', {
      fontSize: '10px', fontFamily: 'serif', color: '#cc6600'
    }).setOrigin(0.5).setDepth(3).setAlpha(0.28);

    // Prompt label — appears when player is close
    this.promptLeft  = this._buildPrompt(150, 220);
    this.promptRight = this._buildPrompt(330, 220);

    // Rune ᛜ — hidden at center, revealed after correct choice
    this.rune = new Rune(this, 240, 160, 'ᛜ');
    this.rune.label.setVisible(false);
    this.rune.sprite.setVisible(false);

    // Mushroom
    this._createMushrooms([[240, 265]]);

    // Trees
    this._createTrees([[30, 55], [450, 55], [30, 275], [450, 275]]);
  }

  update(time, delta) {
    this._baseUpdate(delta);
    this._updateMushrooms();
    this._updatePrompts();
    this._updateStairs();
    this._updateRune();
    this._checkExit();
  }

  // ─── Private builders ─────────────────────────────────────────────────────

  _buildStaircase(cx, by) {
    const g = this.add.graphics().setDepth(3);
    const steps = 5;
    for (let s = 0; s < steps; s++) {
      const w = 50 - s * 4;
      const h = 14;
      const x = cx - w / 2;
      const y = by - s * (h + 2);
      g.fillStyle(0x22202e);
      g.fillRect(x, y, w, h);
      g.lineStyle(1, 0x3a3555);
      g.strokeRect(x, y, w, h);
      // Step highlight
      g.lineStyle(1, 0x4a4570, 0.5);
      g.lineBetween(x + 2, y + 1, x + w - 2, y + 1);
    }
    // Glow beneath
    const glowG = this.add.graphics().setDepth(2);
    glowG.fillStyle(0x330055, 0.18);
    glowG.fillEllipse(cx, by + 5, 70, 20);

    return { cx, by };
  }

  _buildPrompt(x, y) {
    return this.add.text(x, y, '[ E ]', {
      fontSize: '9px', color: '#4a3a6a'
    }).setOrigin(0.5).setDepth(8).setVisible(false);
  }

  _drawFloorRunes() {
    const symbols = ['ᛜ', 'ᚱ', 'ᚠ', 'ᚹ', 'ᚷ', 'ᛩ'];
    const positions = [
      [80, 130], [160, 230], [240, 100], [300, 240],
      [380, 120], [420, 200],
    ];
    positions.forEach(([x, y], i) => {
      this.add.text(x, y, symbols[i % symbols.length], {
        fontSize: '14px', color: '#1a1530', fontFamily: 'serif'
      }).setOrigin(0.5).setDepth(1);
    });
  }

  // ─── Update methods ────────────────────────────────────────────────────────

  _updatePrompts() {
    if (this._chosen) {
      this.promptLeft.setVisible(false);
      this.promptRight.setVisible(false);
      return;
    }
    const dL = Phaser.Math.Distance.Between(this.player.x, this.player.y, 150, 180);
    const dR = Phaser.Math.Distance.Between(this.player.x, this.player.y, 330, 180);
    this.promptLeft.setVisible(dL < 55);
    this.promptRight.setVisible(dR < 55);
  }

  _updateStairs() {
    if (this._chosen) return;

    this.stairs.forEach((stair, idx) => {
      const d = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, stair.cx, stair.by
      );
      if (d < 55 && (Phaser.Input.Keyboard.JustDown(this.keyE) || this.touch.actionJustDown())) {
        this._chosen = true;

        if (idx === this._correct) {
          this.collectedRunes.push('ᛜ');
          this.rune.collect();
          this.audio?.rune();
          this.dialog.show('', '✦ Prave stube! Pronašao si runu ᛜ. Idi prema istoku.');
          this.time.delayedCall(2500, () => this.dialog.hide());
        } else {
          this._showBoing(this.player.x, this.player.y, 'BOING!', 'Krivi put!');
          this.dialog.show('', '✦ Začarane stube! Šuma te vraća na početak...');
          this.time.delayedCall(2800, () => {
            if (!this._transitioning) {
              this._transitioning = true;
              this.scene.start('Forest');
            }
          });
        }
      }
    });
  }

  _updateRune() {
    // Rune is auto-collected when correct stairs are taken — nothing to do here.
  }

  _checkExit() {
    if (this.collectedRunes.includes('ᛜ') && this.player.x > 460 && !this._transitioning) {
      this._transitioning = true;
      this.scene.start('Ruins', { runes: this.collectedRunes });
    }
  }
}
