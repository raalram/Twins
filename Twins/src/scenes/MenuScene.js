import { createStarBackground } from './StarBackground.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    // Carga de recursos necesarios para la escena del menú.
    this.load.image('logo', './assets/sprites/Twins Logo.png');
    this.load.audio('musica_menu', './assets/audio/menu_music.wav');
    this.load.audio('musica_juego', './assets/audio/game_music.mp3');
    this.load.audio('musica_victoria', './assets/audio/win_music.ogg');
    this.load.audio('musica_derrota', './assets/audio/lose_music.wav');
  }

  create() {
    // Detener cualquier música que esté sonando y reproducir la música del menú.
    this.sound.stopAll();
    this.sound.play('musica_menu', { loop: true, volume: 0.5 });

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    createStarBackground(this);

    // Fondo de pantalla con el logo del juego y la historia.
    this.add.image(centerX, centerY, 'logo')
      .setDisplaySize(740, 345)
      .setAlpha(0.16)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    const story = [
      'Hace cuatro millones de años, en el inicio de los tiempos, una fuerza poderosa mantenía el orden y el equilibrio en el universo: el Cristal de los Mundos.',
      'Sin embargo, una entidad oscura surgida del Abismo de los Agujeros Negros, provocó que el cristal explotara en múltiples fragmentos esparcidos en la inmensidad del espacio dejando atrapadas a las hermanas Miri y Sar en dimensiones paralelas.',
      'Ahora deberán recuperar los fragmentos para restaurar el equilibrio y encontrar el camino de regreso a casa.'
    ].join('\n\n');

    const title = this.add.text(centerX, 28, 'TWINS', {
      fontSize: '62px',
      color: '#7fc8ff',
      fontFamily: 'Consolas, "Courier New", monospace',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    title.setStroke('#1d75ff', 5);
    title.setShadow(0, 0, '#d94dff', 16, true, true);

    this.add.text(centerX, 104, story, {
      fontSize: '15px',
      color: '#dceeff',
      fontFamily: 'Consolas, "Courier New", monospace',
      align: 'center',
      lineSpacing: 5,
      wordWrap: { width: 790 }
    }).setOrigin(0.5, 0);

    this.createButton(centerX, 372, 'Start', '#1d75ff', () => {
      this.scene.start('ModeScene');
    });

    this.createButton(centerX, 446, 'Controls', '#7b3dff', () => {
      this.scene.start('ControlsScene', { mode: 'single', fromMenu: true });
    });
  }

  createButton(x, y, label, color, callback) {
    // Botones interactivos en la escena del menú.
    const button = this.add.text(x, y, label, {
      fontSize: '30px',
      fontFamily: 'Consolas, "Courier New", monospace',
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
