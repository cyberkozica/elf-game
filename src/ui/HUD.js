// src/ui/HUD.js
export default class HUD {
  constructor(scene) {
    this.scene = scene;
    this._audio = scene.game.registry.get('audio');

    // Kontejner na vrhu
    this.container = scene.add.container(0, 0).setDepth(20);

    // Pozadina HUD-a
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRect(6, 6, 130, 26);
    bg.fillRect(340, 6, 132, 26);
    this.container.add(bg);

    // Ikona svjetiljke
    const icon = scene.add.graphics();
    icon.fillStyle(0xffe066);
    icon.fillRect(12, 12, 12, 12);
    this.container.add(icon);

    // Label
    this.container.add(scene.add.text(28, 10, 'SVJETLO', {
      fontSize: '7px', color: '#8a7a3a', letterSpacing: 1
    }));

    // Traka energije — pozadina
    this.energyBg = scene.add.graphics();
    this.energyBg.fillStyle(0x1a1a0a);
    this.energyBg.fillRect(28, 19, 100, 6);
    this.container.add(this.energyBg);

    // Traka energije — punjenje
    this.energyBar = scene.add.graphics();
    this.container.add(this.energyBar);

    // Gumb za zvuk — gornji desni kut
    this.muteBtn = scene.add.text(468, 8, '♪', {
      fontSize: '12px', color: '#5a6a5a'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this.muteBtn.on('pointerdown', () => {
      const muted = this._audio.toggleMute();
      this.muteBtn.setAlpha(muted ? 0.3 : 1.0);
    });
    this.container.add(this.muteBtn);

    // Rune slotovi (7 runa: ᚱ ᚠ ᛩ ᛜ ᚹ ᛈ ᚷ)
    this.runeTexts = [];
    for (let i = 0; i < 7; i++) {
      const slotBg = scene.add.graphics();
      slotBg.lineStyle(1, 0x2a2a4a);
      slotBg.strokeRect(342 + i * 17, 9, 15, 18);
      slotBg.fillStyle(0x1a1a2a);
      slotBg.fillRect(342 + i * 17, 9, 15, 18);
      this.container.add(slotBg);

      const t = scene.add.text(350 + i * 17, 18, '', {
        fontSize: '11px', color: '#8a8aee', fontFamily: 'serif'
      }).setOrigin(0.5);
      this.container.add(t);
      this.runeTexts.push(t);
    }
  }

  update(lanternEnergy, collectedRunes) {
    // Ažuriraj traku energije (energija 0-100 mapira na 0-100px širinu)
    this.energyBar.clear();
    this.energyBar.fillStyle(0xffe066);
    this.energyBar.fillRect(28, 19, lanternEnergy, 6);

    // Ažuriraj rune slotove
    const symbols = ['ᚱ', 'ᚠ', 'ᛩ', 'ᛜ', 'ᚹ', 'ᛈ', 'ᚷ'];
    const colors  = ['#ffcc44', '#ff8844', '#44cc66', '#ff4488', '#44ccee', '#cd7f32', '#ffffff'];
    symbols.forEach((sym, i) => {
      const has = collectedRunes.includes(sym);
      this.runeTexts[i].setText(has ? sym : '');
      if (has) this.runeTexts[i].setColor(colors[i]);
    });
  }
}
