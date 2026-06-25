import { createStarBackground } from './StarBackground.js';

export default class ControlsScene extends Phaser.Scene {
  constructor() {
    super('ControlsScene');
  }

  init(data) {
    this.mode = data?.mode || 'single';
    this.fromMenu = Boolean(data?.fromMenu);
  }

  preload() {
    this.load.image('controls1', 'assets/sprites/controls1.PNG');
    this.load.image('controls2', 'assets/sprites/controls2.PNG');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const centerX = width / 2;

    createStarBackground(this);
    this.add.text(centerX, 58, 'Controles', {
      fontSize: '48px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.addControlImage(250, 195, 'controls1', 'Player 1', '#38a3ff');
    this.addControlImage(710, 195, 'controls2', 'Player 2', '#b369ff');

    this.addControlBlock(250, 330, 'Miri', '#38a3ff', [
      'A / D: moverse',
      'W: saltar',
      'F: disparar'
    ]);

    this.addControlBlock(710, 330, 'Sar', '#b369ff', [
      'Flechas: moverse y saltar',
      'L: disparar',
      'Usa la dimension violeta'
    ]);

    this.add.text(centerX, 415, this.getObjectiveText(), {
      fontSize: '17px',
      fontFamily: 'Arial',
      color: '#dce8ff',
      align: 'center',
      lineSpacing: 5
    }).setOrigin(0.5);

    this.createButton(centerX - 130, 492, 'Menu', () => this.scene.start('MenuScene'));
    this.createButton(centerX + 130, 492, this.fromMenu ? 'Volver' : 'Jugar', () => {
      if (this.fromMenu) {
        this.scene.start('MenuScene');
        return;
      }
      this.scene.start('GameScene', { mode: this.mode });
    });
  }

  addControlImage(x, y, texture, label, color) {
    this.add.image(x, y, texture)
      .setDisplaySize(320, 213)
      .setOrigin(0.5);

    this.add.text(x, y + 126, label, {
      fontSize: '26px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color
    }).setOrigin(0.5);
  }

  addControlBlock(x, y, title, color, lines) {
    this.add.text(x, y, title, {
      fontSize: '24px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color
    }).setOrigin(0.5);

    this.add.text(x, y + 48, lines.join('\n'), {
      fontSize: '15px',
      fontFamily: 'Arial',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);
  }

  createButton(x, y, label, callback) {
    const button = this.add.text(x, y, label, {
      fontSize: '26px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#3454d1',
      padding: { x: 24, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setScale(1.06));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', callback);
  }

  getObjectiveText() {
    if (this.mode === 'coop') {
      return 'Modo cooperativo: reunid 3 fragmentos, activad los dos interruptores\ny alcanzad juntas el portal final.';
    }
    if (this.mode === 'versus') {
      return 'Modo competitivo: gana quien consiga 3 fragmentos\ny llegue primero al portal final.';
    }
    return 'Modo un jugador: recoge 3 fragmentos, evita enemigos y bombas,\ny entra en el portal final.';
  }
}
