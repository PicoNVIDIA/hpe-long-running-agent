import Phaser from 'phaser'
import Player from '../entities/Player.js'
import Enemy from '../entities/Enemy.js'

// World map layout: 0=grass, 1=path, 2=water, 3=decor, W=wall
const TILE = 32 // rendered tile size (16px * 2 scale)
const WORLD_W = 50
const WORLD_H = 38

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' })
  }

  create() {
    const worldPixelW = WORLD_W * TILE
    const worldPixelH = WORLD_H * TILE

    this.physics.world.setBounds(0, 0, worldPixelW, worldPixelH)

    // --- Build the world ---
    this.groundLayer = this.add.layer()
    this.decorLayer = this.add.layer()
    this.objectLayer = this.add.layer()

    this.buildWorld(worldPixelW, worldPixelH)

    // --- Player ---
    this.player = new Player(this, 5 * TILE + TILE / 2, 5 * TILE + TILE / 2)
    this.player.scene = this

    // --- Enemies group ---
    this.enemies = this.physics.add.group()
    this.spawnEnemies()

    // --- Chests group ---
    this.chests = this.physics.add.staticGroup()
    this.spawnChests()

    // --- Collisions ---
    this.physics.add.collider(this.player, this.wallGroup)
    this.physics.add.collider(this.enemies, this.wallGroup)
    this.physics.add.collider(this.enemies, this.enemies)

    // Player attack hits enemies
    this.physics.add.overlap(
      this.player.attackHitbox,
      this.enemies,
      this.onPlayerAttackEnemy,
      null,
      this
    )

    // Chest interaction
    this.physics.add.overlap(
      this.player,
      this.chests,
      this.onChestOverlap,
      null,
      this
    )

    // --- Camera ---
    this.cameras.main.setBounds(0, 0, worldPixelW, worldPixelH)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setZoom(1)
    this.cameras.main.fadeIn(600, 0, 0, 0)

    // --- Input ---
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    }
    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)

    // --- Events ---
    this.events.on('playerHpChanged', (hp, maxHp) => {
      const uiScene = this.scene.get('UI')
      if (uiScene) uiScene.updateHp(hp, maxHp)
    })
    this.events.on('playerDied', () => this.onPlayerDied())
    this.events.on('enemyKilled', (x, y, type) => this.onEnemyKilled(x, y, type))

    // ESC = back to menu
    this.escKey.on('down', () => this.returnToMenu())

    // Emit initial HP
    this.events.emit('playerHpChanged', this.player.hp, this.player.maxHp)

    // UI notifications
    this.uiNotifyText = null
  }

  buildWorld(worldW, worldH) {
    this.wallGroup = this.physics.add.staticGroup()

    // Fill ground with grass/plains tiles
    for (let row = 0; row < WORLD_H; row++) {
      for (let col = 0; col < WORLD_W; col++) {
        const wx = col * TILE + TILE / 2
        const wy = row * TILE + TILE / 2

        // Determine tile type
        const cell = this.getCell(col, row)

        if (cell === 'water') {
          // Water tile (animated via tween)
          const frame = Phaser.Math.Between(0, 5)
          const t = this.add.image(wx, wy, 'water_tiles', frame)
            .setScale(2).setDepth(0)
          this.groundLayer.add(t)
          // Gentle water shimmer
          this.tweens.add({
            targets: t,
            alpha: 0.85,
            duration: 1200 + Math.random() * 600,
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 1000
          })

          // Invisible wall for water
          const wall = this.add.rectangle(wx, wy, TILE, TILE, 0x0000ff, 0)
          this.physics.add.existing(wall, true)
          this.wallGroup.add(wall)

        } else if (cell === 'path') {
          const frame = Phaser.Math.Between(12, 17) // plains path frames
          const t = this.add.image(wx, wy, 'plains', frame)
            .setScale(2).setDepth(0)
          this.groundLayer.add(t)

        } else {
          // Grass - randomize between grass variants
          const r = Math.random()
          if (r < 0.7) {
            // Use plains tileset green frames
            const frame = Phaser.Math.Between(0, 5)
            const t = this.add.image(wx, wy, 'plains', frame)
              .setScale(2).setDepth(0)
            this.groundLayer.add(t)
          } else {
            // Single grass tile (tinted variants)
            const t = this.add.image(wx, wy, 'grass')
              .setScale(2).setDepth(0)
            this.groundLayer.add(t)
          }
        }

        // Decor on grass (trees, rocks)
        if (cell === 'tree') {
          const frame = Phaser.Math.Between(0, 3)
          const d = this.add.image(wx, wy - 8, 'decor', frame)
            .setScale(2).setDepth(2)
          this.decorLayer.add(d)

          // Tree collision
          const wall = this.add.rectangle(wx, wy, TILE - 4, TILE - 4, 0x00ff00, 0)
          this.physics.add.existing(wall, true)
          this.wallGroup.add(wall)
        }

        // Border walls
        if (col === 0 || col === WORLD_W - 1 || row === 0 || row === WORLD_H - 1) {
          const wall = this.add.rectangle(wx, wy, TILE, TILE, 0x000000, 0)
          this.physics.add.existing(wall, true)
          this.wallGroup.add(wall)
        }
      }
    }
  }

  getCell(col, row) {
    // Border
    if (col === 0 || col === WORLD_W - 1 || row === 0 || row === WORLD_H - 1) return 'wall'

    // Water lake in lower right
    if (col >= 32 && col <= 44 && row >= 24 && row <= 34) return 'water'
    // Small pond
    if (col >= 8 && col <= 12 && row >= 24 && row <= 28) return 'water'

    // Paths (horizontal + vertical crossing)
    if (row >= 8 && row <= 10 && col >= 2 && col <= WORLD_W - 2) return 'path'
    if (col >= 22 && col <= 24 && row >= 2 && row <= WORLD_H - 2) return 'path'

    // Forest area (dense trees top-right)
    if (col >= 28 && col <= 46 && row >= 2 && row <= 16) {
      if (Math.abs((col * 7 + row * 13) % 3) === 0) return 'tree'
    }

    // Scattered trees elsewhere
    const hash = (col * 17 + row * 31) % 100
    if (hash < 8 && col > 3 && row > 3 && col < WORLD_W - 3 && row < WORLD_H - 3) return 'tree'

    return 'grass'
  }

  spawnEnemies() {
    // Skeleton enemies in forest and around map
    const skeletonPositions = [
      { x: 35, y: 5 }, { x: 38, y: 8 }, { x: 42, y: 6 }, { x: 31, y: 12 },
      { x: 37, y: 13 }, { x: 44, y: 10 }, { x: 40, y: 4 },
      { x: 15, y: 18 }, { x: 20, y: 22 }, { x: 28, y: 20 },
      { x: 10, y: 15 }, { x: 46, y: 20 }, { x: 8, y: 32 }
    ]

    skeletonPositions.forEach(pos => {
      const cell = this.getCell(pos.x, pos.y)
      if (cell !== 'water' && cell !== 'wall') {
        const e = new Enemy(this, pos.x * TILE + TILE / 2, pos.y * TILE + TILE / 2, 'skeleton')
        this.enemies.add(e)
      }
    })

    // Slime enemies near water
    const slimePositions = [
      { x: 6, y: 26 }, { x: 10, y: 29 }, { x: 14, y: 26 },
      { x: 30, y: 25 }, { x: 46, y: 22 }, { x: 48, y: 28 },
      { x: 5, y: 14 }, { x: 18, y: 30 }, { x: 25, y: 34 }
    ]

    slimePositions.forEach(pos => {
      const cell = this.getCell(pos.x, pos.y)
      if (cell !== 'water' && cell !== 'wall') {
        const e = new Enemy(this, pos.x * TILE + TILE / 2, pos.y * TILE + TILE / 2, 'slime')
        this.enemies.add(e)
      }
    })
  }

  spawnChests() {
    const chestPositions = [
      { x: 12, y: 5 },  // near start
      { x: 40, y: 15 }, // deep forest
      { x: 5, y: 20 },  // left side
      { x: 26, y: 30 }, // south
      { x: 48, y: 5 },  // far right
    ]

    chestPositions.forEach(pos => {
      const cell = this.getCell(pos.x, pos.y)
      if (cell !== 'water' && cell !== 'wall' && cell !== 'tree') {
        const chest = this.add.sprite(pos.x * TILE + TILE / 2, pos.y * TILE + TILE / 2, 'chest', 0)
        chest.setScale(2)
        chest.setDepth(5)
        chest.opened = false
        this.physics.add.existing(chest, true)
        this.chests.add(chest)
      }
    })
  }

  onPlayerAttackEnemy(hitbox, enemy) {
    if (!hitbox.active) return
    if (enemy.isDead) return
    // Only trigger once per swing (prevent multi-hit from overlap)
    if (enemy._hitThisSwing) return
    enemy._hitThisSwing = true
    enemy.takeDamage(this.player.attackDamage)

    // Reset hit flag after short delay
    this.time.delayedCall(200, () => { enemy._hitThisSwing = false })
  }

  onChestOverlap(player, chest) {
    if (chest.opened) return

    // Require E or Space key press
    if (
      Phaser.Input.Keyboard.JustDown(this.interactKey) ||
      Phaser.Input.Keyboard.JustDown(this.attackKey)
    ) {
      chest.opened = true
      chest.play('chest_open')

      // Random reward
      const reward = Phaser.Math.Between(10, 40)
      this.player.coins += reward
      this.player.heal(20)
      this.player.chestsOpened++

      // Camera flash - gold on chest open
      this.cameras.main.flash(300, 255, 215, 0, false)

      // Floating text reward
      this.showFloatingText(chest.x, chest.y - 20, `+${reward} coins!`, '#ffd700')
      this.showFloatingText(chest.x, chest.y - 40, '+20 HP', '#88ff88')

      // Update UI
      const uiScene = this.scene.get('UI')
      if (uiScene) {
        uiScene.updateCoins(this.player.coins)
        uiScene.updateHp(this.player.hp, this.player.maxHp)
        uiScene.notify(`Chest opened! +${reward} coins, +20 HP`)
      }
    }
  }

  onEnemyKilled(x, y, type) {
    this.player.kills++

    const coinDrop = type === 'skeleton' ? Phaser.Math.Between(5, 15) : Phaser.Math.Between(2, 8)
    this.player.coins += coinDrop
    this.showFloatingText(x, y - 24, `+${coinDrop}`, '#ffd700')

    const uiScene = this.scene.get('UI')
    if (uiScene) {
      uiScene.updateCoins(this.player.coins)
      uiScene.updateKills(this.player.kills)
    }
  }

  showFloatingText(x, y, text, color = '#ffffff') {
    const t = this.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      fill: color,
      stroke: '#000000',
      strokeThickness: 3
    }).setDepth(20).setOrigin(0.5)

    this.tweens.add({
      targets: t,
      y: y - 40,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => t.destroy()
    })
  }

  onPlayerDied() {
    this.cameras.main.shake(500, 0.02)
    this.time.delayedCall(1500, () => {
      const uiScene = this.scene.get('UI')
      if (uiScene) uiScene.showDeathScreen(this.player.kills, this.player.coins, this.player.chestsOpened)
    })
  }

  returnToMenu() {
    this.cameras.main.fadeOut(400, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UI')
      this.scene.start('Menu')
    })
  }

  update(time, delta) {
    if (!this.player) return

    this.player.update(
      this.cursors,
      this.wasd,
      this.shiftKey,
      this.interactKey,
      this.attackKey
    )

    // Update enemies
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.active) enemy.update(this.player, time)
    })

    // Depth sort player vs objects
    this.player.setDepth(10 + this.player.y * 0.001)
  }
}
