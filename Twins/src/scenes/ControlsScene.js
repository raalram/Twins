import { createStarBackground } from './StarBackground.js';

export default class ControlsScene extends Phaser.Scene {
  constructor() {
    super('ControlsScene');
  }

  preload() {
    // carga de imágenes de controles y textos para los jugadores
    this.load.image('controlsPlayer1', 'assets/sprites/controls1_scene.png');
    this.load.image('controlsPlayer2', 'assets/sprites/controls2_scene.png');
    this.load.image('textPlayer1', 'assets/sprites/TextPlayer1_scene.png');
    this.load.image('textPlayer2', 'assets/sprites/textPlayer2_scene.png');
  }

  create() {
    // Obtener el ancho y alto de la cámara principal para posicionar los elementos correctamente
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    createStarBackground(this);

    this.add.image(240, 250, 'controlsPlayer1').setDisplaySize(330, 220);
    this.add.image(720, 250, 'controlsPlayer2').setDisplaySize(330, 220);

    this.add.image(240, 470, 'textPlayer1').setDisplaySize(360, 120);
    this.add.image(720, 470, 'textPlayer2').setDisplaySize(360, 120);

    this.add.text(width / 2, 34, 'Controles', {
      fontSize: '42px',
      fontFamily: 'Consolas, "Courier New", monospace',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(width / 2, 520, 'Haz clic para volver al menu', {
      fontSize: '15px',
      fontFamily: 'Consolas, "Courier New", monospace',
      color: '#dce8ff'
    }).setOrigin(0.5).setAlpha(0.85);

    // Crear un área interactiva que cubra toda la pantalla para volver al menú al hacer clic
    const backOption = this.add.zone(0, 0, width, height);
    backOption.setOrigin(0);
    backOption.setInteractive();
    backOption.once('pointerdown', () => this.scene.start('MenuScene'));
  }
}
