
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Menu' })
  }

  create() {
    const { width, height } = this.scale

    // Background - dark forest gradient effect using graphics
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0a1628, 0x0a1628, 0x0d2b1e, 0x0d2b1e, 1)
    bg.fillRect(0, 0, width, height)

    // Decorative tiled background using plains tileset
    for (let x = 0; x < width; x += 16) {
      for (let y = 0; y < height; y += 16) {
        const frame = Phaser.Math.Between(0, 5)
        const tile = this.add.image(x + 8, y + 8, 'plains', frame)
        tile.setAlpha(0.15)
      }
    }

    // Title panel
    const panelWidth = 400
    const panelHeight = 300
    const panelX = width / 2 - panelWidth / 2
    const panelY = height / 2 - panelHeight / 2 - 20

    const panel = this.add.graphics()
    panel.fillStyle(0x000000, 0.6)
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 12)
    panel.lineStyle(2, 0x4a9f5b, 1)
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 12)

    // Title text
    this.add.text(width / 2, panelY + 50, 'MYSTIC WOODS', {
      fontFamily: 'monospace',
      fontSize: '36px',
      fontStyle: 'bold',
      fill: '#c8f0c8',
      stroke: '#1a3a1a',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
    }).setOrigin(0.5)

    this.add.text(width / 2, panelY + 90, 'An Exploration RPG', {
      fontFamily: 'monospace',
      fontSize: '14px',
      fill: '#88bb88'
    }).setOrigin(0.5)

    // Animated player sprite preview
    const playerPreview = this.add.sprite(width / 2, panelY + 155, 'player')
    playerPreview.setScale(3)
    playerPreview.play('player_idle_right')

    // Controls hint
    this.add.text(width / 2, panelY + 210, 'WASD / Arrow Keys to move', {
      fontFamily: 'monospace',
      fontSize: '12px',
      fill: '#779977'
    }).setOrigin(0.5)
    this.add.text(width / 2, panelY + 228, 'Hold Shift to Sprint  |  E / Space to Interact', {
      fontFamily: 'monospace',
      fontSize: '12px',
      fill: '#779977'
    }).setOrigin(0.5)

    // Start button
    const btnY = panelY + panelHeight + 30
    const btnBg = this.add.graphics()
    btnBg.fillStyle(0x2d6b3a, 1)
    btnBg.fillRoundedRect(width / 2 - 100, btnY - 20, 200, 44, 8)
    btnBg.lineStyle(2, 0x5ab96a, 1)
    btnBg.strokeRoundedRect(width / 2 - 100, btnY - 20, 200, 44, 8)

    const startBtn = this.add.text(width / 2, btnY + 2, '[ ENTER THE WOODS ]', {
      fontFamily: 'monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      fill: '#d4f7d4'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // Button hover effects
    startBtn.on('pointerover', () => {
      btnBg.clear()
      btnBg.fillStyle(0x3d8b4a, 1)
      btnBg.fillRoundedRect(width / 2 - 100, btnY - 20, 200, 44, 8)
      btnBg.lineStyle(2, 0x7ad98a, 1)
      btnBg.strokeRoundedRect(width / 2 - 100, btnY - 20, 200, 44, 8)
      startBtn.setFill('#ffffff')
    })
    startBtn.on('pointerout', () => {
      btnBg.clear()
      btnBg.fillStyle(0x2d6b3a, 1)
      btnBg.fillRoundedRect(width / 2 - 100, btnY - 20, 200, 44, 8)
      btnBg.lineStyle(2, 0x5ab96a, 1)
      btnBg.strokeRoundedRect(width / 2 - 100, btnY - 20, 200, 44, 8)
      startBtn.setFill('#d4f7d4')
    })
    startBtn.on('pointerdown', () => this.startGame())

    // Also allow Enter/Space to start
    this.input.keyboard.once('keydown-ENTER', () => this.startGame())
    this.input.keyboard.once('keydown-SPACE', () => this.startGame())

    // Blinking cursor effect on button
    this.tweens.add({
      targets: startBtn,
      alpha: 0.6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Version text
    this.add.text(width - 10, height - 10, 'v1.0', {
      fontFamily: 'monospace',
      fontSize: '10px',
      fill: '#446644'
    }).setOrigin(1, 1)
  }

  startGame() {
    this.cameras.main.fadeOut(500, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Game')
      this.scene.launch('UI')
    })
  }
}
