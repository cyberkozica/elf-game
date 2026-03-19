// src/ui/DialogBox.js
export default class DialogBox {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;

    this.container = scene.add.container(0, 0).setDepth(25).setVisible(false);

    const bg = scene.add.graphics();
    bg.fillStyle(0x050f05, 0.95);
    bg.fillRect(10, 260, 460, 50);
    bg.lineStyle(1, 0x2a3a1a);
    bg.strokeRect(10, 260, 460, 50);
    this.container.add(bg);

    this.nameText = scene.add.text(20, 264, '', {
      fontSize: '8px', color: '#4a6a3a', letterSpacing: 1
    });
    this.container.add(this.nameText);

    this.bodyText = scene.add.text(20, 276, '', {
      fontSize: '10px', color: '#7aaa5a', wordWrap: { width: 440 }
    });
    this.container.add(this.bodyText);
  }

  show(name, text) {
    this.nameText.setText(name.toUpperCase());
    this.bodyText.setText(text);
    this.container.setVisible(true);
    this.visible = true;
  }

  hide() {
    this.container.setVisible(false);
    this.visible = false;
  }
}
