// src/scenes/ForestScene.js
import Player from '../objects/Player.js';
import Lantern from '../objects/Lantern.js';
import HUD from '../ui/HUD.js';
import Ent from '../objects/Ent.js';
import DialogBox from '../ui/DialogBox.js';

export default class ForestScene extends Phaser.Scene {
  constructor() { super('Forest'); }

  create() {
    // Tamna pozadina — šuma
    this.add.rectangle(240, 160, 480, 320, 0x050f05);

    // Drveće kao statični blokatori (pixel art trokuti)
    this._createTrees();

    // Vilenjak
    this.player = new Player(this, 240, 220);

    // Svjetiljka
    this.lantern = new Lantern(this, this.player);

    // Kolizije za drveće
    this.physics.add.collider(this.player.sprite, this.treesGroup);

    // Granice svijeta
    this.physics.world.setBounds(0, 0, 480, 320);

    // Naziv područja
    this.add.text(240, 10, 'ULAZ U ŠUMU', {
      fontSize: '10px', color: '#2d5a27', letterSpacing: 3
    }).setOrigin(0.5, 0);

    this.collectedRunes = [];
    this.hud = new HUD(this);

    this.ent = new Ent(this, 380, 200);
    this.dialog = new DialogBox(this);

    // Tipka E za interakciju
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  _createTrees() {
    this.treesGroup = this.physics.add.staticGroup();

    const positions = [
      [60, 60], [140, 40], [340, 55], [410, 70],
      [30, 160], [80, 200], [420, 150], [450, 200],
      [150, 280], [360, 270]
    ];

    positions.forEach(([x, y]) => {
      const g = this.add.graphics();
      g.fillStyle(0x0f2a0f);
      g.fillTriangle(x, y - 30, x - 18, y + 10, x + 18, y + 10);
      g.fillStyle(0x1a0f05);
      g.fillRect(x - 5, y + 10, 10, 14);

      // Nevidljivi fizički blokator
      const blocker = this.treesGroup.create(x, y, null);
      blocker.setVisible(false).setSize(28, 40).refreshBody();
    });
  }

  update(time, delta) {
    this.player.update();
    this.lantern.update(delta);
    this.hud.update(this.lantern.getEnergy(), this.collectedRunes);

    // Provjeri blizinu Enta i interakciju
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.ent.x, this.ent.y
    );

    if (dist < 60 && Phaser.Input.Keyboard.JustDown(this.keyE)) {
      if (!this.ent.isAwake()) {
        this.ent.wake();
        this.dialog.show('Drevno drvo',
          '"Ah... svjetlo... dugo nisam osjetio toplinu. Pronađi runski kamen, mladi vilenjače."');
      } else if (!this.dialog.visible) {
        this.dialog.show('Drevno drvo',
          '"Slijedi sjaj rune prema sjeveru."');
      } else {
        this.dialog.hide();
      }
    }
  }
}
