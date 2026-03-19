// src/scenes/LakeScene.js
import SceneBase from '../objects/SceneBase.js';
import Ent from '../objects/Ent.js';
import Rune from '../objects/Rune.js';

export default class LakeScene extends SceneBase {
  constructor() { super('Lake'); }

  create() {
    this._baseCreate('MAGIČNO JEZERO', 0x03080f);

    // Player enters from left AT bridge level — no need to figure out height
    this.player.sprite.setPosition(40, 120);

    // Lake — dark water body
    const lake = this.add.graphics();
    lake.fillStyle(0x050a1a);
    lake.fillRect(80, 80, 320, 140);  // x=80-400, y=80-220
    lake.lineStyle(1, 0x0a1a3a);
    lake.strokeRect(80, 80, 320, 140);

    // Reflection in water — hint for the invisible bridge path
    const ref = this.add.graphics();
    ref.fillStyle(0x2a4a6a, 0.9);
    ref.fillRect(140, 105, 200, 6);
    ref.fillStyle(0x3a5a7a, 0.6);
    ref.fillRect(140, 100, 200, 4);

    // Visible shores connecting player to bridge
    const shores = this.add.graphics();
    shores.fillStyle(0x3a2a1a);
    shores.fillRect(80, 116, 60, 8);   // left shore x=80-140, y=116-124
    shores.fillRect(340, 116, 60, 8);  // right shore x=340-400, y=116-124

    // WATER PHYSICS — solid lake body, gap only at bridge level (y=112-128)
    this.waterGroup = this.physics.add.staticGroup();

    // Top water: x=80-400, y=80-112
    const wTop = this.waterGroup.create(240, 96, null);
    wTop.setVisible(false).setSize(320, 32).refreshBody();

    // Bottom water: x=80-400, y=128-220
    const wBot = this.waterGroup.create(240, 174, null);
    wBot.setVisible(false).setSize(320, 92).refreshBody();

    this.physics.add.collider(this.player.sprite, this.waterGroup);

    // BARRIER WALLS — solid invisible walls above and below the entire lake
    // Prevents player from walking around the lake vertically
    this.barrierGroup = this.physics.add.staticGroup();

    // Top barrier (full width, just above lake)
    const bTop = this.barrierGroup.create(240, 73, null);
    bTop.setVisible(false).setSize(480, 14).refreshBody();  // y=66-80

    // Bottom barrier (full width, just below lake)
    const bBot = this.barrierGroup.create(240, 227, null);
    bBot.setVisible(false).setSize(480, 14).refreshBody();  // y=220-234

    this.physics.add.collider(this.player.sprite, this.barrierGroup);

    // INVISIBLE BRIDGE — one staticGroup, tiles revealed by lantern
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
    this.physics.add.collider(this.player.sprite, this.bridgeGroup);

    // Decorative trees (barriers are walls, trees are just atmosphere)
    this._createTrees([
      [30, 50],  [450, 50],
      [30, 260], [450, 260],
      [30, 160], [450, 160],
      // Trees framing the lake area (decorative)
      [60, 50], [420, 50],
      [60, 260], [420, 260],
    ]);

    // Mushrooms — accessible from bridge level
    this._createMushrooms([[50, 120], [440, 120]]);

    // Ent on right shore (already awake)
    this.ent = new Ent(this, 420, 120);
    this.ent.wake();

    // Rune ᚠ at end of bridge
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
