import Phaser from 'phaser'

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UI' })
  }

  create() {
    this.scale.on('resize', this.onResize, this)
    this.buildUI()
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
      'WASD/Arrows: Move  |  Shift: Sprint  |  Space/E: Attack/Interact  |  Esc: Menu',
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
    this.coinsText.setText(`🪙 ${coins}`)
  }

  updateKills(kills) {
    this.killsText.setText(`⚔ ${kills}`)
  }

  updateChests(chests) {
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
}
