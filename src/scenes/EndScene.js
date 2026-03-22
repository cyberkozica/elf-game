// src/scenes/EndScene.js — puna animirana verzija
export default class EndScene extends Phaser.Scene {
  constructor() { super('End'); }

  create() {
    // Dark background with subtle green tint
    this.add.rectangle(240, 160, 480, 320, 0x020a02);

    // Animated stars — tween only alpha (valid Phaser 3 Text tween)
    for (let i = 0; i < 30; i++) {
      const sx = Phaser.Math.Between(20, 460);
      const sy = Phaser.Math.Between(20, 280);
      const star = this.add.text(sx, sy, '✦', {
        fontSize: Phaser.Math.Between(6, 12) + 'px',
        color: '#ffe066'
      }).setAlpha(0);
      this.tweens.add({
        targets: star,
        alpha: { from: 0, to: Phaser.Math.FloatBetween(0.3, 0.9) },
        duration: Phaser.Math.Between(800, 2000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1500)
      });
    }

    // Runes appear one by one, then turn gold
    // Note: Phaser 3 cannot tween Text color — use delayedCall + setColor()
    const runeSymbols = ['ᚱ', 'ᚠ', 'ᚢ', 'ᚹ', 'ᚷ'];
    runeSymbols.forEach((sym, i) => {
      const rt = this.add.text(162 + i * 35, 100, sym, {
        fontSize: '20px', fontFamily: 'serif', color: '#2a4a2a'
      }).setOrigin(0.5).setAlpha(0);

      // Fade in
      this.tweens.add({
        targets: rt,
        alpha: 1,
        duration: 600,
        delay: 500 + i * 400
      });
      // Change color to gold after fade completes
      this.time.delayedCall(500 + i * 400 + 600, () => {
        rt.setColor('#c8c840');
      });
    });

    // Main message
    const mainText = this.add.text(240, 155, 'Pronašao si put kući.', {
      fontSize: '14px', color: '#3aaa3a'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: mainText, alpha: 1, duration: 1000, delay: 2500 });

    // Signature
    const sub = this.add.text(240, 180, '— Mia i Maša —', {
      fontSize: '9px', color: '#1a5a1a', letterSpacing: 2
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, duration: 800, delay: 3500 });

    // Play again button
    const btn = this.add.text(240, 230, '[ IGRAJ PONOVO ]', {
      fontSize: '12px', color: '#3a7a3a'
    }).setOrigin(0.5).setInteractive().setAlpha(0);
    this.tweens.add({ targets: btn, alpha: 1, duration: 600, delay: 4200 });

    btn.on('pointerover', () => btn.setColor('#aaeaaa'));
    btn.on('pointerout', () => btn.setColor('#3a7a3a'));
    btn.on('pointerdown', () => this.scene.start('Menu'));
  }
}
