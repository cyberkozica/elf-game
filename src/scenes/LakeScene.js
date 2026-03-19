// src/scenes/LakeScene.js
import SceneBase from '../objects/SceneBase.js';
import Ent from '../objects/Ent.js';
import Rune from '../objects/Rune.js';

export default class LakeScene extends SceneBase {
  constructor() { super('Lake'); }

  create() {
    this._baseCreate('MAGIČNO JEZERO', 0x03080f);

    this.player.sprite.setPosition(40, 120);
    // Slim physics body so it fits through the 20px bridge corridor
    this.player.sprite.body.setSize(14, 18).setOffset(5, 14);

    // Lake (depth 1, player is depth 5 from _baseCreate)
    const lake = this.add.graphics().setDepth(1);
    lake.fillStyle(0x050a1a);
    lake.fillRect(80, 80, 320, 140);  // x=80-400, y=80-220
    lake.lineStyle(1, 0x0a1a3a);
    lake.strokeRect(80, 80, 320, 140);

    // Visible ground path — clearly shows where to walk
    const ground = this.add.graphics().setDepth(2);
    ground.fillStyle(0x5a4a2a);
    ground.fillRect(0, 112, 80, 16);    // left shore: x=0-80
    ground.fillRect(400, 112, 80, 16);  // right shore: x=400-480
    ground.fillRect(80, 112, 320, 16);  // bridge ground strip (shown over lake)

    // Reflection on water (depth 2)
    const ref = this.add.graphics().setDepth(2);
    ref.fillStyle(0x0a1a3a, 0.6);
    ref.fillRect(80, 80, 320, 30);   // top reflection
    ref.fillStyle(0x0a1a3a, 0.6);
    ref.fillRect(80, 192, 320, 28);  // bottom reflection

    // WATER PHYSICS — blocks the lake area above and below the bridge strip
    // Bridge corridor: y=112-128 (16px, player body is 18px — tight but correct)
    // Actually use y=110-130 for the gap (20px)
    this.waterGroup = this.physics.add.staticGroup();

    // Top water: covers full lake width, y=80-110
    const wTop = this.waterGroup.create(240, 95, null);
    wTop.setVisible(false).setSize(320, 30).refreshBody();  // center 95, half=15: y=80-110

    // Bottom water: covers full lake width, y=130-220
    const wBot = this.waterGroup.create(240, 175, null);
    wBot.setVisible(false).setSize(320, 90).refreshBody();  // center 175, half=45: y=130-220

    this.physics.add.collider(this.player.sprite, this.waterGroup);

    // BARRIER WALLS — full-width horizontal walls prevent going around vertically
    this.barrierGroup = this.physics.add.staticGroup();
    const bTop = this.barrierGroup.create(240, 70, null);
    bTop.setVisible(false).setSize(480, 20).refreshBody();  // y=60-80
    const bBot = this.barrierGroup.create(240, 230, null);
    bBot.setVisible(false).setSize(480, 20).refreshBody();  // y=220-240
    this.physics.add.collider(this.player.sprite, this.barrierGroup);

    // BRIDGE TILES — reveal in lantern light, depth 3 (above lake, below player)
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
