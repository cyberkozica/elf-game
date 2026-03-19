// src/objects/Ent.js
export default class Ent {
  constructor(scene, x, y) {
    this.scene = scene;
    this.awake = false;
    this.x = x;
    this.y = y;

    this.graphics = scene.add.graphics();
    this._draw();

    // Zona za interakciju
    this.zone = scene.add.zone(x, y, 60, 80);
    scene.physics.add.existing(this.zone, true);
  }

  _draw() {
    const { x, y, awake } = this;
    this.graphics.clear();

    // Tijelo enta
    this.graphics.fillStyle(awake ? 0x2a1a05 : 0x1a1208);
    this.graphics.fillRect(x - 18, y - 40, 36, 55);

    // Oči
    const eyeColor = awake ? 0xc8a040 : 0x3a2808;
    this.graphics.fillStyle(eyeColor);
    this.graphics.fillRect(x - 8, y - 30, 6, 6);
    this.graphics.fillRect(x + 2, y - 30, 6, 6);

    // Usta (samo kad je budan)
    if (awake) {
      this.graphics.fillStyle(0xc8a040);
      this.graphics.fillRect(x - 6, y - 18, 12, 3);
    }

    // Grane
    this.graphics.fillStyle(awake ? 0x2a1a05 : 0x120e06);
    this.graphics.fillRect(x - 26, y - 35, 10, 4);
    this.graphics.fillRect(x + 16, y - 35, 10, 4);
    this.graphics.fillRect(x - 4, y - 56, 8, 18);

    // Krošnja
    this.graphics.fillStyle(awake ? 0x1a4a10 : 0x0f2a0a);
    this.graphics.fillCircle(x, y - 60, 20);

    // Korijeni/noge
    this.graphics.fillStyle(awake ? 0x2a1a05 : 0x120e06);
    this.graphics.fillRect(x - 16, y + 14, 10, 10);
    this.graphics.fillRect(x - 2, y + 14, 10, 10);
    this.graphics.fillRect(x + 8, y + 14, 8, 10);
  }

  wake() {
    this.awake = true;
    this._draw();
  }

  isAwake() {
    return this.awake;
  }
}
