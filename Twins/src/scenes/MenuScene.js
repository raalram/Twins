export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  preload() {
    this.load.audio('musica_menu', './assets/audio/menu_music.wav');
    this.load.audio('musica_juego', './assets/audio/game_music.wav');
    this.load.audio('musica_victoria', './assets/audio/win_music.ogg');
    this.load.audio('musica_derrota', './assets/audio/lose_music.wav');
  }

  create() {
    // Detenemos cualquier música que pudiera estar sonando antes de iniciar la del menú
    this.sound.stopAll();
    // Iniciamos la música del menú en bucle con un volumen moderado
    this.sound.play('musica_menu', { loop: true, volume: 0.5 });

    // Guardamos el centro exacto de la pantalla en una variable
    const centroX = this.cameras.main.width / 2;

    // Título perfectamente centrado
    this.add.text(centroX, 180, 'TWINS', {
      fontSize: '56px',
      color: 'hsl(317, 80%, 92%)',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5); // <-- Anclamos el centro del texto a centroX

    // Botón centrado
    const play = this.add.text(centroX, 330, 'JUGAR', {
      fontSize: '36px',
      color: '#ffffff',
      backgroundColor: '#5b0bfb',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive(); // <-- También centrado

    // Usamos .once para evitar cargar la IntroScene dos veces si haces doble clic
    play.once('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}