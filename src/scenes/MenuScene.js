// src/scenes/MenuScene.js
export default class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.add.text(240, 140, 'ELF', {
      fontSize: '48px', color: '#3aaa3a', fontFamily: 'serif'
    }).setOrigin(0.5);

    this.add.text(240, 200, 'Začarana šuma', {
      fontSize: '14px', color: '#1a5a1a'
    }).setOrigin(0.5);

    const btn = this.add.text(240, 250, '[ IGRAJ ]', {
      fontSize: '16px', color: '#5aaa5a'
    }).setOrigin(0.5).setInteractive();

    btn.on('pointerover', () => btn.setColor('#aaeaaa'));
    btn.on('pointerout', () => btn.setColor('#5aaa5a'));
    btn.on('pointerdown', () => this.scene.start('Forest'));
  }
}
