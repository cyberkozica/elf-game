import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import ForestScene from './scenes/ForestScene.js';
import LakeScene from './scenes/LakeScene.js';

const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 320,
  pixelArt: true,
  backgroundColor: '#050f05',
  scene: [BootScene, MenuScene, ForestScene, LakeScene],
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  }
};

new Phaser.Game(config);
