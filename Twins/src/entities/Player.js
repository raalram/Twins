export const PLAYER_CONFIG = {
  // Configuración de los jugadores, incluyendo nombre, textura, color, plataforma, controles y tecla de disparo.
  miri: {
    name: 'Miri',
    texture: 'miri',
    color: 0x38a3ff,
    platform: 'blue',
    controls: 'wasd',
    bulletKey: 'F'
  },
  sar: {
    name: 'Sar',
    texture: 'sar',
    color: 0xb369ff,
    platform: 'pink',
    controls: 'arrows',
    bulletKey: 'L'
  }
};

export default class Player {
  constructor(scene, config, spawn) {
    // Inicializa un jugador en la escena, con la configuración especificada y en el punto de aparición dado.
    this.scene = scene;
    this.config = config;
    this.sprite = scene.physics.add.sprite(spawn.x, spawn.y, config.texture)
      .setScale(1.2)
      .setCollideWorldBounds(true);

    this.sprite.body.setSize(20, 38, true);
    this.sprite.play(`${config.texture}-idle`);

    this.lives = 3;
    this.stars = 0;
    this.fragments = 0;
    this.facing = 1;
    this.lastShot = 0;
    this.hurtUntil = 0;
    this.shootingUntil = 0;
    this.eliminated = false;
  }

  static createAnimations(scene) {
    // Crea las animaciones para los jugadores si aún no existen, incluyendo movimiento a la izquierda, derecha e idle.
    Object.values(PLAYER_CONFIG).forEach(config => {
      if (!scene.anims.exists(`${config.texture}-left`)) {
        scene.anims.create({
          key: `${config.texture}-left`,
          frames: scene.anims.generateFrameNumbers(config.texture, { start: 0, end: 3 }),
          frameRate: 10,
          repeat: -1
        });
      }

      if (!scene.anims.exists(`${config.texture}-idle`)) {
        scene.anims.create({
          key: `${config.texture}-idle`,
          frames: [{ key: config.texture, frame: 4 }],
          frameRate: 10,
          repeat: -1
        });
      }

      if (!scene.anims.exists(`${config.texture}-right`)) {
        scene.anims.create({
          key: `${config.texture}-right`,
          frames: scene.anims.generateFrameNumbers(config.texture, { start: 5, end: 8 }),
          frameRate: 10,
          repeat: -1
        });
      }
    });
  }

  update(time, keys, cursors, shootCallback) {
    // Actualiza el estado del jugador basado en la entrada del teclado, incluyendo movimiento, salto y disparo.
    if (this.eliminated || !this.sprite.active) {
      return;
    }

    const left = this.config.controls === 'wasd' ? keys.A.isDown : cursors.left.isDown;
    const right = this.config.controls === 'wasd' ? keys.D.isDown : cursors.right.isDown;
    const jump = this.config.controls === 'wasd'
      ? Phaser.Input.Keyboard.JustDown(keys.W)
      : Phaser.Input.Keyboard.JustDown(cursors.up);
    const shoot = Phaser.Input.Keyboard.JustDown(keys[this.config.bulletKey]);

    this.sprite.setVelocityX(0);

    if (left) {
      this.sprite.setVelocityX(-160);
      this.sprite.play(`${this.config.texture}-left`, true);
      this.facing = -1;
    } else if (right) {
      this.sprite.setVelocityX(160);
      this.sprite.play(`${this.config.texture}-right`, true);
      this.facing = 1;
    } else if (time >= this.shootingUntil) {
      this.sprite.setVelocityX(0);
      this.sprite.play(`${this.config.texture}-idle`, true);
    }

    if (jump && this.sprite.body.blocked.down) {
      this.sprite.setVelocityY(-500);
      this.scene.sound.play('salto', { volume: 0.25 });
    }

    if (shoot) {
      this.sprite.play(this.facing === 1 ? `${this.config.texture}-right` : `${this.config.texture}-left`, true);
      this.shootingUntil = time + 180;
      shootCallback(this, time);
    }

    this.sprite.setAlpha(time < this.hurtUntil ? 0.55 : 1);
  }
}
