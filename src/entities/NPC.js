
const DIALOGUES = {
  merchant: [
    "Welcome, traveller! These woods hide many secrets.",
    "Beware the skeletons in the northern forest!",
    "Find chests to heal yourself and gather coins.",
    "The lake to the southeast is beautiful... but dangerous.",
    "Press E near me to talk. Sprint with Shift to move faster!"
  ],
  elder: [
    "These woods have been cursed for centuries...",
    "Defeat the skeletons to lift the ancient blight.",
    "Many have tried. Few have returned.",
    "Press Space to attack. Good luck, hero."
  ]
}

export default class NPC extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = 'merchant') {
    super(scene, x, y, 'player') // reuse player spritesheet for NPC
    this.npcType = type

    scene.add.existing(this)
    scene.physics.add.existing(this, true) // static body

    this.setScale(2)
    this.setDepth(10)
    this.setTint(type === 'merchant' ? 0xffd700 : 0xaaddff)

    this.body.setSize(20, 20)
    this.body.setOffset(14, 24)

    this.dialogueLines = DIALOGUES[type] || DIALOGUES.merchant
    this.dialogueIndex = 0
    this.isDialogueOpen = false

    // Idle animation (use left-facing idle to distinguish from player)
    this.play('player_idle_left')

    // Floating name tag
    this.nameTag = scene.add.text(x, y - 36, type === 'merchant' ? 'Merchant' : 'Elder', {
      fontFamily: 'monospace',
      fontSize: '11px',
      fill: type === 'merchant' ? '#ffd700' : '#aaddff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(20)

    // Interact hint (hidden by default)
    this.interactHint = scene.add.text(x, y - 52, '[E] Talk', {
      fontFamily: 'monospace',
      fontSize: '10px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(20).setAlpha(0)

    // Gentle bob animation
    scene.tweens.add({
      targets: [this.nameTag, this.interactHint],
      y: `-=4`,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Dialogue bubble container (hidden)
    this.dialogueBubble = null
    this.dialogueText = null
    this.dialogueNextHint = null
  }

  showHint(show) {
    this.interactHint.setAlpha(show ? 1 : 0)
  }

  interact(scene) {
    if (this.isDialogueOpen) {
      // Advance dialogue
      this.dialogueIndex = (this.dialogueIndex + 1) % this.dialogueLines.length
      if (this.dialogueText) {
        this.dialogueText.setText(this.dialogueLines[this.dialogueIndex])
      }
    } else {
      this.openDialogue(scene)
    }
  }

  openDialogue(scene) {
    this.isDialogueOpen = true
    this.dialogueIndex = 0

    const cx = this.x
    const cy = this.y - 80

    // Background bubble
    const bg = scene.add.graphics()
    bg.fillStyle(0x000000, 0.85)
    bg.fillRoundedRect(cx - 130, cy - 40, 260, 70, 8)
    bg.lineStyle(2, this.npcType === 'merchant' ? 0xffd700 : 0xaaddff, 1)
    bg.strokeRoundedRect(cx - 130, cy - 40, 260, 70, 8)
    bg.setDepth(30)

    this.dialogueText = scene.add.text(cx, cy - 10, this.dialogueLines[0], {
      fontFamily: 'monospace',
      fontSize: '12px',
      fill: '#ffffff',
      wordWrap: { width: 240 },
      align: 'center'
    }).setOrigin(0.5).setDepth(31)

    this.dialogueNextHint = scene.add.text(cx + 110, cy + 20, '[E] Next', {
      fontFamily: 'monospace',
      fontSize: '9px',
      fill: '#aaaaaa'
    }).setOrigin(1, 0.5).setDepth(31)

    this.dialogueBubble = scene.add.container(0, 0, [bg, this.dialogueText, this.dialogueNextHint])
    this.dialogueBubble.setDepth(30)

    // Auto-close after cycling all lines
    this._dialogueCloseHandler = () => {
      if (this.dialogueIndex === this.dialogueLines.length - 1) {
        this.closeDialogue()
      }
    }
  }

  closeDialogue() {
    this.isDialogueOpen = false
    if (this.dialogueBubble) {
      this.dialogueBubble.destroy(true)
      this.dialogueBubble = null
      this.dialogueText = null
      this.dialogueNextHint = null
    }
  }

  destroy(fromScene) {
    if (this.nameTag) this.nameTag.destroy()
    if (this.interactHint) this.interactHint.destroy()
    this.closeDialogue()
    super.destroy(fromScene)
  }
}
