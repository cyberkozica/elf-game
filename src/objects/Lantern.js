// src/objects/Lantern.js
import { LANTERN_DRAIN_RATE, LANTERN_REFILL_AMOUNT, LANTERN_MAX_RADIUS, LANTERN_MIN_RADIUS } from '../constants.js';

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
    this.light = scene.add.graphics();
  }

  update(delta) {
    this.state.update(delta / 1000);
    this._drawLight();
  }

  refill() {
    this.state.refill();
  }

  _drawLight() {
    const radius = this.state.getRadius();
    const x = this.player.x;
    const y = this.player.y;

    this.light.clear();
    // Tamni overlay s rupom (svjetlost)
    this.light.fillStyle(0x000000, 0.85);
    this.light.fillRect(0, 0, 480, 320);

    // Izreži krug (svjetlost) koristeći blendMode
    this.light.fillStyle(0x000000, 0);
    this.light.fillCircle(x, y, radius);
  }

  getEnergy() {
    return this.state.energy;
  }
}
