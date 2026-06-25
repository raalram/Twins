const PLAYER_CONFIG = {
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

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.mode = data?.mode || 'single';
    this.players = [];
    this.sharedFragments = 0;
    this.finished = false;
  }

  preload() {
    this.load.image('fondo', 'assets/background/fondo.png');
    this.load.tilemapTiledJSON('level', 'assets/maps/level.json');
    this.load.image('rock_packed', 'assets/maps/rock_packed.png');
    this.load.image('blue_tile', 'assets/maps/blue_tile.png');
    this.load.image('pink_tile', 'assets/maps/pink_tile.png');
    this.load.image('miri', 'assets/sprites/miri.png');
    this.load.image('sar', 'assets/sprites/sar.png');
    this.load.image('fragment', 'assets/sprites/fragment.png');
    this.load.image('star', 'assets/sprites/star.png');
    this.load.image('heart', 'assets/sprites/heart.png');
    this.load.image('enemy', 'assets/sprites/enemy.png');
    this.load.image('bomb', 'assets/sprites/bomb.png');
    this.load.audio('impacto', 'assets/sounds/crash.mp3');
    this.load.audio('enemigoMuere', 'assets/sounds/enemyDeath.wav');
    this.load.audio('salto', 'assets/sounds/rise.mp3');
  }

  create() {
    this.sound.stopAll();
    this.sound.play('musica_juego', { loop: true, volume: 0.42 });

    this.buildMap();
    this.createControls();
    this.createPlayers();
    this.createWorldObjects();
    this.createHud();
  }

  buildMap() {
    this.map = this.make.tilemap({ key: 'level' });
    const rockTiles = this.map.addTilesetImage('rock_packed', 'rock_packed');
    const blueTiles = this.map.addTilesetImage('blue_tile', 'blue_tile');
    const pinkTiles = this.map.addTilesetImage('pink_tile', 'pink_tile');

    this.add.image(0, 0, 'fondo')
      .setOrigin(0)
      .setDisplaySize(960, 540)
      .setScrollFactor(0.08);

    this.layers = {
      ground: this.map.createLayer('Ground', rockTiles, 0, 0),
      platforms: this.map.createLayer('Platforms', rockTiles, 0, 0),
      blue: this.map.createLayer('BluePlatforms', blueTiles, 0, 0),
      pink: this.map.createLayer('PinkPlatforms', pinkTiles, 0, 0)
    };

    Object.values(this.layers).forEach(layer => layer.setCollisionByExclusion([-1]));
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,F,L');
  }

  createPlayers() {
    const spawns = this.getObjects('PlayerSpawns');
    const miri = this.addPlayer(PLAYER_CONFIG.miri, spawns[0] || { x: 380, y: 1780 });
    this.players.push(miri);

    if (this.mode !== 'single') {
      const sar = this.addPlayer(PLAYER_CONFIG.sar, spawns[1] || { x: 780, y: 1780 });
      this.players.push(sar);
    }

    this.players.forEach(player => {
      this.physics.add.collider(player.sprite, this.layers.ground);
      this.physics.add.collider(player.sprite, this.layers.platforms);
      this.physics.add.collider(player.sprite, this.layers[player.config.platform]);
    });

    this.cameras.main.startFollow(miri.sprite, true, 0.08, 0.08);
  }

  addPlayer(config, spawn) {
    const sprite = this.physics.add.sprite(spawn.x, spawn.y, config.texture)
      .setScale(1.2)
      .setCollideWorldBounds(true);
    sprite.body.setSize(sprite.width * 0.75, sprite.height * 0.95);

    return {
      config,
      sprite,
      lives: 3,
      stars: 0,
      fragments: 0,
      facing: 1,
      lastShot: 0,
      hurtUntil: 0,
      teleporting: false
    };
  }

  createWorldObjects() {
    this.fragments = this.physics.add.group();
    this.stars = this.physics.add.group();
    this.hearts = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.bombs = this.physics.add.group();
    this.bullets = this.physics.add.group();

    const fragmentSpawns = this.shuffle(this.getObjects('FragmentSpawns'));
    const heartSpawns = this.shuffle(this.getObjects('HeartSpawns'));
    const enemySpawns = this.shuffle(this.getObjects('EnemySpawns'));
    const switchSpawns = this.getObjects('SwitchSpawn');

    fragmentSpawns.slice(0, 3).forEach(pos => this.spawnCollectible(this.fragments, pos, 'fragment', 1.2));
    fragmentSpawns.slice(3, 13).forEach(pos => this.spawnCollectible(this.stars, pos, 'star', 1.6));
    heartSpawns.slice(0, 3).forEach(pos => this.spawnCollectible(this.hearts, pos, 'heart', 1.2));
    enemySpawns.slice(0, 8).forEach((pos, index) => this.spawnEnemy(pos, index));
    enemySpawns.slice(8, 14).forEach(pos => this.spawnBomb(pos));

    this.createPortals(fragmentSpawns.slice(14, 20));
    this.createSwitches(switchSpawns);
    this.createFinalPortal();
    this.addOverlaps();
  }

  spawnCollectible(group, pos, texture, scale) {
    const item = group.create(pos.x, pos.y, texture).setScale(scale);
    item.body.allowGravity = false;
    item.body.setCircle(Math.max(item.width, item.height) * 0.35);
    return item;
  }

  spawnEnemy(pos, index) {
    const enemy = this.enemies.create(pos.x, pos.y, 'enemy').setScale(1.15);
    enemy.setCollideWorldBounds(true);
    enemy.setVelocityX(index % 2 === 0 ? 70 : -70);
    enemy.body.setSize(enemy.width * 0.85, enemy.height * 0.9);
    this.physics.add.collider(enemy, this.layers.ground);
    this.physics.add.collider(enemy, this.layers.platforms);
  }

  spawnBomb(pos) {
    const bomb = this.bombs.create(pos.x, pos.y, 'bomb').setScale(1.6);
    bomb.body.allowGravity = false;
    bomb.body.setCircle(9);
  }

  createPortals(spawns) {
    this.portals = [];
    const portalPairs = [
      { owner: 'miri', color: 0x38a3ff, positions: [spawns[0] || { x: 120, y: 1540 }, spawns[1] || { x: 820, y: 920 }] },
      { owner: 'sar', color: 0xb369ff, positions: [spawns[2] || { x: 820, y: 1520 }, spawns[3] || { x: 130, y: 620 }] }
    ];

    portalPairs.forEach(pair => {
      pair.positions.forEach((pos, index) => {
        const zone = this.add.zone(pos.x, pos.y, 44, 72);
        this.physics.add.existing(zone, true);
        const graphic = this.add.ellipse(pos.x, pos.y, 34, 62, pair.color, 0.45)
          .setStrokeStyle(3, pair.color, 0.95);
        this.portals.push({ zone, graphic, owner: pair.owner, pairIndex: index, pair });
      });
    });
  }

  createSwitches(spawns) {
    this.switches = [];
    if (this.mode === 'single' || this.mode === 'versus') {
      return;
    }

    [
      { owner: 'miri', color: 0x38a3ff, pos: spawns[1] || { x: 340, y: 80 } },
      { owner: 'sar', color: 0xb369ff, pos: spawns[2] || { x: 590, y: 80 } }
    ].forEach(item => {
      const zone = this.add.zone(item.pos.x, item.pos.y, 48, 28);
      this.physics.add.existing(zone, true);
      const graphic = this.add.rectangle(item.pos.x, item.pos.y, 44, 18, item.color, 0.65)
        .setStrokeStyle(2, 0xffffff, 0.9);
      this.switches.push({ ...item, zone, graphic, active: false });
    });
  }

  createFinalPortal() {
    this.finalPortal = this.add.zone(480, 72, 78, 100);
    this.physics.add.existing(this.finalPortal, true);
    this.finalPortalGraphic = this.add.ellipse(480, 72, 58, 86, 0x7fffd4, 0.38)
      .setStrokeStyle(4, 0xffffff, 0.85);
  }

  addOverlaps() {
    this.players.forEach(player => {
      this.physics.add.overlap(player.sprite, this.fragments, (_, item) => this.collectFragment(player, item));
      this.physics.add.overlap(player.sprite, this.stars, (_, item) => this.collectStar(player, item));
      this.physics.add.overlap(player.sprite, this.hearts, (_, item) => this.collectHeart(player, item));
      this.physics.add.overlap(player.sprite, this.enemies, () => this.damagePlayer(player, 'enemigo'));
      this.physics.add.overlap(player.sprite, this.bombs, () => this.damagePlayer(player, 'bomba'));
      this.physics.add.overlap(player.sprite, this.finalPortal, () => this.tryFinish(player));
      this.portals.forEach(portal => {
        this.physics.add.overlap(player.sprite, portal.zone, () => this.usePortal(player, portal));
      });
    });

    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
      bullet.destroy();
      enemy.destroy();
      this.sound.play('enemigoMuere', { volume: 0.45 });
    });

    if (this.mode === 'versus') {
      this.players.forEach(target => {
        this.physics.add.overlap(this.bullets, target.sprite, bullet => {
          if (bullet.owner !== target) {
            bullet.destroy();
            this.damagePlayer(target, 'disparo');
            if (target.fragments > 0) {
              target.fragments -= 1;
              this.spawnCollectible(this.fragments, target.sprite, 'fragment', 1.2);
            }
          }
        });
      });
    }
  }

  createHud() {
    this.hud = this.add.text(16, 14, '', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.45)',
      padding: { x: 10, y: 8 }
    }).setScrollFactor(0);
  }

  update(time) {
    if (this.finished) {
      return;
    }

    this.players.forEach(player => this.updatePlayer(player, time));
    this.updateEnemies();
    this.updateSwitches();
    this.updateHud();
    this.finalPortalGraphic.setAlpha(this.canUseFinalPortal() ? 0.85 : 0.35);
  }

  updatePlayer(player, time) {
    const sprite = player.sprite;
    const left = player.config.controls === 'wasd' ? this.keys.A.isDown : this.cursors.left.isDown;
    const right = player.config.controls === 'wasd' ? this.keys.D.isDown : this.cursors.right.isDown;
    const jump = player.config.controls === 'wasd' ? Phaser.Input.Keyboard.JustDown(this.keys.W) : Phaser.Input.Keyboard.JustDown(this.cursors.up);
    const shoot = Phaser.Input.Keyboard.JustDown(this.keys[player.config.bulletKey]);

    sprite.setVelocityX(0);
    if (left) {
      sprite.setVelocityX(-210);
      sprite.setFlipX(true);
      player.facing = -1;
    } else if (right) {
      sprite.setVelocityX(210);
      sprite.setFlipX(false);
      player.facing = 1;
    }

    if (jump && sprite.body.blocked.down) {
      sprite.setVelocityY(-470);
      this.sound.play('salto', { volume: 0.25 });
    }

    if (shoot && time - player.lastShot > 420) {
      this.shoot(player, time);
    }

    sprite.setAlpha(time < player.hurtUntil ? 0.55 : 1);
  }

  updateEnemies() {
    this.enemies.children.iterate(enemy => {
      if (!enemy) {
        return;
      }
      if (enemy.body.blocked.left) {
        enemy.setVelocityX(70);
      } else if (enemy.body.blocked.right) {
        enemy.setVelocityX(-70);
      }
    });
  }

  updateSwitches() {
    this.switches.forEach(sw => {
      sw.active = sw.active || this.players.some(player => {
        return player.config.texture === sw.owner && Phaser.Geom.Intersects.RectangleToRectangle(player.sprite.getBounds(), sw.zone.getBounds());
      });
      sw.graphic.setAlpha(sw.active ? 1 : 0.45);
    });
  }

  updateHud() {
    const modeLabel = { single: 'Un jugador', coop: 'Cooperativo', versus: 'Competitivo' }[this.mode];
    const playerLines = this.players.map(player => {
      const fragments = this.mode === 'coop' ? this.sharedFragments : player.fragments;
      return `${player.config.name}: vidas ${player.lives} | fragmentos ${fragments}/3 | estrellas ${player.stars}`;
    });
    const switchLine = this.mode === 'coop'
      ? `Interruptores: Miri ${this.switches[0]?.active ? 'ON' : 'OFF'} | Sar ${this.switches[1]?.active ? 'ON' : 'OFF'}`
      : '';
    this.hud.setText([`Modo: ${modeLabel}`, ...playerLines, switchLine].filter(Boolean).join('\n'));
  }

  shoot(player, time) {
    player.lastShot = time;
    const bullet = this.bullets.create(player.sprite.x + player.facing * 22, player.sprite.y - 3, 'star').setScale(1.25);
    bullet.owner = player;
    bullet.body.allowGravity = false;
    bullet.setTint(player.config.color);
    bullet.setVelocityX(player.facing * 480);
    this.time.delayedCall(900, () => bullet.active && bullet.destroy());
  }

  collectFragment(player, item) {
    item.destroy();
    if (this.mode === 'coop') {
      this.sharedFragments += 1;
    } else {
      player.fragments += 1;
    }
  }

  collectStar(player, item) {
    item.destroy();
    player.stars += 1;
  }

  collectHeart(player, item) {
    if (player.lives < 3) {
      player.lives += 1;
    }
    item.destroy();
  }

  damagePlayer(player, reason) {
    if (this.time.now < player.hurtUntil) {
      return;
    }
    player.hurtUntil = this.time.now + 1200;
    player.lives -= 1;
    this.sound.play('impacto', { volume: 0.45 });
    player.sprite.setVelocityY(-330);

    if (player.lives <= 0) {
      const message = this.mode === 'versus'
        ? `${player.config.name} cae por ${reason}.`
        : 'Las hermanas no han logrado escapar del templo dimensional.';
      this.endGame(false, message);
    }
  }

  usePortal(player, portal) {
    if (player.teleporting || player.config.texture !== portal.owner) {
      return;
    }
    const target = this.portals.find(item => item.pair === portal.pair && item.pairIndex !== portal.pairIndex);
    if (!target) {
      return;
    }
    player.teleporting = true;
    player.sprite.setPosition(target.zone.x, target.zone.y - 12);
    this.cameras.main.flash(120, 120, 180, 255);
    this.time.delayedCall(650, () => {
      player.teleporting = false;
    });
  }

  tryFinish(player) {
    if (!this.canUseFinalPortal()) {
      return;
    }

    if (this.mode === 'coop') {
      const everyoneInside = this.players.every(item => {
        return Phaser.Geom.Intersects.RectangleToRectangle(item.sprite.getBounds(), this.finalPortal.getBounds());
      });
      if (everyoneInside) {
        this.endGame(true, 'Miri y Sar restauran juntas el Cristal de los Mundos.');
      }
      return;
    }

    if (this.mode === 'versus' && player.fragments < 3) {
      return;
    }

    this.endGame(true, `${player.config.name} alcanza el portal final.`);
  }

  canUseFinalPortal() {
    if (this.mode === 'coop') {
      return this.sharedFragments >= 3 && this.switches.every(sw => sw.active);
    }
    if (this.mode === 'versus') {
      return this.players.some(player => player.fragments >= 3);
    }
    return this.players[0].fragments >= 3;
  }

  endGame(win, message) {
    if (this.finished) {
      return;
    }
    this.finished = true;
    const stats = this.players.map(player => ({
      name: player.config.name,
      lives: Math.max(0, player.lives),
      stars: player.stars,
      fragments: this.mode === 'coop' ? this.sharedFragments : player.fragments
    }));
    this.scene.start(win ? 'VictoryScene' : 'DefeatScene', { message, stats });
  }

  getObjects(layerName) {
    return this.map.getObjectLayer(layerName)?.objects || [];
  }

  shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
  }
}
