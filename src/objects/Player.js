// src/objects/Player.js
import { PLAYER_SPEED } from '../constants.js';

export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;

    // Programski generiran pixel art vilenjak s kapom
    const g = scene.add.graphics();
    // Kapa (šiljasta, zelena)
    g.fillStyle(0x2a5a1a);
    g.fillTriangle(8, 0, 0, 8, 16, 8);   // šiljak
    g.fillRect(0, 8, 16, 4);              // obod
    // Zvjezdica na kapi
    g.fillStyle(0xffe066);
    g.fillRect(7, 2, 2, 2);
    // Glava
    g.fillStyle(0xc8e8aa);
    g.fillRect(2, 12, 12, 8);
    // Tijelo
    g.fillStyle(0x4a7c3f);
    g.fillRect(1, 20, 14, 14);
    // Noge
    g.fillStyle(0x3a5c2f);
    g.fillRect(2, 34, 5, 8);
    g.fillRect(9, 34, 5, 8);
    // Svjetiljka (desna ruka)
    g.fillStyle(0xffe066);
    g.fillRect(15, 22, 6, 6);

    g.generateTexture('player', 24, 42);
    g.destroy();

    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(true);
    this.cursors = scene.input.keyboard.createCursorKeys();
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  update() {
    const { left, right, up, down } = this.cursors;
    const vx = (right.isDown ? 1 : 0) - (left.isDown ? 1 : 0);
    const vy = (down.isDown ? 1 : 0) - (up.isDown ? 1 : 0);

    this.sprite.setVelocity(vx * PLAYER_SPEED, vy * PLAYER_SPEED);
  }
}
