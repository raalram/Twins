export default class Enemy {
  constructor(scene, group, pos, index) {
    // Inicializa un enemigo en la escena, dentro del grupo de enemigos, en la posición especificada y con un índice para determinar su comportamiento.
    this.scene = scene;
    this.sprite = group.create(pos.x, pos.y, 'enemy').setScale(1.15);
    this.sprite.enemyActor = this;
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.allowGravity = false;
    this.sprite.body.setSize(18, 26, true);
    this.sprite.play('enemy-fly');

    this.direction = index % 2 === 0 ? 1 : -1;
    this.startX = pos.x;
    this.patrolRange = Phaser.Math.Between(90, 180);
    this.chasing = false;
  }

  static createAnimations(scene) {
    // Animacion de vuelo 
    if (scene.anims.exists('enemy-fly')) {
      return;
    }

    scene.anims.create({
      key: 'enemy-fly',
      frames: scene.anims.generateFrameNumbers('enemy', { frames: [0, 1, 2, 3, 4, 5] }),
      frameRate: 7,
      repeat: -1
    });
  }

  update(players) {
    // Si un jugador esta cerca lo persigue; si no, sigue patrullando
    if (!this.sprite.active) {
      return;
    }

    const target = this.findClosestPlayer(players);

    if (target) {
      this.chasing = true;
      this.scene.physics.moveToObject(this.sprite, target.sprite, 70);
      this.sprite.setFlipX(this.sprite.body.velocity.x < 0);
      return;
    }

    if (this.chasing) {
      this.chasing = false;
      this.startX = this.sprite.x;
    }

    this.sprite.setVelocityX(40 * this.direction);
    this.sprite.setVelocityY(Math.sin(this.scene.time.now / 300) * 30);
    this.sprite.setFlipX(this.direction === -1);

    if (this.sprite.x > this.startX + this.patrolRange) {
      this.direction = -1;
    } else if (this.sprite.x < this.startX - this.patrolRange) {
      this.direction = 1;
    }

    if (this.sprite.body.blocked.left) {
      this.direction = 1;
    } else if (this.sprite.body.blocked.right) {
      this.direction = -1;
    }
  }

  findClosestPlayer(players) {
    // Busca el jugador mas cercano dentro del radio de persecucion.
    let closest = null;
    let closestDistance = 200;

    players.forEach(player => {
      const distance = Phaser.Math.Distance.Between(
        player.sprite.x,
        player.sprite.y,
        this.sprite.x,
        this.sprite.y
      );

      if (distance < closestDistance) {
        closest = player;
        closestDistance = distance;
      }
    });

    return closest;
  }
}
