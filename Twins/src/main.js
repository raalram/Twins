import MenuScene from './scenes/MenuScene.js';
import ModeScene from './scenes/ModeScene.js';
import ControlsScene from './scenes/ControlsScene.js';
import GameScene from './scenes/GameScene.js';
import VictoryScene from './scenes/VictoryScene.js';
import CompetitiveVictoryScene from './scenes/CompetitiveVictoryScene.js';
import GameOverScene from './scenes/GameOverScene.js';

// Configuracion principal de Phaser: tamano del canvas, fisicas y orden de escenas.
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 960,
  height: 540,
  backgroundColor: '#000000',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 900 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  // El orden permite que Phaser conozca todas las pantallas del juego.
  scene: [MenuScene, ModeScene, ControlsScene, GameScene, VictoryScene, CompetitiveVictoryScene, GameOverScene]
};

new Phaser.Game(config);
