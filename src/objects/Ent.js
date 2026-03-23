// src/objects/Ent.js
export default class Ent {
  constructor(scene, x, y, options = {}) {
    this.scene = scene;
    this.awake = false;
    this.x = x;
    this.y = y;
    this._bodyColor = null;  // null = use default wood color
    this._material = options.material ?? 'wood';

    this.graphics = scene.add.graphics();
    this._draw();

    // Separate graphics layer for hint glow (depth+1 over body)
    this.glowGraphics = scene.add.graphics();

    // Zona za interakciju
    this.zone = scene.add.zone(x, y, 60, 80);
    scene.physics.add.existing(this.zone, true);
  }

  _draw() {
    const { x, y, awake } = this;
    this.graphics.clear();

    // Tijelo enta — _bodyColor overrides default wood color
    const bodyHex = this._bodyColor ?? (awake ? 0x2a1a05 : 0x1a1208);
    this.graphics.fillStyle(bodyHex);
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

  // Reveal statue material by changing body color and redrawing
  revealMaterial(hex) {
    this._bodyColor = hex;
    this._draw();
  }

  // Subtle blue eye glow for hint (drawn on separate graphics layer)
  setHintGlow(active) {
    this.glowGraphics.clear();
    if (active) {
      this.glowGraphics.fillStyle(0x4488ff, 0.5);
      this.glowGraphics.fillRect(this.x - 8, this.y - 30, 6, 6);
      this.glowGraphics.fillRect(this.x + 2, this.y - 30, 6, 6);
    }
  }
}
