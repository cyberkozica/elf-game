// src/ui/TouchControls.js
// On-screen D-pad + action button for touch devices.
// Exposes: .left .right .up .down (booleans) and .actionJustDown() (one-shot per tap)

export default class TouchControls {
  constructor(scene) {
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
    this._actionFired = false;

    // Support dpad + action button pressed simultaneously
    scene.input.addPointer(2);

    // Only render buttons on touch-capable devices
    if (!scene.sys.game.device.input.touch) return;

    this._build(scene);
  }

  _build(scene) {
    const R = 18;   // button radius
    const D = 25;   // depth (above HUD at 20)

    // D-pad — bottom-left, inset so buttons don't clip canvas edges
    // Canvas is 480×320. With R=18 and pad=36: left edge=68-36-18=14, bottom=258+36+18=312 ✓
    const cx = 68, cy = 258;
    const pad = 36;
    this._btn(scene, cx,       cy - pad, '▲', R, D, v => { this.up    = v; });
    this._btn(scene, cx,       cy + pad, '▼', R, D, v => { this.down  = v; });
    this._btn(scene, cx - pad, cy,       '◀', R, D, v => { this.left  = v; });
    this._btn(scene, cx + pad, cy,       '▶', R, D, v => { this.right = v; });

    // Action button — bottom-right
    this._btn(scene, 430, 258, 'E', R, D, v => {
      if (v) this._actionFired = true;
    });
  }

  _btn(scene, x, y, label, r, depth, onChange) {
    const g = scene.add.graphics().setDepth(depth).setScrollFactor(0);
    g.fillStyle(0x000000, 0.45);
    g.fillCircle(x, y, r);
    g.lineStyle(1, 0x3a6a3a, 0.9);
    g.strokeCircle(x, y, r);

    const t = scene.add.text(x, y, label, {
      fontSize: '13px', color: '#5a9a5a'
    }).setOrigin(0.5).setDepth(depth + 1).setScrollFactor(0);

    t.setInteractive(new Phaser.Geom.Circle(0, 0, r), Phaser.Geom.Circle.Contains);
    t.on('pointerdown', () => onChange(true));
    t.on('pointerup',   () => onChange(false));
    t.on('pointerout',  () => onChange(false));
  }

  // Returns true exactly once per tap — mirrors Phaser.Input.Keyboard.JustDown
  actionJustDown() {
    if (this._actionFired) {
      this._actionFired = false;
      return true;
    }
    return false;
  }
}
