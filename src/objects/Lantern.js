// src/objects/Lantern.js
import { LANTERN_DRAIN_RATE, LANTERN_REFILL_AMOUNT, LANTERN_MAX_RADIUS, LANTERN_MIN_RADIUS, GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export class LanternState {
  constructor() {
    this.energy = 100;
  }

  update(deltaSeconds) {
    this.energy = Math.max(0, this.energy - LANTERN_DRAIN_RATE * deltaSeconds);
  }

  refill() {
    this.energy = Math.min(100, this.energy + LANTERN_REFILL_AMOUNT);
  }

  getRadius() {
    const t = this.energy / 100;
    return LANTERN_MIN_RADIUS + (LANTERN_MAX_RADIUS - LANTERN_MIN_RADIUS) * t;
  }
}

export default class Lantern {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.state = new LanternState();
    this.overlay = null;
  }

  update(delta) {
    this.state.update(delta / 1000);
    this._drawLight();
  }

  refill() {
    this.state.refill();
  }

  _drawLight() {
    if (!this.overlay) {
      this.overlay = this.scene.add.graphics().setDepth(10);
    }
    const radius = this.state.getRadius();
    const x = this.player.x;
    const y = this.player.y;

    this.overlay.clear();
    this.overlay.fillStyle(0x020805, 0.80);
    this.overlay.fillRect(0, 0, GAME_WIDTH, y - radius);
    this.overlay.fillRect(0, y + radius, GAME_WIDTH, GAME_HEIGHT - y - radius);
    this.overlay.fillRect(0, y - radius, x - radius, radius * 2);
    this.overlay.fillRect(x + radius, y - radius, GAME_WIDTH - x - radius, radius * 2);
  }

  getEnergy() {
    return this.state.energy;
  }
}
