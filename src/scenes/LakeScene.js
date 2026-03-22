// src/scenes/LakeScene.js
import SceneBase from '../objects/SceneBase.js';
import Ent from '../objects/Ent.js';
import Rune from '../objects/Rune.js';

// Layout overview:
//   Lake: x=80-400, y=75-225
//   Player starts: x=40, y=210 (bottom of left shore)
//   Bridge corridor: y=85-105 (center y=95)
//   Left shore: x=0-80, full height — walk UP to find the bridge entrance
//   Right shore: x=400-480, y=85-105 (only at bridge level)
//   Player body 14×14 at y=95: top=88, bottom=102 → fits corridor 85-105

export default class LakeScene extends SceneBase {
  constructor() { super('Lake'); }

  create() {
    this._baseCreate('MAGIČNO JEZERO', 0x03080f);

    // Start at bottom of left shore — player must explore up to find the bridge
    this.player.sprite.setPosition(40, 210);
    this.player.sprite.body.setSize(14, 14).setOffset(5, 14);

    // Lake body (depth 1)
    const lake = this.add.graphics().setDepth(1);
    lake.fillStyle(0x050a1a);
    lake.fillRect(80, 75, 320, 150);   // x=80-400, y=75-225
    lake.lineStyle(1, 0x0a1a3a);
    lake.strokeRect(80, 75, 320, 150);

    // Left shore — full height strip, clearly visible as a walkable path
    const shores = this.add.graphics().setDepth(2);
    shores.fillStyle(0x5a4a2a);
    shores.fillRect(0, 70, 80, 160);   // left shore x=0-80, y=70-230
    shores.fillRect(400, 85, 80, 20);  // right shore x=400-480, y=85-105

    // Bridge reflection — horizontal hint visible across the lake at bridge level
    const ref = this.add.graphics().setDepth(2);
    ref.fillStyle(0x1a3a5a, 0.8);
    ref.fillRect(80, 91, 320, 8);   // main strip at y=91-99
    ref.fillStyle(0x2a4a6a, 0.4);
    ref.fillRect(80, 87, 320, 4);   // soft edge above
    ref.fillRect(80, 99, 320, 4);   // soft edge below

    // WATER PHYSICS
    // Player body at y=95: top=88, bottom=102. Corridor y=85-105 (20px gap).
    this.waterGroup = this.physics.add.staticGroup();
    const wTop = this.waterGroup.create(240, 80, null);
    wTop.setVisible(false).setSize(320, 10).refreshBody();   // y=75-85
    const wBot = this.waterGroup.create(240, 165, null);
    wBot.setVisible(false).setSize(320, 120).refreshBody();  // y=105-225
    this.physics.add.collider(this.player.sprite, this.waterGroup);

    // Full-width barrier walls — prevent going above/below the scene
    this.barrierGroup = this.physics.add.staticGroup();
    const bTop = this.barrierGroup.create(240, 62, null);
    bTop.setVisible(false).setSize(480, 14).refreshBody();   // y=55-69
    const bBot = this.barrierGroup.create(240, 238, null);
    bBot.setVisible(false).setSize(480, 14).refreshBody();   // y=231-245
    this.physics.add.collider(this.player.sprite, this.barrierGroup);

    // BRIDGE TILES — appear only within 60px of player
    this.bridgeTiles = [];
    for (let bx = 80; bx < 400; bx += 20) {
      const tile = this.add.graphics().setDepth(3);
      tile.fillStyle(0x7a6a4a);
      tile.fillRect(1, 0, 18, 16);
      tile.fillStyle(0x4a3a1a);
      tile.fillRect(1, 15, 18, 1);
      tile.x = bx;
      tile.y = 87;
      tile.setVisible(false);
      this.bridgeTiles.push({ tile, bx });
    }

    this._createTrees([
      [30, 50],  [450, 50],
      [450, 155], [450, 260],
      [30, 260],
    ]);

    // Mushroom on left shore (middle) — reward for walking up
    this._createMushrooms([[40, 145], [435, 95]]);

    this.ent = new Ent(this, 430, 95);
    this.ent.wake();

    this.rune = new Rune(this, 290, 95, 'ᚠ');
    this.rune.label.setVisible(false);

    this.entSpoke = false;
    this._entSpokenAfterRune = false;
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
    this.bridgeTiles.forEach(({ tile, bx }) => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, bx + 10, 95);
      tile.setVisible(d < 60);
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
      this.dialog.show('', '✦ Pronašao si runu ᚠ!');
      this.time.delayedCall(2000, () => this.dialog.hide());
    }
  }

  _updateEnt() {
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.ent.x, this.ent.y
    );
    if (dist < 60 && (Phaser.Input.Keyboard.JustDown(this.keyE) || this.touch.actionJustDown())) {
      if (!this.entSpoke || !this.dialog.visible) {
        this.entSpoke = true;
        const msg = this.rune.isCollected()
          ? '"Dobro. Špilja kristala čeka te na istoku. Pazi na redoslijed svjetla."'
          : '"Prođi mostom koji vidiš u odrazu vode, ne u stvarnosti."';
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
      this.scene.start('Cave', { runes: this.collectedRunes });
    }
  }
}
