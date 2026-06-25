import { createStarBackground } from './StarBackground.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(data) {
    // Pantalla de derrota con estadisticas de la partida.
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const stats = data?.stats || [];

    this.sound.stopAll();
    if (this.cache.audio.exists('musica_derrota')) {
      this.sound.play('musica_derrota', { volume: 0.55 });
    }

    createStarBackground(this);
    this.add.rectangle(width / 2, height / 2, width, height, 0x210811, 0.18);
    this.add.text(width / 2, 126, 'GAME OVER', {
      fontSize: '54px',
      fontFamily: 'Consolas, "Courier New", monospace',
      fontStyle: 'bold',
      color: '#ff8fb1'
    }).setOrigin(0.5);

    this.add.text(width / 2, 194, data?.message || '¡Oh no! Has perdido. Los mundos han sido destruidos.', {
      fontSize: '24px',
      fontFamily: 'Consolas, "Courier New", monospace',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    const lines = stats.map(player => {
      return `${player.name}: ${player.stars} estrellas | ${player.fragments} fragmentos | ${player.lives} vidas`;
    });

    this.add.text(width / 2, 278, lines.join('\n'), {
      fontSize: '22px',
      fontFamily: 'Consolas, "Courier New", monospace',
      color: '#dce8ff',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);

    this.createButton(width / 2 - 120, 410, 'Menu', () => this.scene.start('MenuScene'));
    this.createButton(width / 2 + 120, 410, 'Salir', () => this.exitToMenu());
  }

  createButton(x, y, label, callback) {
    // Botones para volver al menu principal.
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
