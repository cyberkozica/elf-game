// src/scenes/EndScene.js — placeholder, full animation in Task 6
export default class EndScene extends Phaser.Scene {
  constructor() { super('End'); }

  create() {
    this.add.rectangle(240, 160, 480, 320, 0x020a02);
    this.add.text(240, 155, 'Pronašla si put kući.', {
      fontSize: '14px', color: '#3aaa3a'
    }).setOrigin(0.5);

    const btn = this.add.text(240, 220, '[ IGRAJ PONOVO ]', {
      fontSize: '12px', color: '#3a7a3a'
    }).setOrigin(0.5).setInteractive();
    btn.on('pointerdown', () => this.scene.start('Menu'));
  }
}
