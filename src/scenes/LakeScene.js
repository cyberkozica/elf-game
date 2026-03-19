// src/scenes/LakeScene.js
import SceneBase from '../objects/SceneBase.js';
import Ent from '../objects/Ent.js';
import Rune from '../objects/Rune.js';

export default class LakeScene extends SceneBase {
  constructor() { super('Lake'); }

  create() {
    this._baseCreate('MAGIČNO JEZERO', 0x03080f);

    // Player enters from left, at bridge level (y=120)
    this.player.sprite.setPosition(40, 120);
    // Slim physics body (full texture is 42px tall — can't fit through any gap)
    this.player.sprite.body.setSize(14, 20).setOffset(5, 12);
    // Player renders above the lake (depth > 1)
    this.player.sprite.setDepth(5);

    // Lake — drawn at depth 1 so player always appears on top
    const lake = this.add.graphics().setDepth(1);
    lake.fillStyle(0x050a1a);
    lake.fillRect(80, 80, 320, 140);  // x=80-400, y=80-220
    lake.lineStyle(1, 0x0a1a3a);
    lake.strokeRect(80, 80, 320, 140);

    // Visible path on both shores (depth 3, above lake)
    const shores = this.add.graphics().setDepth(3);
    shores.fillStyle(0x5a4a2a);
    shores.fillRect(0, 113, 80, 14);    // left shore
    shores.fillRect(400, 113, 80, 14);  // right shore

    // Reflection strip — visual hint of bridge path
    const ref = this.add.graphics().setDepth(2);
    ref.fillStyle(0x2a4a6a, 0.7);
    ref.fillRect(80, 113, 320, 14);

    // WATER PHYSICS
    // Bridge corridor: y=110-130 (20px gap matches slimmed body height)
    this.waterGroup = this.physics.add.staticGroup();
    const wTop = this.waterGroup.create(240, 95, null);
    wTop.setVisible(false).setSize(320, 30).refreshBody();  // y=80-110
    const wBot = this.waterGroup.create(240, 175, null);
    wBot.setVisible(false).setSize(320, 90).refreshBody();  // y=130-220
    this.physics.add.collider(this.player.sprite, this.waterGroup);

    // BARRIER WALLS — full-width, no vertical workaround possible
    this.barrierGroup = this.physics.add.staticGroup();
    const bTop = this.barrierGroup.create(240, 72, null);
    bTop.setVisible(false).setSize(480, 16).refreshBody();  // y=64-80
    const bBot = this.barrierGroup.create(240, 228, null);
    bBot.setVisible(false).setSize(480, 16).refreshBody();  // y=220-236
    this.physics.add.collider(this.player.sprite, this.barrierGroup);

    // BRIDGE TILES — appear in lantern light, depth 4 (above lake, below player)
    this.bridgeTiles = [];
    for (let bx = 80; bx < 400; bx += 20) {
      const tile = this.add.graphics().setDepth(4);
      tile.fillStyle(0x6a5a3a);
      tile.fillRect(0, 0, 19, 14);
      tile.fillStyle(0x4a3a1a);
      tile.fillRect(0, 13, 19, 1);
      tile.x = bx;
      tile.y = 113;
      tile.setVisible(false);
      this.bridgeTiles.push({ tile, bx });
    }

    this._createTrees([
      [30, 50],  [450, 50],
      [30, 260], [450, 260],
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
