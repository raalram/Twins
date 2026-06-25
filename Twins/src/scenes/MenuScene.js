import { createStarBackground } from './StarBackground.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    this.load.image('logo', './assets/sprites/Twins Logo.png');
    this.load.image('miri', './assets/sprites/miri.png');
    this.load.image('sar', './assets/sprites/sar.png');
    this.load.audio('musica_menu', './assets/audio/menu_music.wav');
    this.load.audio('musica_juego', './assets/audio/game_music.wav');
    this.load.audio('musica_victoria', './assets/audio/win_music.ogg');
    this.load.audio('musica_derrota', './assets/audio/lose_music.wav');
  }

  create() {
    this.sound.stopAll();
    this.sound.play('musica_menu', { loop: true, volume: 0.5 });

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    createStarBackground(this);
    this.add.image(centerX, 102, 'logo').setDisplaySize(280, 130);
    this.add.image(centerX - 245, 300, 'miri').setScale(4.2).setAlpha(0.9);
    this.add.image(centerX + 245, 300, 'sar').setScale(4.2).setAlpha(0.9);

    this.add.text(centerX, 196, 'Cristal de los Mundos', {
      fontSize: '26px',
      color: '#f7fbff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(centerX, 232, 'Miri y Sar deben reunir los fragmentos perdidos.', {
      fontSize: '16px',
      color: '#c8d7ee',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.createButton(centerX, 320, 'Start', '#1d75ff', () => {
      this.scene.start('ModeScene');
    });

    this.createButton(centerX, 392, 'Controls', '#7b3dff', () => {
      this.scene.start('ControlsScene', { mode: 'single', fromMenu: true });
    });

    this.add.text(centerX, 506, 'Twins', {
      fontSize: '15px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setAlpha(0.85);
  }

  createButton(x, y, label, color, callback) {
    const button = this.add.text(x, y, label, {
      fontSize: '30px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: color,
      padding: { x: 36, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setScale(1.06));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', callback);
  }
}
