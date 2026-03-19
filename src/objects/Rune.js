// src/objects/Rune.js
export class RuneState {
  constructor(symbol) {
    this.symbol = symbol;
    this.collected = false;
  }

  collect() {
    this.collected = true;
  }
}

export default class Rune {
  constructor(scene, x, y, symbol) {
    this.state = new RuneState(symbol);
    this.scene = scene;

    // Pixel art runa — mali kamen s runskim simbolom
    this.sprite = scene.add.graphics();
    this._draw(x, y);

    this.hitArea = scene.add.zone(x, y, 24, 24);
    scene.physics.add.existing(this.hitArea, true);
    this.x = x;
    this.y = y;
  }

  _draw(x, y) {
    this.sprite.setDepth(4);
    this.sprite.fillStyle(0x1a1a2a);
    this.sprite.fillRect(x - 10, y - 12, 20, 24);
    this.sprite.lineStyle(1, 0x4a4a8a);
    this.sprite.strokeRect(x - 10, y - 12, 20, 24);

    this.label = this.scene.add.text(x, y, this.state.symbol, {
      fontSize: '12px', color: '#8a8aee', fontFamily: 'serif'
    }).setOrigin(0.5).setDepth(6);
  }

  collect() {
    this.state.collect();
    this.sprite.destroy();
    this.label.destroy();
    this.hitArea.destroy();
  }

  isCollected() {
    return this.state.collected;
  }
}
