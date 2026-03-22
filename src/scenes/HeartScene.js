// src/scenes/HeartScene.js
import SceneBase from '../objects/SceneBase.js';
import Ent from '../objects/Ent.js';
import Rune from '../objects/Rune.js';

export default class HeartScene extends SceneBase {
  constructor() { super('Heart'); }

  create() {
    this._baseCreate('SRCE ŠUME', 0x060a06);

    this.player.sprite.setPosition(40, 160);

    // Sacred glowing ground
    const glow = this.add.graphics();
    glow.fillStyle(0x0a1a0a);
    glow.fillCircle(240, 160, 120);
    glow.lineStyle(1, 0x1a3a1a);
    glow.strokeCircle(240, 160, 120);

    // Rune ring in center (activation zone)
    this.portalRing = this.add.graphics();
    this.portalRing.lineStyle(2, 0x2a4a2a);
    this.portalRing.strokeCircle(240, 160, 40);

    // 5 runes on the ring
    const ringRunes = ['ᚱ', 'ᚠ', 'ᛩ', 'ᚹ', 'ᚷ'];
    const ringAngles = [0, 72, 144, 216, 288];
    this.ringRuneTexts = ringAngles.map((angle, i) => {
      const rad = (angle - 90) * Math.PI / 180;
      const rx = 240 + Math.cos(rad) * 40;
      const ry = 160 + Math.sin(rad) * 40;
      return this.add.text(rx, ry, ringRunes[i], {
        fontSize: '12px', color: '#2a4a2a', fontFamily: 'serif'
      }).setOrigin(0.5).setDepth(5);
    });

    // Portal (inactive initially)
    this.portal = this.add.graphics();
    this.portalActivated = false;

    // Trees around edges
    this._createTrees([
      [30, 50], [100, 30], [380, 30], [450, 50],
      [30, 270], [450, 270]
    ]);

    // Mushrooms
    this._createMushrooms([[80, 80], [400, 250]]);

    // ENT — holds the last rune
    this.ent = new Ent(this, 390, 160);

    // Last rune ᚷ — hidden inside the Ent, revealed when lit
    this.lastRune = new Rune(this, 390, 160, 'ᚷ');
    this.lastRune.label.setVisible(false);
    this.lastRune.sprite.setVisible(false);

    this._runeRevealed = false;
    this._transitioning = false;
  }

  update(time, delta) {
    this._baseUpdate(delta);
    this._updateMushrooms();
    this._updateEnt();
    this._updateLastRune();
    this._updatePortal();
    this._updateRingGlow();
  }

  _updateEnt() {
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.ent.x, this.ent.y
    );
    const inLight = dist < this.lantern.state.getRadius();

    // Ent wakes when light first touches it — but rune stays hidden until E is pressed
    if (inLight && !this.ent.isAwake()) {
      this.ent.wake();
      this.dialog.show('Drevno drvo',
        '"Ti si stigao... Osjećam svjetlo tvoje svjetiljke. Moja sjemenka — runa ᚷ — tvoja je. Priđi bliže."');
      this.time.delayedCall(3500, () => this.dialog.hide());
    }

    if (dist < 60 && (Phaser.Input.Keyboard.JustDown(this.keyE) || this.touch.actionJustDown())) {
      if (!this.ent.isAwake()) return;

      if (!this._runeRevealed) {
        // First E press near awake ent — reveal the rune
        this._runeRevealed = true;
        this.lastRune.sprite.setVisible(true);
        this.lastRune.label.setVisible(true);
        this.dialog.show('', '✦ Uzmi runu ᚷ iz srca enta!');
        this.time.delayedCall(2000, () => this.dialog.hide());
      } else if (!this.dialog.visible) {
        this.dialog.show('Drevno drvo',
          this.lastRune.isCollected()
            ? '"Stani na runski krug i pritisni E. Portal te čeka."'
            : '"Uzmi runu iz mog srca."');
      } else {
        this.dialog.hide();
      }
    }
  }

  _updateLastRune() {
    if (this.lastRune.isCollected() || !this._runeRevealed) return;
    const d = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.lastRune.x, this.lastRune.y
    );
    const inLight = d < this.lantern.state.getRadius();
    this.lastRune.label.setVisible(inLight);
    if (inLight && d < 24) {
      this.lastRune.collect();
      this.collectedRunes.push('ᚷ');
      this.dialog.show('', '✦ Pronašao si posljednju runu ᚷ!');
      this.time.delayedCall(2000, () => this.dialog.hide());
    }
  }

  _updateRingGlow() {
    // Highlight ring runes as they are collected
    const allRunes = ['ᚱ', 'ᚠ', 'ᛩ', 'ᚹ', 'ᚷ'];
    this.ringRuneTexts.forEach((t, i) => {
      t.setColor(this.collectedRunes.includes(allRunes[i]) ? '#c8c840' : '#2a4a2a');
    });
  }

  _updatePortal() {
    if (this.portalActivated) return;
    const allCollected = ['ᚱ', 'ᚠ', 'ᛩ', 'ᚹ', 'ᚷ'].every(r => this.collectedRunes.includes(r));
    if (!allCollected) return;

    // Pulse ring when all runes collected
    const t = this.time.now / 500;
    this.portalRing.clear();
    this.portalRing.lineStyle(2, 0x3a6a3a, 0.7 + 0.3 * Math.sin(t));
    this.portalRing.strokeCircle(240, 160, 40);

    // Activate portal when player stands on ring and presses E
    const distToCenter = Phaser.Math.Distance.Between(this.player.x, this.player.y, 240, 160);
    if (distToCenter < 40 && (Phaser.Input.Keyboard.JustDown(this.keyE) || this.touch.actionJustDown())) {
      this._activatePortal();
    }
  }

  _activatePortal() {
    this.portalActivated = true;

    this.portal.fillStyle(0x3aaa3a, 0.3);
    this.portal.fillCircle(240, 160, 30);

    this.dialog.show('Drevno drvo',
      '"Šuma te pušta. Pronašao si put kući. Idi, slobodan si."');

    this.time.delayedCall(3000, () => {
      if (!this._transitioning) {
        this._transitioning = true;
        this.scene.start('End');
      }
    });
  }
}
