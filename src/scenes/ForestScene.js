// src/scenes/ForestScene.js
import Player from '../objects/Player.js';
import Lantern from '../objects/Lantern.js';
import HUD from '../ui/HUD.js';
import Ent from '../objects/Ent.js';
import DialogBox from '../ui/DialogBox.js';
import Rune from '../objects/Rune.js';
import TouchControls from '../ui/TouchControls.js';

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

    // Kratki hint za kontrole — nestane nakon 5 sekundi
    const ctrlHint = this.add.text(240, 295, '[ ← ↑ → ↓ ] kretanje    [ E ] razgovor / akcija', {
      fontSize: '8px', color: '#4a6a4a', letterSpacing: 1
    }).setOrigin(0.5, 1).setDepth(20);
    this.time.delayedCall(5000, () => {
      this.tweens.add({ targets: ctrlHint, alpha: 0, duration: 1000, onComplete: () => ctrlHint.destroy() });
    });

    this.collectedRunes = [];
    this.hud = new HUD(this);

    this.ent = new Ent(this, 380, 200);
    this.dialog = new DialogBox(this);

    // Runa skrivena — vidljiva samo u radijusu svjetla
    this.rune = new Rune(this, 150, 160, 'ᚱ');
    this.rune.label.setVisible(false); // Skrivena dok svjetlo ne dođe

    // Tipka E za interakciju
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Svjetleće gljive — punjenje svjetiljke
    this.lightSources = [];
    const sourcePositions = [[100, 100], [300, 250]];
    sourcePositions.forEach(([x, y]) => {
      const g = this.add.graphics();
      // Stabljika gljive
      g.fillStyle(0xc8a870);
      g.fillRect(-4, 2, 8, 7);
      // Klobuk gljive (crvenkasto-smeđi polukrug)
      g.fillStyle(0xaa4422);
      g.fillCircle(0, 0, 9);
      // Bijele točkice na klobuku
      g.fillStyle(0xffffff);
      g.fillRect(-5, -5, 3, 3);
      g.fillRect(2, -7, 3, 3);
      g.fillRect(-1, -2, 2, 2);
      // Sjaj
      g.fillStyle(0xff6644, 0.5);
      g.fillCircle(0, -2, 5);
      g.x = x;
      g.y = y;

      const zone = this.add.zone(x, y, 20, 20);
      this.physics.add.existing(zone, true);
      this.lightSources.push({ graphics: g, zone, x, y, used: false });
    });

    // Ent blokira prolaz desno dok nije budan (spec: "Ent blokira prolaz prema jezeru")
    this.entBlocker = this.physics.add.staticGroup();
    const eb = this.entBlocker.create(380, 160, null);
    eb.setVisible(false).setSize(40, 120).refreshBody();
    this.physics.add.collider(this.player.sprite, this.entBlocker);

    // Izlaz prema jezeru — desni rub ekrana
    this.exitArrow = this.add.text(462, 155, '▶', {
      fontSize: '14px', color: '#ffe066'
    }).setOrigin(0.5).setDepth(15).setVisible(false);
    this.exitLabel = this.add.text(445, 170, 'JEZERO', {
      fontSize: '7px', color: '#8a7a1a', letterSpacing: 2
    }).setOrigin(0.5).setDepth(15).setVisible(false);

    this._transitioning = false;
    this.touch = new TouchControls(this);
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
    this.player.update(this.touch);
    this.lantern.update(delta);
    this.hud.update(this.lantern.getEnergy(), this.collectedRunes);

    // Provjeri blizinu Enta i interakciju
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.ent.x, this.ent.y
    );

    if (dist < 60 && (Phaser.Input.Keyboard.JustDown(this.keyE) || this.touch.actionJustDown())) {
      if (!this.ent.isAwake()) {
        this.ent.wake();
        this.audio.entWake();
        this.dialog.show('Drevno drvo',
          '"Ah... svjetlo... dugo nisam osjetio toplinu. Pronađi runski kamen, mladi vilenjače."');
      } else if (!this.dialog.visible) {
        this.dialog.show('Drevno drvo',
          '"Slijedi sjaj rune prema zapadu."');
      } else {
        this.dialog.hide();
      }
    }

    // Otkrij runu ako je svjetlo blizu
    if (!this.rune.isCollected()) {
      const distToRune = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.rune.x, this.rune.y
      );
      const inLight = distToRune < this.lantern.state.getRadius();
      this.rune.label.setVisible(inLight);

      // Skupi runu dodirom
      if (inLight && distToRune < 24) {
        this.rune.collect();
        this.collectedRunes.push('ᚱ');
        this.audio.rune();
        this.dialog.show('', '✦ Pronašao si runu ᚱ!');
        this.time.delayedCall(2000, () => this.dialog.hide());
      }
    }

    // Provjeri izvore svjetlosti
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

    // Ukloni blokator i pokaži izlaz kad je runa skupljena i Ent budan
    if (this.rune.isCollected() && this.ent.isAwake()) {
      // Ukloni fizički blokator (Ent više ne blokira put)
      if (this.entBlocker.getLength() > 0) {
        this.entBlocker.clear(true, true);
      }
      this.exitArrow.setVisible(true);
      this.exitLabel.setVisible(true);

      // Prijelaz kad vilenjak dođe do desnog ruba
      if (this.player.x > 460 && !this._transitioning) {
        this._transitioning = true;
        this.scene.start('Lake', { runes: this.collectedRunes });
      }
    }
  }
}
