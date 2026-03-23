// src/scenes/StatueScene.js
import SceneBase from '../objects/SceneBase.js';
import Ent from '../objects/Ent.js';
import Rune from '../objects/Rune.js';

// Exported for testing
export class StatueState {
  constructor() {
    this.realIndex = Math.floor(Math.random() * 4);
  }
  isReal(index) {
    return index === this.realIndex;
  }
}

export default class StatueScene extends SceneBase {
  constructor() { super('Statue'); }

  create() {
    this._baseCreate('DVORANA KIPOVA', 0x080508);

    this.player.sprite.setPosition(40, 160);

    // If runa ᛈ already collected (shouldn't happen in normal flow) — open door
    this._alreadySolved = this.sys.settings.data?.runes?.includes('ᛈ') ?? false;

    // Stone floor
    const floor = this.add.graphics().setDepth(1);
    floor.fillStyle(0x1a1510);
    floor.fillRect(60, 60, 360, 200);
    floor.lineStyle(1, 0x2a2018);
    for (let fx = 60; fx < 420; fx += 40) {
      floor.lineBetween(fx, 60, fx, 260);
    }
    for (let fy = 60; fy < 260; fy += 40) {
      floor.lineBetween(60, fy, 420, fy);
    }

    // Decorative columns (visual only — world bounds handle edges)
    const cols = this.add.graphics().setDepth(2);
    cols.fillStyle(0x2a2018);
    [[30, 110], [30, 210], [450, 110], [450, 210]].forEach(([cx, cy]) => {
      cols.fillRect(cx - 8, cy - 25, 16, 50);
    });

    // Door (locked until real Ent chosen)
    this.door = this.add.graphics().setDepth(2);
    this.doorOpen = false;
    this._drawDoor(false);

    // Mushrooms
    this._createMushrooms([[80, 250], [400, 80]]);

    // Randomize which Ent is real and which materials are statues
    this.statueState = new StatueState();
    const materials = ['bronze', 'silver', 'gold'];
    const positions = [[185, 110], [295, 110], [185, 210], [295, 210]];

    // Distribute materials: real Ent gets 'wood', others get the 3 statue materials
    const shuffledMaterials = Phaser.Utils.Array.Shuffle([...materials]);
    let matIdx = 0;

    this.ents = positions.map(([ex, ey], i) => {
      const isReal = this.statueState.isReal(i);
      const mat = isReal ? 'wood' : shuffledMaterials[matIdx++];
      return { ent: new Ent(this, ex, ey, { material: mat }), x: ex, y: ey, isReal, mat };
    });

    // Rune ᛈ — hidden until real Ent is chosen
    this.rune = new Rune(this, 240, 160, 'ᛈ');
    this.rune.label.setVisible(false);
    this.rune.sprite.setVisible(false);

    this._transitioning = false;
    this._revealed = false;
    this._hintActive = false;
    this._sceneStartTime = this.time.now;

    if (this._alreadySolved) {
      this._openDoor();
    }
  }

  update(time, delta) {
    this._baseUpdate(delta);
    this._updateMushrooms();
    this._updateHint();
    this._updateEnts();
    this._updateRune();
    this._checkExit();
  }

  _drawDoor(open) {
    this.door.clear();
    if (!open) {
      this.door.fillStyle(0x1a1510);
      this.door.fillRect(400, 120, 30, 60);
    }
  }

  _openDoor() {
    this.doorOpen = true;
    this._drawDoor(true);
  }

  _updateHint() {
    if (this._hintActive || this._revealed) return;
    if (this.time.now - this._sceneStartTime < 60000) return;
    this._hintActive = true;
    const realEntData = this.ents.find(e => e.isReal);
    if (realEntData) realEntData.ent.setHintGlow(true);
  }

  _updateEnts() {
    if (this._revealed || this._transitioning) return;
    this.ents.forEach((entData) => {
      const d = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, entData.x, entData.y
      );
      if (d < 60 && (Phaser.Input.Keyboard.JustDown(this.keyE) || this.touch.actionJustDown())) {
        if (entData.isReal) {
          this._solveCorrect(entData);
        } else {
          this._solveWrong();
        }
      }
    });
  }

  _solveCorrect(entData) {
    this._revealed = true;
    if (this._hintActive) entData.ent.setHintGlow(false);
    // Show rune near the real Ent
    this.rune.sprite.setPosition(entData.x, entData.y + 20);
    this.rune.label.setPosition(entData.x, entData.y + 20);
    this.rune.sprite.setVisible(true);
    this.rune.label.setVisible(true);
    this._openDoor();
  }

  _solveWrong() {
    this._revealed = true;
    // Shake all four Ents
    this.ents.forEach(entData => {
      this.tweens.add({
        targets: entData.ent.graphics,
        x: { from: entData.x - 3, to: entData.x + 3 },
        duration: 80,
        yoyo: true,
        repeat: 2,
      });
    });
    // Reveal statue materials after shake
    this.time.delayedCall(300, () => {
      const matColors = { bronze: 0xcd7f32, silver: 0xc0c0c0, gold: 0xffd700 };
      this.ents.forEach(entData => {
        if (!entData.isReal) {
          entData.ent.revealMaterial(matColors[entData.mat]);
        }
      });
      this.dialog.show('', '"Kažnjen si vraćanjem u ruševine!"');
    });
    // Transition back to Ruins after 2500ms
    this.time.delayedCall(2500, () => {
      if (!this._transitioning) {
        this._transitioning = true;
        this.scene.start('Ruins', { runes: this.collectedRunes, fromStatue: true });
      }
    });
  }

  _updateRune() {
    if (this.rune.isCollected() || !this.doorOpen || !this._revealed) return;
    const d = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.rune.x, this.rune.y
    );
    const inLight = d < this.lantern.state.getRadius();
    this.rune.label.setVisible(inLight);
    if (inLight && d < 24) {
      this.rune.collect();
      this.collectedRunes.push('ᛈ');
      this.dialog.show('', '✦ Pronašao si runu ᛈ!');
      this.time.delayedCall(2000, () => this.dialog.hide());
    }
  }

  _checkExit() {
    if (this.rune.isCollected() && this.player.x > 460 && !this._transitioning) {
      this._transitioning = true;
      this.scene.start('Heart', { runes: this.collectedRunes });
    }
  }
}
