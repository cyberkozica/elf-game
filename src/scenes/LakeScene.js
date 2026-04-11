// src/scenes/LakeScene.js
import SceneBase from '../objects/SceneBase.js';
import Ent from '../objects/Ent.js';
import Rune from '../objects/Rune.js';

// Layout overview (L-shaped path):
//
//   Lake body:       x=80-400, y=75-225
//   Left shore:      x=0-80,   y=70-230 (full height)
//   Right shore:     x=400-480, y=85-145
//   Center island:   x=220-300, y=115-205
//
//   LAVA bridge:     y=85-105,  x=80-400  (hazard — bounce on touch)
//   Lower WOOD bridge: y=185-205, x=80-220  (left shore → island)
//   Upper WOOD bridge: y=120-140, x=300-400 (island → right shore)
//
//   Player path: left shore → lower bridge → island → upper bridge → right shore

export default class LakeScene extends SceneBase {
  constructor() { super('Lake'); }

  create() {
    this._baseCreate('MAGIČNO JEZERO', 0x03080f);

    this.player.sprite.setPosition(40, 210);
    this.player.sprite.body.setSize(14, 14).setOffset(5, 14);

    this._playerStunned = false;
    this._lavaBouncing = false;
    this._entSpokenAfterRune = false;
    this._transitioning = false;

    // ── Lake body (depth 1) ────────────────────────────────
    const lake = this.add.graphics().setDepth(1);
    lake.fillStyle(0x050a1a);
    lake.fillRect(80, 75, 320, 150);
    lake.lineStyle(1, 0x0a1a3a);
    lake.strokeRect(80, 75, 320, 150);

    // ── Shores + island (depth 2) ──────────────────────────
    const shores = this.add.graphics().setDepth(2);
    // Left shore — full scene height
    shores.fillStyle(0x3a2e18);
    shores.fillRect(0, 0, 80, 320);
    // Right shore — full scene height
    shores.fillRect(400, 0, 80, 320);
    // Center island
    shores.fillRect(220, 115, 80, 90);
    // Island edge detail
    shores.fillStyle(0x261e0f);
    shores.fillRect(220, 115, 80, 2);
    shores.fillRect(220, 203, 80, 2);
    shores.fillRect(220, 115, 2, 90);
    shores.fillRect(298, 115, 2, 90);

    // ── Bridge reflections (depth 2) ───────────────────────
    const ref = this.add.graphics().setDepth(2);
    // Lava reflection — reddish shimmer
    ref.fillStyle(0x3a1a0a, 0.6);
    ref.fillRect(80, 91, 320, 8);
    ref.fillStyle(0x4a2a1a, 0.3);
    ref.fillRect(80, 87, 320, 4);
    ref.fillRect(80, 99, 320, 4);
    // Lower wood bridge reflection — blue
    ref.fillStyle(0x1a3a5a, 0.8);
    ref.fillRect(80, 191, 140, 8);
    ref.fillStyle(0x2a4a6a, 0.4);
    ref.fillRect(80, 187, 140, 4);
    ref.fillRect(80, 199, 140, 4);
    // Upper wood bridge reflection — blue
    ref.fillStyle(0x1a3a5a, 0.8);
    ref.fillRect(300, 126, 100, 8);
    ref.fillStyle(0x2a4a6a, 0.4);
    ref.fillRect(300, 122, 100, 4);
    ref.fillRect(300, 134, 100, 4);

    // ── Water physics (6 colliders) ────────────────────────
    this.waterGroup = this.physics.add.staticGroup();

    // W1: above lava (y=75-85)
    const w1 = this.waterGroup.create(240, 80, null);
    w1.setVisible(false).setSize(320, 10).refreshBody();

    // W2: left of island (x=80-220, y=105-185)
    const w2 = this.waterGroup.create(150, 145, null);
    w2.setVisible(false).setSize(140, 80).refreshBody();

    // W3: above island (x=220-300, y=105-115) — blocks lava→island shortcut
    const w3 = this.waterGroup.create(260, 110, null);
    w3.setVisible(false).setSize(80, 10).refreshBody();

    // W4: right of island, above upper bridge (x=300-400, y=105-115)
    const w4 = this.waterGroup.create(350, 110, null);
    w4.setVisible(false).setSize(100, 10).refreshBody();

    // W5: right of island, below upper bridge (x=300-400, y=155-205)
    // Corridor is y=115-155 (40px) — gives 13px clearance for 14px player body
    const w5 = this.waterGroup.create(350, 180, null);
    w5.setVisible(false).setSize(100, 50).refreshBody();

    // W6: bottom of lake (y=205-225)
    const w6 = this.waterGroup.create(240, 215, null);
    w6.setVisible(false).setSize(320, 20).refreshBody();

    this.physics.add.collider(this.player.sprite, this.waterGroup);

    // ── Barrier walls ──────────────────────────────────────
    this.barrierGroup = this.physics.add.staticGroup();
    // Top scene boundary
    const bTop = this.barrierGroup.create(240, 62, null);
    bTop.setVisible(false).setSize(480, 14).refreshBody();
    // Bottom scene boundary
    const bBot = this.barrierGroup.create(240, 238, null);
    bBot.setVisible(false).setSize(480, 14).refreshBody();
    // Right shore south wall (blocks walking off south edge y>145)
    const rsS = this.barrierGroup.create(440, 152, null);
    rsS.setVisible(false).setSize(80, 14).refreshBody();
    // Right shore north wall (blocks gap y=69-85 at x>400)
    const rsN = this.barrierGroup.create(440, 78, null);
    rsN.setVisible(false).setSize(80, 14).refreshBody();
    // Lava right-edge wall — prevents right shore player from drifting left into lava zone
    const lavaWall = this.barrierGroup.create(402, 95, null);
    lavaWall.setVisible(false).setSize(4, 20).refreshBody();
    this.physics.add.collider(this.player.sprite, this.barrierGroup);

    // ── Lava overlap zone ──────────────────────────────────
    this.lavaZone = this.add.zone(240, 95, 320, 20);
    this.physics.add.existing(this.lavaZone, true);
    this.physics.add.overlap(
      this.player.sprite, this.lavaZone, this._onLavaTouch, null, this
    );

    // ── Lava bridge tiles (red/orange, depth 3) ────────────
    this.lavaTiles = [];
    for (let bx = 80; bx < 400; bx += 20) {
      const tile = this.add.graphics().setDepth(3);
      tile.fillStyle(0x8a2200);
      tile.fillRect(1, 0, 18, 16);
      tile.fillStyle(0xff6600, 0.6);
      tile.fillRect(3, 4, 2, 8);
      tile.fillRect(10, 2, 2, 10);
      tile.fillRect(14, 6, 2, 6);
      tile.fillStyle(0xffaa00, 0.4);
      tile.fillRect(7, 5, 3, 3);
      tile.x = bx;
      tile.y = 87;
      tile.setVisible(false);
      this.lavaTiles.push({ tile, bx });
    }

    // ── Lower wooden bridge tiles (left shore → island, depth 3) ──
    this.lowerBridgeTiles = [];
    for (let bx = 80; bx < 220; bx += 20) {
      const tile = this.add.graphics().setDepth(3);
      tile.fillStyle(0x7a6a4a);
      tile.fillRect(1, 0, 18, 16);
      tile.fillStyle(0x4a3a1a);
      tile.fillRect(1, 15, 18, 1);
      tile.x = bx;
      tile.y = 187;
      tile.setVisible(false);
      this.lowerBridgeTiles.push({ tile, bx });
    }

    // ── Upper wooden bridge tiles (island → right shore, depth 3) ──
    // tile.y=148 so top of tile is at y=148, aligns with player feet at y=151
    this.upperBridgeTiles = [];
    for (let bx = 300; bx < 400; bx += 20) {
      const tile = this.add.graphics().setDepth(3);
      tile.fillStyle(0x7a6a4a);
      tile.fillRect(1, 0, 18, 16);
      tile.fillStyle(0x4a3a1a);
      tile.fillRect(1, 15, 18, 1);
      tile.x = bx;
      tile.y = 148;
      tile.setVisible(false);
      this.upperBridgeTiles.push({ tile, bx });
    }

    // ── Trees ──────────────────────────────────────────────
    this._createTrees([
      [30, 50], [450, 50],
      [450, 155], [450, 260],
      [30, 260],
    ]);

    // ── Mushrooms ──────────────────────────────────────────
    this._createMushrooms([[40, 145], [260, 160]]);

    // ── Ent — on right shore ───────────────────────────────
    this.ent = new Ent(this, 430, 115);
    this.ent.graphics.setDepth(3);

    // ── Rune ᚠ — on upper bridge path ─────────────────────
    this.rune = new Rune(this, 350, 130, 'ᚠ');
    this.rune.label.setVisible(false);
  }

  update(_time, delta) {
    if (!this._playerStunned) {
      this._baseUpdate(delta);
    } else {
      this.lantern.update(delta);
      this.hud.update(this.lantern.getEnergy(), this.collectedRunes);
    }
    this._updateMushrooms();
    this._updateBridges();
    this._updateRune();
    this._updateEnt();
    this._checkExit();
  }

  // ── Bridges ────────────────────────────────────────────────

  _updateBridges() {
    const px = this.player.x, py = this.player.y;

    this.lavaTiles.forEach(({ tile, bx }) => {
      tile.setVisible(Phaser.Math.Distance.Between(px, py, bx + 10, 95) < 60);
    });
    this.lowerBridgeTiles.forEach(({ tile, bx }) => {
      tile.setVisible(Phaser.Math.Distance.Between(px, py, bx + 10, 195) < 60);
    });
    this.upperBridgeTiles.forEach(({ tile, bx }) => {
      tile.setVisible(Phaser.Math.Distance.Between(px, py, bx + 10, 130) < 60);
    });
  }

  // ── Lava hazard ────────────────────────────────────────────

  _onLavaTouch() {
    if (this._lavaBouncing) return;
    this._lavaBouncing = true;
    this._playerStunned = true;

    const px = this.player.x, py = this.player.y;

    // Bounce toward nearest shore
    const bounceVx = px < 240 ? -180 : 180;
    const bounceVy = py < 95 ? -120 : 120;
    this.player.sprite.setVelocity(bounceVx, bounceVy);

    // "BOING!" — yellow, above player
    const boing = this.add.text(px, py - 20, 'BOING!', {
      fontSize: '14px', color: '#ffcc00', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(15);

    // "VRUĆE!" — red, below player
    const vruce = this.add.text(px, py + 15, 'VRUĆE!', {
      fontSize: '11px', color: '#ff2200', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(15);

    this.tweens.add({
      targets: boing, alpha: 0, y: boing.y - 15,
      duration: 1200, onComplete: () => boing.destroy()
    });
    this.tweens.add({
      targets: vruce, alpha: 0,
      duration: 1500, onComplete: () => vruce.destroy()
    });

    this.time.delayedCall(400, () => {
      this._playerStunned = false;
    });
    this.time.delayedCall(800, () => {
      this._lavaBouncing = false;
    });
  }

  // ── Rune ᚠ ─────────────────────────────────────────────────

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

  // ── Ent interaction (simplified — no entSpoke flag) ─────────

  _updateEnt() {
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.ent.x, this.ent.y
    );
    if (dist >= 60) return;
    if (!(Phaser.Input.Keyboard.JustDown(this.keyE) || this.touch.actionJustDown())) return;

    // Wake the Ent on first interaction
    if (!this.ent.isAwake()) {
      this.ent.wake();
      this.dialog.show('Drevno drvo', '"Prođi mostom koji vidiš u odrazu vode, ne u stvarnosti."');
      this.time.delayedCall(3500, () => this.dialog.hide());
      return;
    }

    // Toggle dialog off if visible
    if (this.dialog.visible) {
      this.dialog.hide();
      return;
    }

    // Show context-appropriate message
    if (this.rune.isCollected()) {
      this.dialog.show('Drevno drvo', '"Dobro. Špilja kristala čeka te na istoku. Pazi na redoslijed svjetla."');
      this._entSpokenAfterRune = true;
    } else {
      this.dialog.show('Drevno drvo', '"Most je tamo dolje. Traži odraz."');
    }
  }

  // ── Exit ────────────────────────────────────────────────────

  _checkExit() {
    if (this.rune.isCollected() && this._entSpokenAfterRune && this.player.x > 460 && !this._transitioning) {
      this._transitioning = true;
      this.scene.start('Cave', { runes: this.collectedRunes });
    }
  }
}
