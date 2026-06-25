import { createStarBackground } from './StarBackground.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create(data) {
    this.createResultScreen({
      title: 'VICTORIA',
      color: '#7fffd4',
      background: 0x061a22,
      message: data?.message || 'El Cristal de los Mundos vuelve a brillar.',
      stats: data?.stats || []
    });
  }

  createResultScreen(result) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.sound.stopAll();
    this.sound.play('musica_victoria', { volume: 0.55 });

    createStarBackground(this);
    this.add.rectangle(width / 2, height / 2, width, height, result.background, 0.22);
    this.add.text(width / 2, 126, result.title, {
      fontSize: '54px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: result.color
    }).setOrigin(0.5);

    this.add.text(width / 2, 194, result.message, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    const lines = result.stats.map(player => {
      return `${player.name}: ${player.stars} estrellas | ${player.fragments} fragmentos | ${player.lives} vidas`;
    });

    this.add.text(width / 2, 278, lines.join('\n'), {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#dce8ff',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);

    this.createButton(width / 2 - 120, 410, 'Menu', () => this.scene.start('MenuScene'));
    this.createButton(width / 2 + 120, 410, 'Salir', () => this.showExitText());
  }

  createButton(x, y, label, callback) {
    const button = this.add.text(x, y, label, {
      fontSize: '26px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#3454d1',
      padding: { x: 22, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setScale(1.06));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', callback);
  }

  showExitText() {
    this.sound.stopAll();
    this.add.text(this.cameras.main.width / 2, 480, 'Gracias por jugar a Twins', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
  }
}
