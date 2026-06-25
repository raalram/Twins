export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');

    this.player = null;
    this.cursors = null;
  }

  preload() {
    this.load.image('fondo', 'assets/background/fondo.png');

    this.load.tilemapTiledJSON('level', 'assets/maps/level.json');

    this.load.image('rock_packed', 'assets/maps/rock_packed.png');
    this.load.image('blue_tile', 'assets/maps/blue_tile.png');
    this.load.image('pink_tile', 'assets/maps/pink_tile.png');

    this.load.image('miri', 'assets/sprites/miri.png');

  }

  create() {
    const map = this.make.tilemap({ key: 'level' });

    const rockTiles = map.addTilesetImage('rock_packed', 'rock_packed');
    const blueTiles = map.addTilesetImage('blue_tile', 'blue_tile');
    const pinkTiles = map.addTilesetImage('pink_tile', 'pink_tile');

    this.add.image(0, 0, 'fondo')
      .setOrigin(0)
      .setDisplaySize(960, 540)
      .setScrollFactor(0.25);

    const ground = map.createLayer('Ground', rockTiles, 0, 0);
    const platforms = map.createLayer('Platforms', rockTiles, 0, 0);
    const bluePlatforms = map.createLayer('BluePlatforms', blueTiles, 0, 0);
    const pinkPlatforms = map.createLayer('PinkPlatforms', pinkTiles, 0, 0);

    ground.setCollisionByExclusion([-1]);
    platforms.setCollisionByExclusion([-1]);
    bluePlatforms.setCollisionByExclusion([-1]);
    pinkPlatforms.setCollisionByExclusion([-1]);

    const spawns = map.getObjectLayer('PlayerSpawns').objects;
    const miriSpawn = spawns.find(obj => obj.name === 'MiriSpawn');

    this.player = this.physics.add.sprite(miriSpawn.x, miriSpawn.y, 'miri');
    this.player.setCollideWorldBounds(true);

    this.physics.add.collider(this.player, ground);
    this.physics.add.collider(this.player, platforms);
    this.physics.add.collider(this.player, bluePlatforms);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player);

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    this.player.setVelocityX(0);

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200);
    }

    if (this.cursors.right.isDown) {
      this.player.setVelocityX(200);
    }

    if (this.cursors.up.isDown && this.player.body.blocked.down) {
      this.player.setVelocityY(-450);
    }
  }
}