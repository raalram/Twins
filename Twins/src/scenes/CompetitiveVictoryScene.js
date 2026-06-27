import { createStarBackground } from './StarBackground.js';

export default class CompetitiveVictoryScene extends Phaser.Scene {
  constructor() {
    super('CompetitiveVictoryScene');
  }

  create(data) {
    // Pantalla final para el modo competitivo
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const results = data?.results || [];

    this.sound.stopAll();
    this.sound.play('musica_victoria', { volume: 0.55 });

    createStarBackground(this);
    this.add.rectangle(width / 2, height / 2, width, height, 0x09152a, 0.3);

    this.add.text(width / 2, 96, 'VICTORIA COMPETITIVA', {
      fontSize: '44px',
      fontFamily: 'Consolas, "Courier New", monospace',
      fontStyle: 'bold',
      color: '#7fffd4'
    }).setOrigin(0.5);

    this.add.text(width / 2, 158, data?.message || 'La dimension vencedora conserva el equilibrio.', {
      fontSize: '22px',
      fontFamily: 'Consolas, "Courier New", monospace',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    results.forEach((player, index) => {
      const y = 242 + index * 82;
      const color = player.winner ? '#63ff8f' : '#ff5d73';
      const resultText = player.winner ? 'Ha ganado' : 'Ha perdido';

      this.add.text(width / 2 - 130, y, player.name, {
        fontSize: '30px',
        fontFamily: 'Consolas, "Courier New", monospace',
        fontStyle: 'bold',
        color: '#dce8ff'
      }).setOrigin(0.5);

      this.add.text(width / 2 + 130, y, resultText, {
        fontSize: '30px',
        fontFamily: 'Consolas, "Courier New", monospace',
        fontStyle: 'bold',
        color
      }).setOrigin(0.5);
    });

    this.createButton(width / 2 - 120, 440, 'Menu', () => this.scene.start('MenuScene'));
    this.createButton(width / 2 + 120, 440, 'Salir', () => this.exitToMenu());
  }

  createButton(x, y, label, callback) {
    // Botones 
    const button = this.add.text(x, y, label, {
      fontSize: '26px',
      fontFamily: 'Consolas, "Courier New", monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#3454d1',
      padding: { x: 22, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setScale(1.06));
    button.on('pointerout', () => button.setScale(1));
    button.on('pointerdown', callback);
  }

  exitToMenu() {
    // Detiene la musica y vuelve al menu.
    this.sound.stopAll();
    this.scene.start('MenuScene');
  }
}
