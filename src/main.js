import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import ForestScene from './scenes/ForestScene.js';
import LakeScene from './scenes/LakeScene.js';
import CaveScene from './scenes/CaveScene.js';
import StairsScene from './scenes/StairsScene.js';
import RuinsScene from './scenes/RuinsScene.js';
import HeartScene from './scenes/HeartScene.js';
import EndScene from './scenes/EndScene.js';

const config = {
  type: Phaser.AUTO,
  pixelArt: true,
  backgroundColor: '#050f05',
  scale: {
    parent: 'game',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480,
    height: 320,
  },
  scene: [BootScene, MenuScene, ForestScene, LakeScene, CaveScene, StairsScene, RuinsScene, HeartScene, EndScene],
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  }
};

new Phaser.Game(config);
