import Phaser from 'phaser'

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UI' })
  }

  create() {
    this.scale.on('resize', this.onResize, this)
    this.buildUI()
    this.buildMinimap()
    // Pull initial state from GameScene - safe here because buildUI() is done
    const gameScene = this.scene.get('Game')
    if (gameScene && gameScene.player) {
      this.updateHp(gameScene.player.hp, gameScene.player.maxHp)
      this.updateCoins(gameScene.player.coins)
      this.updateKills(gameScene.player.kills)
      this.updateChests(gameScene.player.chestsOpened)
    }
  }

  buildUI() {
    const { width, height } = this.scale

    // ---- HP Bar ----
    const hpBg = this.add.graphics()
    hpBg.fillStyle(0x000000, 0.6)
    hpBg.fillRoundedRect(10, 10, 164, 24, 4)

    this.hpBarBg = this.add.graphics()
    this.hpBarBg.fillStyle(0x550000, 1)
    this.hpBarBg.fillRect(14, 14, 156, 16)

    this.hpBar = this.add.graphics()
    this.hpBar.fillStyle(0xdd2222, 1)
    this.hpBar.fillRect(14, 14, 156, 16)

    this.hpText = this.add.text(92, 22, '100 / 100', {
      fontFamily: 'monospace',
      fontSize: '11px',
      fill: '#ffffff',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5)

    // HP heart icon
    this.add.text(16, 10, '♥', { fontSize: '18px', fill: '#dd2222' })

    // ---- Stats row ----
    this.coinsText = this.add.text(14, 40, '🪙 0', {
      fontFamily: 'monospace',
      fontSize: '13px',
      fill: '#ffd700',
      stroke: '#000',
      strokeThickness: 2
    })

    this.killsText = this.add.text(90, 40, '⚔ 0', {
      fontFamily: 'monospace',
      fontSize: '13px',
      fill: '#ffaaaa',
      stroke: '#000',
      strokeThickness: 2
    })

    this.chestsText = this.add.text(150, 40, '📦 0', {
      fontFamily: 'monospace',
      fontSize: '13px',
      fill: '#aaddff',
      stroke: '#000',
      strokeThickness: 2
    })

    // ---- Controls hint (bottom) ----
    const hint = this.add.text(width / 2, height - 10,
      'WASD/Arrows: Move  |  Shift: Sprint  |  Space: Attack  |  E: Interact/Talk  |  Esc: Menu',
      {
        fontFamily: 'monospace',
        fontSize: '10px',
        fill: '#779977',
        stroke: '#000',
        strokeThickness: 2
      }
    ).setOrigin(0.5, 1)

    // ---- Notification text ----
    this.notifText = this.add.text(width / 2, height - 30, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      fill: '#ffd700',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5, 1).setAlpha(0)

    this.notifTween = null

    // ---- Death screen (hidden initially) ----
    this.deathOverlay = this.add.graphics().setAlpha(0)
    this.deathOverlay.fillStyle(0x000000, 0.8)
    this.deathOverlay.fillRect(0, 0, width, height)

    this.deathPanel = this.add.container(width / 2, height / 2).setAlpha(0)
    const panelBg = this.add.graphics()
    panelBg.fillStyle(0x1a0000, 0.95)
    panelBg.fillRoundedRect(-180, -120, 360, 240, 12)
    panelBg.lineStyle(2, 0x880000, 1)
    panelBg.strokeRoundedRect(-180, -120, 360, 240, 12)

    this.deathTitle = this.add.text(0, -80, 'YOU DIED', {
      fontFamily: 'monospace',
      fontSize: '32px',
      fontStyle: 'bold',
      fill: '#cc2222',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5)

    this.deathStats = this.add.text(0, -20, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      fill: '#ddaaaa',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5)

    this.deathRestartBtn = this.add.text(0, 60, '[ PLAY AGAIN ]', {
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      fill: '#dd4444'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    this.deathMenuBtn = this.add.text(0, 95, '[ MAIN MENU ]', {
      fontFamily: 'monospace',
      fontSize: '14px',
      fill: '#886666'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    this.deathRestartBtn.on('pointerdown', () => {
      this.scene.stop('Game')
      this.scene.stop('UI')
      this.scene.start('Game')
      this.scene.launch('UI')
    })
    this.deathMenuBtn.on('pointerdown', () => {
      this.scene.stop('Game')
      this.scene.stop('UI')
      this.scene.start('Menu')
    })

    this.deathPanel.add([panelBg, this.deathTitle, this.deathStats, this.deathRestartBtn, this.deathMenuBtn])
  }

  updateHp(hp, maxHp) {
    if (!this.hpBar) return
    const pct = Math.max(0, hp / maxHp)
    this.hpBar.clear()

    // Color based on hp
    let color = 0xdd2222
    if (pct > 0.6) color = 0x22dd22
    else if (pct > 0.3) color = 0xddaa22

    this.hpBar.fillStyle(color, 1)
    this.hpBar.fillRect(14, 14, Math.floor(156 * pct), 16)

    this.hpText.setText(`${hp} / ${maxHp}`)
  }

  updateCoins(coins) {
    if (!this.coinsText) return
    this.coinsText.setText(`🪙 ${coins}`)
  }

  updateKills(kills) {
    if (!this.killsText) return
    this.killsText.setText(`⚔ ${kills}`)
  }

  updateChests(chests) {
    if (!this.chestsText) return
    this.chestsText.setText(`📦 ${chests}`)
  }

  notify(message) {
    this.notifText.setText(message)
    this.notifText.setAlpha(1)

    if (this.notifTween) this.notifTween.stop()
    this.notifTween = this.tweens.add({
      targets: this.notifText,
      alpha: 0,
      delay: 2000,
      duration: 800
    })
  }

  showDeathScreen(kills, coins, chests) {
    this.deathStats.setText(
      `Enemies Slain: ${kills}\nCoins Collected: ${coins}\nChests Opened: ${chests}`
    )

    this.tweens.add({ targets: this.deathOverlay, alpha: 1, duration: 600 })
    this.tweens.add({ targets: this.deathPanel, alpha: 1, duration: 600, delay: 300 })
  }

  onResize(gameSize) {
    // Reposition notification text on resize
    if (this.notifText) {
      this.notifText.setPosition(gameSize.width / 2, gameSize.height - 30)
    }
  }

  buildMinimap() {
    // Minimap constants (must match GameScene world)
    const WORLD_W = 50
    const WORLD_H = 38
    const MAP_W = 100
    const MAP_H = 76
    const { width, height } = this.scale

    const mx = width - MAP_W - 10
    const my = 10

    // Minimap background
    const mapBg = this.add.graphics()
    mapBg.fillStyle(0x000000, 0.7)
    mapBg.fillRect(mx - 2, my - 2, MAP_W + 4, MAP_H + 4)
    mapBg.lineStyle(1, 0x446644, 1)
    mapBg.strokeRect(mx - 2, my - 2, MAP_W + 4, MAP_H + 4)

    // Draw simplified world (water = blue, tree = dark green, path = tan)
    const mapGfx = this.add.graphics()
    const CELL_W = MAP_W / WORLD_W
    const CELL_H = MAP_H / WORLD_H

    for (let row = 0; row < WORLD_H; row++) {
      for (let col = 0; col < WORLD_W; col++) {
        const cell = this._minimapGetCell(col, row, WORLD_W, WORLD_H)
        let color = 0x2a5c2a // grass
        if (cell === 'water') color = 0x1a3a8c
        else if (cell === 'tree') color = 0x0f3010
        else if (cell === 'path') color = 0x8a7a5a
        else if (cell === 'fence') color = 0x7a6a3a
        else if (cell === 'wall') color = 0x111111
        mapGfx.fillStyle(color, 1)
        mapGfx.fillRect(mx + col * CELL_W, my + row * CELL_H, CELL_W + 0.5, CELL_H + 0.5)
      }
    }

    // NPC markers (yellow/blue dots)
    const npcPositions = [
      { x: 9, y: 6, color: 0xffd700 },  // merchant
      { x: 22, y: 6, color: 0xaaddff }, // elder
    ]
    npcPositions.forEach(npc => {
      mapGfx.fillStyle(npc.color, 1)
      mapGfx.fillRect(mx + npc.x * CELL_W - 1, my + npc.y * CELL_H - 1, 3, 3)
    })

    // Player dot (bright green, updated each frame)
    this._mapGfx = mapGfx
    this._mapMx = mx
    this._mapMy = my
    this._mapCellW = CELL_W
    this._mapCellH = CELL_H
    this._mapTILE = 32

    this._playerDot = this.add.graphics()
    this._playerDot.fillStyle(0x00ff44, 1)
    this._playerDot.fillRect(0, 0, 3, 3)
    this._playerDot.setDepth(50)
  }

  _minimapGetCell(col, row, WORLD_W, WORLD_H) {
    if (col === 0 || col === WORLD_W - 1 || row === 0 || row === WORLD_H - 1) return 'wall'
    if (col >= 32 && col <= 44 && row >= 24 && row <= 34) return 'water'
    if (col >= 8 && col <= 12 && row >= 24 && row <= 28) return 'water'
    if ((col === 31 || col === 45) && row >= 24 && row <= 34) return 'rock_water'
    if (row >= 8 && row <= 10 && col >= 2 && col <= WORLD_W - 2) return 'path'
    if (col >= 22 && col <= 24 && row >= 2 && row <= WORLD_H - 2) return 'path'
    if ((row === 7 || row === 11) && col >= 3 && col <= 20 && (col * 3 + row) % 4 === 0) return 'fence'
    if (col >= 28 && col <= 46 && row >= 2 && row <= 16) {
      if (Math.abs((col * 7 + row * 13) % 3) === 0) return 'tree'
    }
    const hash = (col * 17 + row * 31) % 100
    if (hash < 8 && col > 3 && row > 3 && col < WORLD_W - 3 && row < WORLD_H - 3) return 'tree'
    return 'grass'
  }

  update() {
    // Update player dot on minimap
    if (!this._playerDot) return
    const gameScene = this.scene.get('Game')
    if (!gameScene || !gameScene.player) return

    const px = gameScene.player.x
    const py = gameScene.player.y
    const TILE = this._mapTILE
    const WORLD_W = 50
    const WORLD_H = 38
    const col = px / TILE
    const row = py / TILE
    const dotX = this._mapMx + col * this._mapCellW - 1.5
    const dotY = this._mapMy + row * this._mapCellH - 1.5

    this._playerDot.clear()
    this._playerDot.fillStyle(0x00ff44, 1)
    this._playerDot.fillCircle(dotX + 1.5, dotY + 1.5, 2.5)
  }
}
