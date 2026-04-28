import * as Phaser from 'phaser'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' })
  }

  preload() {
    // Characters
    this.load.spritesheet('player', 'assets/sprites/characters/player.png', {
      frameWidth: 48,
      frameHeight: 48
    })
    this.load.spritesheet('skeleton', 'assets/sprites/characters/skeleton.png', {
      frameWidth: 48,
      frameHeight: 48
    })
    this.load.spritesheet('slime', 'assets/sprites/characters/slime.png', {
      frameWidth: 32,
      frameHeight: 32
    })

    // Tilesets
    this.load.image('grass', 'assets/sprites/tilesets/grass.png')
    this.load.spritesheet('plains', 'assets/sprites/tilesets/plains.png', {
      frameWidth: 16,
      frameHeight: 16
    })
    this.load.spritesheet('decor', 'assets/sprites/tilesets/decor_16x16.png', {
      frameWidth: 16,
      frameHeight: 16
    })
    this.load.spritesheet('flooring', 'assets/sprites/tilesets/floors/flooring.png', {
      frameWidth: 16,
      frameHeight: 16
    })
    this.load.spritesheet('walls', 'assets/sprites/tilesets/walls/walls.png', {
      frameWidth: 16,
      frameHeight: 16
    })
    this.load.spritesheet('water_tiles', 'assets/sprites/tilesets/water1.png', {
      frameWidth: 16,
      frameHeight: 16
    })

    // Objects
    this.load.spritesheet('chest', 'assets/sprites/objects/chest_01.png', {
      frameWidth: 16,
      frameHeight: 16
    })
    this.load.spritesheet('objects', 'assets/sprites/objects/objects.png', {
      frameWidth: 16,
      frameHeight: 16
    })

    // Particles
    this.load.spritesheet('dust', 'assets/sprites/particles/dust_particles_01.png', {
      frameWidth: 16,
      frameHeight: 12
    })

    // Additional assets
    this.load.spritesheet('chest_02', 'assets/sprites/objects/chest_02.png', {
      frameWidth: 16,
      frameHeight: 16
    })
    this.load.spritesheet('fences', 'assets/sprites/tilesets/fences.png', {
      frameWidth: 16,
      frameHeight: 16
    })
    this.load.spritesheet('water_anim', 'assets/sprites/tilesets/water-sheet.png', {
      frameWidth: 16,
      frameHeight: 48
    })
    this.load.spritesheet('rock_in_water', 'assets/sprites/objects/rock_in_water-sheet.png', {
      frameWidth: 16,
      frameHeight: 16
    })
    this.load.image('wooden_door', 'assets/sprites/tilesets/walls/wooden_door.png')

    // Loading bar
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    const progressBar = this.add.graphics()
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x222222, 0.8)
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50)

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading Mystic Woods...', {
      fontFamily: 'monospace',
      fontSize: '18px',
      fill: '#a8d8a8'
    }).setOrigin(0.5)

    this.load.on('progress', (value) => {
      progressBar.clear()
      progressBar.fillStyle(0x4a9f5b, 1)
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30)
    })

    this.load.on('complete', () => {
      progressBar.destroy()
      progressBox.destroy()
      loadingText.destroy()
    })
  }

  create() {
    this.createAnimations()
    this.scene.start('Menu')
  }

  createAnimations() {
    // Player animations (48x48, 6 frames per row)
    // Rows 0-2: idle, Rows 3-5: move, Rows 6-8: attack, Row 9: death
    const playerFramesPerRow = 6 // 288/48 = 6

    // Idle: rows 0-2 (18 frames total, cycle through row 0 for default)
    this.anims.create({
      key: 'player_idle_right',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1
    })
    this.anims.create({
      key: 'player_idle_left',
      frames: this.anims.generateFrameNumbers('player', { start: 6, end: 11 }),
      frameRate: 8,
      repeat: -1
    })
    this.anims.create({
      key: 'player_idle_up',
      frames: this.anims.generateFrameNumbers('player', { start: 12, end: 17 }),
      frameRate: 8,
      repeat: -1
    })

    // Move: rows 3-5
    this.anims.create({
      key: 'player_walk_right',
      frames: this.anims.generateFrameNumbers('player', { start: 18, end: 23 }),
      frameRate: 10,
      repeat: -1
    })
    this.anims.create({
      key: 'player_walk_left',
      frames: this.anims.generateFrameNumbers('player', { start: 24, end: 29 }),
      frameRate: 10,
      repeat: -1
    })
    this.anims.create({
      key: 'player_walk_up',
      frames: this.anims.generateFrameNumbers('player', { start: 30, end: 35 }),
      frameRate: 10,
      repeat: -1
    })

    // Attack: rows 6-8
    this.anims.create({
      key: 'player_attack_right',
      frames: this.anims.generateFrameNumbers('player', { start: 36, end: 41 }),
      frameRate: 12,
      repeat: 0
    })
    this.anims.create({
      key: 'player_attack_left',
      frames: this.anims.generateFrameNumbers('player', { start: 42, end: 47 }),
      frameRate: 12,
      repeat: 0
    })
    this.anims.create({
      key: 'player_attack_up',
      frames: this.anims.generateFrameNumbers('player', { start: 48, end: 53 }),
      frameRate: 12,
      repeat: 0
    })

    // Death: row 9
    this.anims.create({
      key: 'player_death',
      frames: this.anims.generateFrameNumbers('player', { start: 54, end: 59 }),
      frameRate: 8,
      repeat: 0
    })

    // Skeleton animations (48x48, 6 frames per row)
    // Rows 0-2: idle, 3-5: move, 6-8: attack, 9-11: damaged, 12: death
    this.anims.create({
      key: 'skeleton_idle',
      frames: this.anims.generateFrameNumbers('skeleton', { start: 0, end: 5 }),
      frameRate: 6,
      repeat: -1
    })
    this.anims.create({
      key: 'skeleton_walk',
      frames: this.anims.generateFrameNumbers('skeleton', { start: 18, end: 23 }),
      frameRate: 8,
      repeat: -1
    })
    this.anims.create({
      key: 'skeleton_attack',
      frames: this.anims.generateFrameNumbers('skeleton', { start: 36, end: 41 }),
      frameRate: 10,
      repeat: 0
    })
    this.anims.create({
      key: 'skeleton_damaged',
      frames: this.anims.generateFrameNumbers('skeleton', { start: 54, end: 59 }),
      frameRate: 10,
      repeat: 0
    })
    this.anims.create({
      key: 'skeleton_death',
      frames: this.anims.generateFrameNumbers('skeleton', { start: 72, end: 77 }),
      frameRate: 8,
      repeat: 0
    })

    // Slime animations (32x32, 7 frames per row: 224/32=7)
    this.anims.create({
      key: 'slime_idle',
      frames: this.anims.generateFrameNumbers('slime', { start: 0, end: 6 }),
      frameRate: 6,
      repeat: -1
    })
    this.anims.create({
      key: 'slime_walk',
      frames: this.anims.generateFrameNumbers('slime', { start: 21, end: 27 }),
      frameRate: 8,
      repeat: -1
    })
    this.anims.create({
      key: 'slime_attack',
      frames: this.anims.generateFrameNumbers('slime', { start: 42, end: 48 }),
      frameRate: 10,
      repeat: 0
    })
    this.anims.create({
      key: 'slime_death',
      frames: this.anims.generateFrameNumbers('slime', { start: 84, end: 90 }),
      frameRate: 8,
      repeat: 0
    })

    // Chest animation (16x16, 4 frames per row: 64/16=4)
    this.anims.create({
      key: 'chest_open',
      frames: this.anims.generateFrameNumbers('chest', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: 0
    })

    // Dust particles (16x12, 3 frames per row: 48/16=3)
    this.anims.create({
      key: 'dust',
      frames: this.anims.generateFrameNumbers('dust', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: 0
    })

    // Chest 02 (64x16 = 4 frames at 16x16)
    this.anims.create({
      key: 'chest_02_open',
      frames: this.anims.generateFrameNumbers('chest_02', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: 0
    })

    // Animated water (480x48, 30 columns x 1 row at 16x48 each column = 30 frames)
    this.anims.create({
      key: 'water_anim',
      frames: this.anims.generateFrameNumbers('water_anim', { start: 0, end: 29 }),
      frameRate: 8,
      repeat: -1
    })
  }
}
