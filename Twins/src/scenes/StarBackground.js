export function createStarBackground(scene) {
  const width = scene.cameras.main.width;
  const height = scene.cameras.main.height;

  scene.add.rectangle(width / 2, height / 2, width, height, 0x071a33);
  scene.add.rectangle(width / 2, height / 2, width, height, 0x0d2b55, 0.28);

  for (let i = 0; i < 95; i += 1) {
    const x = Phaser.Math.Between(0, width);
    const y = Phaser.Math.Between(0, height);
    const radius = Phaser.Math.FloatBetween(0.8, 2.2);
    const alpha = Phaser.Math.FloatBetween(0.35, 0.95);

    scene.add.circle(x, y, radius, 0xffffff, alpha);
  }

  for (let i = 0; i < 14; i += 1) {
    const x = Phaser.Math.Between(20, width - 20);
    const y = Phaser.Math.Between(20, height - 20);
    const star = scene.add.star(x, y, 4, 2, 7, 0xb9dcff, 0.7);
    star.setAngle(45);
  }
}
