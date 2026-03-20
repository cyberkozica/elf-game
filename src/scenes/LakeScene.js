// src/scenes/LakeScene.js
import SceneBase from '../objects/SceneBase.js';
import Ent from '../objects/Ent.js';
import Rune from '../objects/Rune.js';

export default class LakeScene extends SceneBase {
  constructor() { super('Lake'); }

  create() {
    this._baseCreate('MAGIČNO JEZERO', 0x03080f);

    this.player.sprite.setPosition(40, 120);
    // Body 14×14 centered in corridor. Sprite is 24×42, origin center.
    // Sprite top = 120-21 = 99. Body top = 99+14 = 113. Body bottom = 113+14 = 127.
    // wTop ends y=108, wBot starts y=132 → 24px gap, body fits easily.
    this.player.sprite.body.setSize(14, 14).setOffset(5, 14);

    // Lake (depth 1, player depth 5 from _baseCreate)
    const lake = this.add.graphics().setDepth(1);
    lake.fillStyle(0x050a1a);
    lake.fillRect(80, 80, 320, 140);
    lake.lineStyle(1, 0x0a1a3a);
    lake.strokeRect(80, 80, 320, 140);

    // Visible shores (left and right of lake only — no strip over water)
    const shores = this.add.graphics().setDepth(2);
    shores.fillStyle(0x5a4a2a);
    shores.fillRect(0, 112, 80, 16);    // left shore x=0-80
    shores.fillRect(400, 112, 80, 16);  // right shore x=400-480

    // Bridge reflection — horizontal lighter strip in water hints at the path
    // Visible at all times (it's a reflection, not the bridge itself)
    const ref = this.add.graphics().setDepth(2);
    ref.fillStyle(0x1a3a5a, 0.7);
    ref.fillRect(80, 116, 320, 8);   // main reflection strip at bridge level
    ref.fillStyle(0x2a4a6a, 0.4);
    ref.fillRect(80, 112, 320, 4);   // soft edge above
    ref.fillRect(80, 124, 320, 4);   // soft edge below

    // WATER PHYSICS
    // Player body: top y=113, bottom y=127. Corridor must contain y=113-127.
    this.waterGroup = this.physics.add.staticGroup();
    const wTop = this.waterGroup.create(240, 94, null);
    wTop.setVisible(false).setSize(320, 28).refreshBody();  // y=80-108
    const wBot = this.waterGroup.create(240, 176, null);
    wBot.setVisible(false).setSize(320, 88).refreshBody();  // y=132-220
    this.physics.add.collider(this.player.sprite, this.waterGroup);

    // BARRIER WALLS — full-width, no way around lake vertically
    this.barrierGroup = this.physics.add.staticGroup();
    const bTop = this.barrierGroup.create(240, 70, null);
    bTop.setVisible(false).setSize(480, 20).refreshBody();  // y=60-80
    const bBot = this.barrierGroup.create(240, 230, null);
    bBot.setVisible(false).setSize(480, 20).refreshBody();  // y=220-240
    this.physics.add.collider(this.player.sprite, this.barrierGroup);

    // BRIDGE TILES — appear only when very close (d<60), not by full lantern radius
    // This preserves the invisible bridge illusion even with a bright lantern
    this.bridgeTiles = [];
    for (let bx = 80; bx < 400; bx += 20) {
      const tile = this.add.graphics().setDepth(3);
      tile.fillStyle(0x7a6a4a);
      tile.fillRect(1, 0, 18, 16);
      tile.fillStyle(0x4a3a1a);
      tile.fillRect(1, 15, 18, 1);
      tile.x = bx;
      tile.y = 112;
      tile.setVisible(false);
      this.bridgeTiles.push({ tile, bx });
    }

    this._createTrees([
      [30, 50],  [450, 50],
      [30, 265], [450, 265],
      [30, 165], [450, 165],
    ]);

    this._createMushrooms([[50, 120], [440, 120]]);

    this.ent = new Ent(this, 420, 120);
    this.ent.wake();

    this.rune = new Rune(this, 300, 120, 'ᚠ');
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
    // Show only tiles within 60px — player discovers bridge step by step
    this.bridgeTiles.forEach(({ tile, bx }) => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, bx + 10, 120);
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
