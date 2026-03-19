// src/scenes/LakeScene.js
import SceneBase from '../objects/SceneBase.js';
import Ent from '../objects/Ent.js';
import Rune from '../objects/Rune.js';

export default class LakeScene extends SceneBase {
  constructor() { super('Lake'); }

  create() {
    this._baseCreate('MAGIČNO JEZERO', 0x03080f);

    // Override player start position (entering from left)
    this.player.sprite.setPosition(40, 160);

    // Lake — dark water in center
    const lake = this.add.graphics();
    lake.fillStyle(0x050a1a);
    lake.fillRect(80, 80, 320, 140);
    lake.lineStyle(1, 0x0a1a3a);
    lake.strokeRect(80, 80, 320, 140);

    // Reflection in water (hint for invisible bridge)
    const reflectionGraphics = this.add.graphics();
    reflectionGraphics.fillStyle(0x1a2a4a, 0.7);
    reflectionGraphics.fillRect(140, 105, 200, 6);
    reflectionGraphics.fillStyle(0x2a3a5a, 0.4);
    reflectionGraphics.fillRect(140, 100, 200, 4);

    // Visible shores (only edges)
    const visibleBridge = this.add.graphics();
    visibleBridge.fillStyle(0x3a2a1a);
    visibleBridge.fillRect(80, 116, 60, 8);   // left shore
    visibleBridge.fillRect(340, 116, 60, 8);  // right shore

    // INVISIBLE BRIDGE — physics path, revealed by lantern light
    // One static group for entire bridge, one collider call
    this.bridgeGroup = this.physics.add.staticGroup();
    this.bridgeTiles = [];
    for (let bx = 140; bx < 340; bx += 20) {
      const tile = this.add.graphics();
      tile.fillStyle(0x3a2a1a);
      tile.fillRect(0, -4, 20, 8);
      tile.x = bx;
      tile.y = 120;
      tile.setVisible(false);

      const blocker = this.bridgeGroup.create(bx + 10, 120, null);
      blocker.setVisible(false).setSize(20, 8).refreshBody();
      this.bridgeTiles.push({ tile, bx });
    }
    // One collider for entire bridge
    this.physics.add.collider(this.player.sprite, this.bridgeGroup);

    // Trees around lake
    this._createTrees([
      [30, 50], [60, 280], [440, 50], [450, 280],
      [30, 200], [450, 150]
    ]);

    // Mushrooms
    this._createMushrooms([[50, 130], [440, 130]]);

    // Ent on right shore (already awake — recognizes the elf)
    this.ent = new Ent(this, 420, 160);
    this.ent.wake();

    // Rune ᚠ — at end of invisible bridge
    this.rune = new Rune(this, 320, 120, 'ᚠ');
    this.rune.label.setVisible(false);

    this.entSpoke = false;
    this._transitioning = false;
  }

  update(time, delta) {
    this._baseUpdate(delta);
    this._updateMushrooms();
    this._updateBridge();
    this._updateRune();
    this._updateEnt();
    this._checkExit();
  }

  _updateBridge() {
    const radius = this.lantern.state.getRadius();
    this.bridgeTiles.forEach(({ tile, bx }) => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, bx + 10, 120);
      tile.setVisible(d < radius);
    });
  }

  _updateRune() {
    if (this.rune.isCollected()) return;
    const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.rune.x, this.rune.y);
    const inLight = d < this.lantern.state.getRadius();
    this.rune.label.setVisible(inLight);
    if (inLight && d < 24) {
      this.rune.collect();
      this.collectedRunes.push('ᚠ');
      this.dialog.show('', '✦ Pronašla si runu ᚠ!');
      this.time.delayedCall(2000, () => this.dialog.hide());
    }
  }

  _updateEnt() {
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.ent.x, this.ent.y
    );
    if (dist < 60 && Phaser.Input.Keyboard.JustDown(this.keyE)) {
      if (!this.entSpoke || !this.dialog.visible) {
        this.entSpoke = true;
        this.dialog.show('Drevno drvo',
          this.rune.isCollected()
            ? '"Dobro. Ruševine te čekaju na istoku. Tamo su stari stupovi koji pamte red."'
            : '"Prođi mostom koji vidiš u odrazu vode, ne u stvarnosti."');
      } else {
        this.dialog.hide();
      }
    }
  }

  _checkExit() {
    if (this.rune.isCollected() && this.player.x > 460 && !this._transitioning) {
      this._transitioning = true;
      this.scene.start('Ruins', { runes: this.collectedRunes });
    }
  }
}
