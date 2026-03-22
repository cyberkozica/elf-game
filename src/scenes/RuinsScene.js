// src/scenes/RuinsScene.js
import SceneBase from '../objects/SceneBase.js';
import Ent from '../objects/Ent.js';
import Rune from '../objects/Rune.js';

// Exported for testing
export class PuzzleState {
  constructor(correctSequence) {
    this.correct = correctSequence;
    this.sequence = [];
    this.solved = false;
  }

  press(symbol) {
    if (this.solved) return;
    this.sequence.push(symbol);
    const idx = this.sequence.length - 1;
    if (this.sequence[idx] !== this.correct[idx]) {
      this.sequence = [];
    } else if (this.sequence.length === this.correct.length) {
      this.solved = true;
    }
  }
}

export default class RuinsScene extends SceneBase {
  constructor() { super('Ruins'); }

  create() {
    this._baseCreate('DREVNE RUŠEVINE', 0x080508);

    this.player.sprite.setPosition(40, 160);

    // Stone floor (depth 1 — below player at depth 5)
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

    // Randomize correct sequence each session
    const allSymbols = ['ᚷ', 'ᚱ', 'ᚹ', 'ᚠ'];
    const correctOrder = Phaser.Utils.Array.Shuffle([...allSymbols]);
    this.puzzle = new PuzzleState(correctOrder);

    // Temple wall with hint — shows randomized order, only visible in lantern light
    this.add.graphics().setDepth(1).fillStyle(0x1a1510).fillRect(160, 30, 160, 30);
    this.hintText = this.add.text(240, 45, correctOrder.join(' → '), {
      fontSize: '11px', color: '#5a4a2a', fontFamily: 'serif'
    }).setOrigin(0.5).setDepth(5).setVisible(false);

    // 4 rune pillars — fixed positions, fixed symbols
    const pillarData = [
      { x: 140, y: 130, sym: 'ᚷ' },
      { x: 200, y: 180, sym: 'ᚱ' },
      { x: 280, y: 130, sym: 'ᚹ' },
      { x: 340, y: 180, sym: 'ᚠ' },
    ];
    this.pillars = pillarData.map(({ x, y, sym }) => {
      const g = this.add.graphics().setDepth(2);
      g.fillStyle(0x2a2018);
      g.fillRect(-12, -30, 24, 40);
      g.lineStyle(1, 0x4a3828);
      g.strokeRect(-12, -30, 24, 40);
      g.x = x; g.y = y;

      const label = this.add.text(x, y - 10, sym, {
        fontSize: '14px', color: '#5a5a3a', fontFamily: 'serif'
      }).setOrigin(0.5).setDepth(5);

      const zone = this.add.zone(x, y, 30, 50);
      this.physics.add.existing(zone, true);

      return { g, label, zone, sym, x, y, lit: false };
    });

    // Door (removed when puzzle solved)
    this.door = this.add.graphics();
    this.door.fillStyle(0x1a1510);
    this.door.fillRect(400, 120, 30, 60);
    this.doorOpen = false;

    // Trees
    this._createTrees([[30, 50], [30, 280], [450, 100], [450, 230]]);

    // Mushrooms
    this._createMushrooms([[80, 250], [420, 80]]);

    // Ent — sleeping, wakes when puzzle solved
    this.ent = new Ent(this, 430, 160);

    // Rune ᚹ — hidden until door opens
    this.rune = new Rune(this, 435, 160, 'ᚹ');
    this.rune.label.setVisible(false);
    this.rune.sprite.setVisible(false);

    this._entSpokenAfterRune = false;
    this._transitioning = false;
  }

  update(time, delta) {
    this._baseUpdate(delta);
    this._updateMushrooms();
    this._updateHint();
    this._updatePillars();
    this._updateRune();
    this._updateEnt();
    this._checkExit();
  }

  _updateHint() {
    // Show only after 45 seconds AND only when close to the temple wall
    // Players who figure it out quickly never see the hint
    if (this.time.now < 45000) {
      this.hintText.setVisible(false);
      return;
    }
    const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, 240, 45);
    this.hintText.setVisible(d < 60);
  }

  _updatePillars() {
    if (this.puzzle.solved) return;

    this.pillars.forEach(pillar => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, pillar.x, pillar.y);
      const inLight = d < this.lantern.state.getRadius();

      if (inLight !== pillar.lit) {
        pillar.lit = inLight;
        pillar.label.setColor(inLight ? '#c8c840' : '#5a5a3a');
      }

      if (d < 30 && (Phaser.Input.Keyboard.JustDown(this.keyE) || this.touch.actionJustDown())) {
        const wasLength = this.puzzle.sequence.length;
        this.puzzle.press(pillar.sym);

        if (this.puzzle.sequence.length === 0 && !this.puzzle.solved) {
          // Wrong — flash red
          pillar.label.setColor('#aa2222');
          this.time.delayedCall(300, () => pillar.label.setColor('#5a5a3a'));
          this.dialog.show('', '✦ Krivi redoslijed. Pokušaj ponovo.');
          this.time.delayedCall(1500, () => this.dialog.hide());
          this.pillars.forEach(p => p.label.setColor('#5a5a3a'));
        } else if (this.puzzle.sequence.length > wasLength) {
          // Correct — green
          pillar.label.setColor('#44cc44');
        }

        if (this.puzzle.solved) {
          this._openDoor();
        }
      }
    });
  }

  _openDoor() {
    this.doorOpen = true;
    this.door.clear();
    this.ent.wake();
    this.dialog.show('Drevno drvo', '"Dobro... pamtiš stare runske zakone. Uzmi runu i idi dalje."');
    this.time.delayedCall(3000, () => {
      this.dialog.hide();
      this.rune.sprite.setVisible(true);
      this.rune.label.setVisible(true);
    });
  }

  _updateRune() {
    if (this.rune.isCollected() || !this.doorOpen) return;
    const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.rune.x, this.rune.y);
    const inLight = d < this.lantern.state.getRadius();
    this.rune.label.setVisible(inLight);
    if (inLight && d < 24) {
      this.rune.collect();
      this.collectedRunes.push('ᚹ');
      this.dialog.show('', '✦ Pronašao si runu ᚹ!');
      this.time.delayedCall(2000, () => this.dialog.hide());
    }
  }

  _updateEnt() {
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.ent.x, this.ent.y);
    if (dist < 60 && (Phaser.Input.Keyboard.JustDown(this.keyE) || this.touch.actionJustDown())) {
      if (!this.ent.isAwake()) {
        this.dialog.show('Drevno drvo', '"...zzz... stari stupovi... pamte red... zzz..."');
        this.time.delayedCall(2500, () => this.dialog.hide());
      } else if (!this.dialog.visible) {
        const msg = this.rune.isCollected()
          ? '"Srce šume te čeka na istoku."'
          : '"Skupi runu i idi prema istoku."';
        this.dialog.show('Drevno drvo', msg);
        if (this.rune.isCollected()) this._entSpokenAfterRune = true;
      } else {
        this.dialog.hide();
      }
    }
  }

  _checkExit() {
    if (this.rune.isCollected() && this._entSpokenAfterRune && this.player.x > 460 && !this._transitioning) {
      this._transitioning = true;
      this.scene.start('Heart', { runes: this.collectedRunes });
    }
  }
}
