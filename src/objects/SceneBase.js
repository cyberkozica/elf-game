// src/objects/SceneBase.js
import Player from './Player.js';
import Lantern from './Lantern.js';
import HUD from '../ui/HUD.js';
import DialogBox from '../ui/DialogBox.js';
import TouchControls from '../ui/TouchControls.js';

export default class SceneBase extends Phaser.Scene {
  // Call from each subclass in create()
  _baseCreate(areaName, bgColor = 0x050f05) {
    // Background
    this.add.rectangle(240, 160, 480, 320, bgColor);

    // Player — subclass overrides position with setPosition() after _baseCreate()
    this.player = new Player(this, 60, 160);
    this.player.sprite.setDepth(5);  // always above scenery (depth 1-4)

    // Lantern
    this.lantern = new Lantern(this, this.player);

    // HUD — collectedRunes passed in via scene.start() data
    this.collectedRunes = this.sys.settings.data?.runes ?? [];
    this.hud = new HUD(this);

    // Dialog
    this.dialog = new DialogBox(this);

    // E key
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Area name label
    this.add.text(240, 10, areaName, {
      fontSize: '10px', color: '#2d5a27', letterSpacing: 3
    }).setOrigin(0.5, 0).setDepth(15);

    // World bounds
    this.physics.world.setBounds(0, 0, 480, 320);

    // Touch controls (no-op on desktop)
    this.touch = new TouchControls(this);
  }

  // Call from each subclass in update()
  _baseUpdate(delta) {
    this.player.update(this.touch);
    this.lantern.update(delta);
    this.hud.update(this.lantern.getEnergy(), this.collectedRunes);
  }

  // Draw mushroom pickups and set up refill zones
  _createMushrooms(positions) {
    this.lightSources = [];
    positions.forEach(([x, y]) => {
      const g = this.add.graphics();
      // Stem
      g.fillStyle(0xc8a870);
      g.fillRect(-4, 2, 8, 7);
      // Cap
      g.fillStyle(0xaa4422);
      g.fillCircle(0, 0, 9);
      // White spots
      g.fillStyle(0xffffff);
      g.fillRect(-5, -5, 3, 3);
      g.fillRect(2, -7, 3, 3);
      g.fillRect(-1, -2, 2, 2);
      // Glow
      g.fillStyle(0xff6644, 0.5);
      g.fillCircle(0, -2, 5);
      g.x = x;
      g.y = y;
      const zone = this.add.zone(x, y, 20, 20);
      this.physics.add.existing(zone, true);
      this.lightSources.push({ graphics: g, zone, x, y, used: false });
    });
  }

  // Call from subclass update() to check mushroom pickups
  _updateMushrooms() {
    this.lightSources.forEach(src => {
      if (src.used) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, src.x, src.y);
      if (d < 20) {
        this.lantern.refill();
        src.used = true;
        src.graphics.setAlpha(0.2);
        this.dialog.show('', '✦ Svjetiljka se napunila!');
        this.time.delayedCall(1500, () => this.dialog.hide());
      }
    });
  }

  // Draw trees with physics blockers
  _createTrees(positions) {
    this.treesGroup = this.physics.add.staticGroup();
    positions.forEach(([x, y]) => {
      const g = this.add.graphics();
      g.fillStyle(0x0f2a0f);
      g.fillTriangle(x, y - 30, x - 18, y + 10, x + 18, y + 10);
      g.fillStyle(0x1a0f05);
      g.fillRect(x - 5, y + 10, 10, 14);
      const blocker = this.treesGroup.create(x, y, null);
      blocker.setVisible(false).setSize(28, 40).refreshBody();
    });
    // Add collider AFTER creating treesGroup (player already created by _baseCreate)
    this.physics.add.collider(this.player.sprite, this.treesGroup);
  }
}
