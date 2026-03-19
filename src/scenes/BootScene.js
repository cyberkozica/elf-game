// src/scenes/BootScene.js
export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // Svi asseti se generiraju programski u create()
  }

  create() {
    this.scene.start('Menu');
  }
}
