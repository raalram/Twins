import { createStarBackground } from './StarBackground.js';

export default class ModeScene extends Phaser.Scene {
  constructor() {
    super('ModeScene');
  }

  create() {
    // Pantalla de seleccion de modo de juego: un jugador, dos jugadores cooperativo o dos jugadores competitivo.
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    createStarBackground(this);
    this.add.text(centerX, 92, 'Selecciona modo', {
      fontSize: '46px',
      color: '#f7fbff',
      fontFamily: 'Consolas, "Courier New", monospace',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(centerX, 142, 'Cada modo cambia los objetivos y la forma de jugar.', {
      fontSize: '17px',
      color: '#c8d7ee',
      fontFamily: 'Consolas, "Courier New", monospace'
    }).setOrigin(0.5);

    const modes = [
      ['Un jugador', 'single', 226, '#1d75ff'],
      ['Dos jugadores cooperativo', 'coop', 308, '#7b3dff'],
      ['Dos jugadores competitivo', 'versus', 390, '#ff4b91']
    ];

    modes.forEach(([label, mode, y, color]) => {
      this.createButton(centerX, y, label, color, () => {
        this.scene.start('GameScene', { mode });
      });
    });

    this.createButton(92, 486, 'Volver', '#26364f', () => {
      this.scene.start('MenuScene');
    }, '20px', { x: 18, y: 8 });
  }

  createButton(x, y, label, color, callback, fontSize = '28px', padding = { x: 28, y: 12 }) {
    // Boton para opciones de modo y volver al menu.
    const button = this.add.text(x, y, label, {
      fontSize,
      fontFamily: 'Consolas, "Courier New", monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: color,
      padding
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setScale(1.06));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', callback);
  }
}
