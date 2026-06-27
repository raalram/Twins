import Player, { PLAYER_CONFIG } from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  // Inicializa la escena de juego con el modo especificado (un jugador, competitivo o cooperativo).
  init(data) {
    this.mode = data?.mode || 'single';
    this.players = [];
    this.enemyActors = [];
    this.sharedFragments = 0;
    this.finished = false;
  }

  // Carga de recursos
  preload() {
    this.load.image('fondo', 'assets/background/fondo.png');
    this.load.tilemapTiledJSON('level', 'assets/maps/level.json');
    this.load.image('rock_packed', 'assets/maps/rock_packed.png');
    this.load.image('blue_tile', 'assets/maps/blue_tile.png');
    this.load.image('pink_tile', 'assets/maps/pink_tile.png');
    this.load.spritesheet('miri', 'assets/sprites/miri.png', { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('sar', 'assets/sprites/sar.png', { frameWidth: 32, frameHeight: 48 });
    this.load.image('fragment', 'assets/sprites/fragment.png');
    this.load.image('star', 'assets/sprites/star.png');
    this.load.spritesheet('heart', 'assets/sprites/heart.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('enemy', 'assets/sprites/enemy_anim.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('bomb', 'assets/sprites/bomb.png');
    this.load.spritesheet('explosion', 'assets/sprites/explosion.png', { frameWidth: 96, frameHeight: 96 });
    this.load.audio('impacto', 'assets/sounds/crash.mp3');
    this.load.audio('enemigoMuere', 'assets/sounds/enemyDeath.wav');
    this.load.audio('salto', 'assets/sounds/rise.mp3');
  }

  // Inicia la escena de juego
  create() {
    this.sound.stopAll();
    this.sound.play('musica_juego', { loop: true, volume: 0.42 });
    Player.createAnimations(this);
    Enemy.createAnimations(this);
    this.createProjectileAnimations();
    this.buildMap();
    this.createControls();
    this.createPlayers();
    this.createWorldObjects();
    this.createHud();
  }

  // Construye el tilemap y activa colisiones en las capas de plataformas.
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

  // Crea los controles de teclado para los jugadores.
  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,F,L');
  }

  // Crea los jugadores en la escena según el modo de juego, asignando sus puntos de aparición y configuraciones. Crea colisiones con el mapa y las plataformas correspondientes.
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
      if (this.mode === 'single') {
        // En un jugador se permite recorrer todo el mapa sin restricciones de color. En cooperativo y competitivo, cada jugador solo puede recorrer su plataforma de color.
        this.physics.add.collider(player.sprite, this.layers.blue);
        this.physics.add.collider(player.sprite, this.layers.pink);
      } else {
        this.physics.add.collider(player.sprite, this.layers[player.config.platform]);
      }
    });
    // Configura la cámara para seguir a los jugadores, centrándose en el jugador activo o en el centro de ambos jugadores en modos cooperativo y competitivo.
    this.cameraTarget = this.add.zone(miri.sprite.x, miri.sprite.y, 1, 1);
    this.cameras.main.startFollow(this.cameraTarget, true, 0.08, 0.08);
  }

  // Agrega un jugador a la escena con la configuración y punto de aparición especificados.
  addPlayer(config, spawn) {
    return new Player(this, config, spawn);
  }

  //Crea los objetos del mundo: fragmentos, estrellas, corazones, enemigos, bombas y disparos. Se crean en posiciones aleatorias definidas en el tilemap.
  createWorldObjects() {
    this.fragments = this.physics.add.group();
    this.stars = this.physics.add.group();
    this.hearts = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.bombs = this.physics.add.group();
    this.bullets = this.physics.add.group({ allowGravity: false });
    const fragmentSpawns = this.shuffle(this.getObjects('FragmentSpawns'));
    this.fragmentRespawnPoints = fragmentSpawns;
    const heartSpawns = this.shuffle(this.getObjects('HeartSpawns'));
    const enemySpawns = this.shuffle(this.getObjects('EnemySpawns'));
    const switchSpawns = this.getObjects('SwitchSpawn');

    // Creación aleatoria de los objetos en el mapa 
    fragmentSpawns.slice(0, 3).forEach(pos => this.spawnCollectible(this.fragments, pos, 'fragment', 1.2));
    fragmentSpawns.slice(3, 13).forEach(pos => this.spawnCollectible(this.stars, pos, 'star', 1.6));
    heartSpawns.slice(0, 3).forEach(pos => this.spawnCollectible(this.hearts, pos, 'heart', 1.2));
    enemySpawns.slice(0, 8).forEach((pos, index) => this.spawnEnemy(pos, index));
    enemySpawns.slice(8, 14).forEach(pos => this.spawnBomb(pos));

    // Creación de interruptores y portal final y colisiones de jugadores con objetos del mundo
    this.createSwitches(switchSpawns);
    this.createFinalPortal();
    this.addOverlaps();
    this.addBombColliders();
    this.addBulletColliders();
  }

  // Animacion de explosion de disparos y enemigos.
  createProjectileAnimations() {
    if (this.anims.exists('explosion-hit')) {
      return;
    }
    this.anims.create({
      key: 'explosion-hit',
      frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 11 }),
      frameRate: 14,
      repeat: 0
    });
  }

  //Coleccionables: fragmentos, estrellas y corazones. Se crean con colision circular y sin gravedad.
  spawnCollectible(group, pos, texture, scale) {
    const item = group.create(pos.x, pos.y, texture, texture === 'heart' ? 0 : undefined).setScale(scale);
    item.body.allowGravity = false;
    item.body.setCircle(Math.max(item.width, item.height) * 0.35);
    return item;
  }

  // Crea un enemigo en la posicion especificada.
  spawnEnemy(pos, index) {
    const enemy = new Enemy(this, this.enemies, pos, index);
    this.enemyActors.push(enemy);
  }

  // Crea una bomba en la posicion especificada con rebote y colision circular.
  spawnBomb(pos) {
    const bomb = this.bombs.create(pos.x, pos.y, 'bomb').setScale(1.3);
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-240, 240), 20);
    bomb.body.setCircle(9);
  }

  // Agrega colisiones de las bombas con las capas del mapa para que reboten en ellas.
  addBombColliders() {
    Object.values(this.layers).forEach(layer => {
      this.physics.add.collider(this.bombs, layer);
    });
  }

  //Crea los interruptores que solo existen en el modo cooperativo y se quedan activos al pisarlos. Cada interruptor tiene un propietario (Miri o Sar) y un color asociado.
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

  // Crea el portal final que se ilumina cuando se cumplen las condiciones de victoria.
  createFinalPortal() {
    this.finalPortal = this.add.zone(480, 72, 78, 100);
    this.physics.add.existing(this.finalPortal, true);
    this.finalPortalGraphic = this.add.ellipse(480, 72, 58, 86, 0x7fffd4, 0.38)
      .setStrokeStyle(4, 0xffffff, 0.85);
  }

  // Colisiones de los jugadores con coleccionables, enemigos, bombas y portal final.
  addOverlaps() {
    this.players.forEach(player => {
      this.physics.add.overlap(player.sprite, this.fragments, (_, item) => this.collectFragment(player, item));
      this.physics.add.overlap(player.sprite, this.stars, (_, item) => this.collectStar(player, item));
      this.physics.add.overlap(player.sprite, this.hearts, (_, item) => this.collectHeart(player, item));
      this.physics.add.overlap(player.sprite, this.enemies, () => this.damagePlayer(player, 'enemigo'));
      this.physics.add.overlap(player.sprite, this.bombs, () => this.hitBomb(player));
      this.physics.add.overlap(player.sprite, this.finalPortal, () => this.tryFinish(player));
    });

    // Disparos que destruyen enemigos y se destruyen al chocar con ellos.
    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
      this.createExplosion(enemy.x, enemy.y);
      bullet.destroy();
      enemy.destroy();
      this.sound.play('enemigoMuere', { volume: 0.45 });
    });

    // En competitivo los disparos tambien pueden dañar al rival.
    if (this.mode === 'versus') {
      this.players.forEach(target => {
        this.physics.add.overlap(this.bullets, target.sprite, (objectA, objectB) => {
          const bullet = objectA?.owner ? objectA : objectB;
          this.hitPlayerWithBullet(bullet, target);
        });
      });
    }
  }

  //Crea las colisiones de los disparos con el mundo, destruyendolos al chocar con cualquier capa del mapa o al salir de los limites del mundo.
  addBulletColliders() {
    Object.values(this.layers).forEach(layer => {
      this.physics.add.collider(this.bullets, layer, bullet => {
        bullet.destroy();
      });
    });
    this.onBulletWorldBounds = body => {
      const gameObject = body.gameObject;
      if (gameObject?.owner && this.bullets.contains(gameObject)) {
        gameObject.destroy();
      }
    };
    const world = this.physics.world;
    world.on('worldbounds', this.onBulletWorldBounds);
    this.events.once('shutdown', () => {
      world.off('worldbounds', this.onBulletWorldBounds);
    });
  }

  // Crea el HUD que muestra el modo de juego, fragmentos, estrellas, vidas e interruptores. Se actualiza en tiempo real con los valores actuales de cada jugador y del modo de juego.
  createHud() {
    const hudHeight = this.mode === 'single' ? 96 : this.mode === 'coop' ? 156 : 136;
    const rowStartY = this.mode === 'coop' ? 70 : 38;
    this.hudContainer = this.add.container(14, 14).setScrollFactor(0).setDepth(1000);
    this.hudBackground = this.add.rectangle(0, 0, 390, hudHeight, 0x050816, 0.68)
      .setOrigin(0)
      .setStrokeStyle(1, 0x6aa7ff, 0.35);
    this.modeText = this.add.text(14, 10, '', {
      fontSize: '18px',
      fontFamily: 'Consolas, "Courier New", monospace',
      fontStyle: 'bold',
      color: '#ffffff'
    });
    this.sharedFragmentIcon = this.add.image(18, 48, 'fragment').setDisplaySize(22, 22);
    this.sharedFragmentText = this.add.text(34, 38, '', {
      fontSize: '17px',
      fontFamily: 'Consolas, "Courier New", monospace',
      color: '#ffffff'
    });
    this.hudContainer.add([
      this.hudBackground,
      this.modeText,
      this.sharedFragmentIcon,
      this.sharedFragmentText
    ]);
    this.hudRows = this.players.map((player, index) => this.createHudRow(player, rowStartY + index * 40));
    this.switchText = this.add.text(14, this.mode === 'coop' ? 134 : 112, '', {
      fontSize: '15px',
      fontFamily: 'Consolas, "Courier New", monospace',
      color: '#dce8ff'
    });
    this.hudContainer.add(this.switchText);
  }

  // Fila de HUD para cada jugador: nombre, fragmentos, estrellas y corazones.
  createHudRow(player, y) {
    const nameText = this.add.text(14, y, player.config.name, {
      fontSize: '17px',
      fontFamily: 'Consolas, "Courier New", monospace',
      fontStyle: 'bold',
      color: player.config.texture === 'miri' ? '#7fc8ff' : '#cf9cff'
    });
    const fragmentIcon = this.add.image(86, y + 10, 'fragment').setDisplaySize(20, 20);
    const fragmentText = this.add.text(102, y, '', {
      fontSize: '16px',
      fontFamily: 'Consolas, "Courier New", monospace',
      color: '#ffffff'
    });
    const starIcon = this.add.image(166, y + 10, 'star').setDisplaySize(22, 22);
    const starText = this.add.text(182, y, '', {
      fontSize: '16px',
      fontFamily: 'Consolas, "Courier New", monospace',
      color: '#ffffff'
    });
    const hearts = [];
    for (let i = 0; i < 3; i += 1) {
      hearts.push(this.add.image(248 + i * 28, y + 10, 'heart', 0).setDisplaySize(24, 24));
    }
    this.hudContainer.add([nameText, fragmentIcon, fragmentText, starIcon, starText, ...hearts]);
    return { nameText, fragmentIcon, fragmentText, starText, hearts };
  }

//Actualiza la escena en cada frame: actualiza jugadores, enemigos, cámara, interruptores, HUD y verifica condiciones de derrota.
  update(time) {
    if (this.finished) {
      return;
    }
    const activePlayers = this.getActivePlayers();
    activePlayers.forEach(player => player.update(time, this.keys, this.cursors, (actor, now) => this.shoot(actor, now)));
    this.keepPlayersTogether(activePlayers);
    this.updateCameraTarget(activePlayers);
    this.enemyActors.forEach(enemy => enemy.update(activePlayers));
    this.checkLoseConditions();
    this.updateSwitches();
    this.updateHud();
    this.finalPortalGraphic.setAlpha(this.canUseFinalPortal() ? 0.85 : 0.35);
  }

// Condicion de derrota: la partida termina cuando no queda ningun jugador activo.
  checkLoseConditions() {
    if (this.getActivePlayers().length === 0) {
      this.gameOver();
    }
  }

// Actualiza el estado de los interruptores en el modo cooperativo, activandolos si algun jugador pisa su zona correspondiente.
  updateSwitches() {
    this.switches.forEach(sw => {
      sw.active = sw.active || this.players.some(player => {
        return player.config.texture === sw.owner && Phaser.Geom.Intersects.RectangleToRectangle(player.sprite.getBounds(), sw.zone.getBounds());
      });
      sw.graphic.setAlpha(sw.active ? 1 : 0.45);
    });
  }

// Actualiza el HUD con los valores actuales de cada jugador y del modo de juego.
  updateHud() {
    const modeLabel = { single: 'Un jugador', coop: 'Cooperativo', versus: 'Competitivo' }[this.mode];
    this.modeText.setText(`Modo: ${modeLabel}`);
    this.sharedFragmentIcon.setVisible(this.mode === 'coop');
    this.sharedFragmentText.setVisible(this.mode === 'coop');
    this.sharedFragmentText.setText(`Fragmentos comunes: ${this.sharedFragments}/3`);
    this.players.forEach((player, index) => {
      const row = this.hudRows[index];
      const fragments = this.mode === 'coop' ? this.sharedFragments : player.fragments;
      row.fragmentIcon.setVisible(this.mode !== 'coop');
      row.fragmentText.setVisible(this.mode !== 'coop');
      row.fragmentText.setText(`${fragments}/3`);
      row.starText.setText(`${player.stars}`);
      row.nameText.setAlpha(player.eliminated ? 0.35 : 1);
      row.fragmentIcon.setAlpha(player.eliminated ? 0.35 : 1);
      row.fragmentText.setAlpha(player.eliminated ? 0.35 : 1);
      row.starText.setAlpha(player.eliminated ? 0.35 : 1);
      row.hearts.forEach((heart, heartIndex) => {
        heart.setAlpha(!player.eliminated && heartIndex < Math.max(0, player.lives) ? 1 : 0.22);
      });
    });
    this.switchText.setText(this.mode === 'coop'
      ? `Interruptores: Miri ${this.switches[0]?.active ? 'ON' : 'OFF'} | Sar ${this.switches[1]?.active ? 'ON' : 'OFF'}`
      : '');
  }

// Disparo del jugador: crea un proyectil que se mueve en la direccion que mira el personaje.
  shoot(player, time) {
    player.lastShot = time;
    this.sound.play('impacto', { volume: 0.22 });
    const bullet = this.bullets.create(player.sprite.x + player.facing * 25, player.sprite.y, 'explosion', 1)
      .setScale(0.26);
    bullet.owner = player;
    bullet.body.allowGravity = false;
    bullet.body.setSize(44, 44, true);
    bullet.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true;
    bullet.setVelocityX(player.facing * 500);
    this.time.delayedCall(1200, () => bullet.active && bullet.destroy());
  }
   
// Efecto visual de explosion al destruir un enemigo o chocar un disparo con el mapa.
  createExplosion(x, y) {
    const explosion = this.add.sprite(x, y, 'explosion').setScale(0.55);
    explosion.play('explosion-hit');
    explosion.on('animationcomplete', () => explosion.destroy());
  }

//Recoleccion de fragmentos, estrellas y corazones: se destruye el objeto y se suma al jugador o al contador compartido en modo cooperativo.
  collectFragment(player, item) {
    item.destroy();
    if (this.mode === 'coop') {
      this.sharedFragments += 1;
    } else {
      player.fragments += 1;
    }
  }

// Recoleccion de estrellas: se destruye el objeto y se suma al jugador.
  collectStar(player, item) {
    item.destroy();
    player.stars += 1;
  }

// Recoleccion de corazones: se destruye el objeto y se suma una vida al jugador, hasta un máximo de 3.
  collectHeart(player, item) {
    if (player.lives < 3) {
      player.lives += 1;
    }
    item.destroy();
  }

// Colision con bombas: el jugador pierde una estrella y un fragmento, pero no vida. Se aplica un tiempo de invulnerabilidad para evitar daño repetido.
  hitBomb(player) {
    if (player.eliminated || this.time.now < player.hurtUntil) {
      return;
    }
    player.hurtUntil = this.time.now + 900;
    player.stars = Math.max(0, player.stars - 1);
    this.dropFragmentFromPlayer(player);
    player.sprite.setVelocityY(-260);
    this.sound.play('impacto', { volume: 0.35 });
  }

// El jugador pierde un fragmento y este reaparece en el mapa. En modo cooperativo, se resta del contador compartido.
  dropFragmentFromPlayer(player) {
    if (this.mode === 'coop') {
      if (this.sharedFragments <= 0) {
        return;
      }
      this.sharedFragments -= 1;
      this.respawnFragment();
      return;
    }
    if (player.fragments <= 0) {
      return;
    }
    player.fragments -= 1;
    this.respawnFragment();
  }

// Respawnea un fragmento en el mapa en un punto aleatorio de los definidos en el tilemap.
  respawnFragment() {
    const points = this.fragmentRespawnPoints?.length ? this.fragmentRespawnPoints : this.getObjects('FragmentSpawns');
    const pos = Phaser.Utils.Array.GetRandom(points);
    this.spawnCollectible(this.fragments, pos, 'fragment', 1.2);
  }

// Mantiene a los jugadores juntos en pantalla, evitando que uno se quede demasiado atrás del otro. Se aplica un límite vertical de separación y se ajusta la posición del jugador superior si es necesario.
  keepPlayersTogether(activePlayers) {
    if (this.mode === 'single' || activePlayers.length < 2) {
      return;
    }
    const maxVerticalGap = 360;
    const topPlayer = activePlayers.reduce((highest, player) => player.sprite.y < highest.sprite.y ? player : highest);
    const bottomPlayer = activePlayers.reduce((lowest, player) => player.sprite.y > lowest.sprite.y ? player : lowest);
    if (bottomPlayer.sprite.y - topPlayer.sprite.y > maxVerticalGap) {
      topPlayer.sprite.y = bottomPlayer.sprite.y - maxVerticalGap;
      if (topPlayer.sprite.body.velocity.y < 0) {
        topPlayer.sprite.setVelocityY(0);
      }
    }
    const camera = this.cameras.main;
    const bottomLimit = camera.scrollY + camera.height - 54;
    activePlayers.forEach(player => {
      if (player.sprite.y > bottomLimit) {
        player.sprite.y = bottomLimit;
        player.sprite.setVelocityY(Math.min(player.sprite.body.velocity.y, 0));
      }
    });
  }

// Actualiza la posición de la cámara para seguir el punto medio de los jugadores activos, manteniéndolos en pantalla.
  updateCameraTarget(activePlayers) {
    if (!this.cameraTarget || activePlayers.length === 0) {
      return;
    }
    const averageX = activePlayers.reduce((total, player) => total + player.sprite.x, 0) / activePlayers.length;
    const averageY = activePlayers.reduce((total, player) => total + player.sprite.y, 0) / activePlayers.length;
    this.cameraTarget.setPosition(averageX, averageY);
  }

// Colision de disparos en modo competitivo: el disparo quita una estrella y un fragmento al jugador rival, pero no vida. Se aplica un tiempo de invulnerabilidad para evitar daño repetido.
  hitPlayerWithBullet(bullet, target) {
    if (this.finished || target.eliminated || !bullet?.active || !bullet.owner || bullet.owner === target || this.time.now < target.hurtUntil) {
      return;
    }
    if (bullet.body) {
      bullet.body.enable = false;
    }
    bullet.destroy();
    target.hurtUntil = this.time.now + 900;
    target.stars = Math.max(0, target.stars - 1);
    target.sprite.setVelocityY(-220);
    this.sound.play('impacto', { volume: 0.35 });
    if (target.fragments > 0) {
      target.fragments -= 1;
      this.respawnFragment();
      this.updateHud();
    }
    this.updateHud();
  }

//Daño al jugador: se resta una vida y se aplica un tiempo de invulnerabilidad para evitar daño repetido. Si el jugador se queda sin vidas, se elimina de la partida.
  damagePlayer(player, reason) {
    if (player.eliminated || this.time.now < player.hurtUntil) {
      return;
    }
    player.hurtUntil = this.time.now + 1200;
    player.lives = Math.max(0, player.lives - 1);
    this.sound.play('impacto', { volume: 0.45 });
    player.sprite.setVelocityY(-330);
    this.updateHud();
    if (player.lives <= 0) {
      this.eliminatePlayer(player);
    }
  }

//El jugador sin vidas desaparece, pero la partida continua si queda alguien activo.
  eliminatePlayer(player) {
    if (player.eliminated) {
      return;
    }
    player.eliminated = true;
    player.lives = 0;
    player.sprite.disableBody(true, true);
    player.sprite.setActive(false);
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length > 0) {
      this.cameras.main.startFollow(activePlayers[0].sprite, true, 0.08, 0.08);
    } else {
      this.gameOver();
    }
    this.updateHud();
  }

  // Devuelve los jugadores activos en la partida: que no han sido eliminados y cuyo sprite sigue activo en la escena.
  getActivePlayers() {
    return this.players.filter(player => !player.eliminated && player.sprite.active);
  }

  // Termina la partida y envia las estadisticas finales a la escena de Game Over, mostrando un mensaje de derrota. Se detiene la fisica y el sonido, se tintan los jugadores de rojo y se reproduce su animacion de idle.
  gameOver() {
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
    this.physics.pause();
    this.sound.stopAll();
    this.players.forEach(player => {
      player.sprite.setTint(0xff0000);
      player.sprite.play(`${player.config.texture}-idle`, true);
    });
    this.time.addEvent({
      delay: 1000,
      loop: false,
      callback: () => {
        this.scene.start('GameOverScene', {
          message: '¡Oh no! Has perdido. Los mundos han sido destruidos.',
          stats
        });
      }
    });
  }

  // Comprueba si un jugador puede atravesar el portal final y termina la partida si se cumplen las condiciones de victoria.
  tryFinish(player) {
    if (player.eliminated) {
      return;
    }
    if (!this.canUseFinalPortal()) {
      return;
    }
    if (this.mode === 'coop') {
      const activePlayers = this.getActivePlayers();
      const everyoneInside = activePlayers.length > 0 && activePlayers.every(item => {
        return Phaser.Geom.Intersects.RectangleToRectangle(item.sprite.getBounds(), this.finalPortal.getBounds());
      });
      if (everyoneInside) {
        this.endGame(true, 'Miri y Sar restauran juntas el Cristal de los Mundos.');
      }
      return;
    }
    if (player.fragments < 3) {
      return;
    }
    this.endGame(true, `${player.config.name} atraviesa el portal final.`, player);
  }

// Comprueba si se cumplen las condiciones para usar el portal final: en cooperativo, se deben recoger los fragmentos y activar los interruptores; en competitivo o un jugador, solo se requiere recoger los fragmentos.
  canUseFinalPortal() {
    if (this.mode === 'coop') {
      const activeOwners = new Set(this.getActivePlayers().map(player => player.config.texture));
      return this.sharedFragments >= 3 && this.switches.every(sw => sw.active || !activeOwners.has(sw.owner));
    }
    return this.getActivePlayers().some(player => player.fragments >= 3);
  }

// Finaliza la partida y envia las estadisticas finales a la escena de Victoria o Game Over segun el resultado.
  endGame(win, message, winner = null) {
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
    if (win && this.mode === 'versus') {
      const winnerTexture = winner?.config.texture;
      const results = this.players.map(player => ({
        name: player.config.name,
        winner: player.config.texture === winnerTexture
      }));
      this.scene.start('CompetitiveVictoryScene', { message, results, stats });
      return;
    }
    this.scene.start(win ? 'VictoryScene' : 'GameOverScene', { message, stats });
  }

// Obtiene los objetos de un layer especifico del tilemap, o un array vacio si no existe.
  getObjects(layerName) {
    return this.map.getObjectLayer(layerName)?.objects || [];
  }

// Mezcla un array de items para generar posiciones aleatorias sin modificar el array original.
  shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
  }
}

