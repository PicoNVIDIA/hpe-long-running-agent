import * as Phaser from 'phaser'

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player')

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setScale(2)
    this.setDepth(10)

    // Hitbox smaller than sprite
    this.body.setSize(20, 20)
    this.body.setOffset(14, 24)

    // Stats
    this.maxHp = 100
    this.hp = 100
    this.walkSpeed = 80
    this.sprintSpeed = 160
    this.attackDamage = 25
    this.attackCooldown = 500
    this.invincibleTime = 800

    // State
    this.facing = 'right'
    this.isAttacking = false
    this.isInvincible = false
    this.isDead = false
    this.lastAttackTime = 0
    this.coins = 0
    this.chestsOpened = 0
    this.kills = 0

    // Attack hitbox
    this.attackHitbox = scene.add.rectangle(0, 0, 40, 30, 0xffffff, 0)
    scene.physics.add.existing(this.attackHitbox, false)
    this.attackHitbox.body.allowGravity = false
    this.attackHitbox.active = false

    this.play('player_idle_right')
  }

  update(cursors, wasd, shiftKey, interactKey, attackKey) {
    if (this.isDead) return

    const isSprinting = shiftKey.isDown
    const speed = isSprinting ? this.sprintSpeed : this.walkSpeed

    let vx = 0
    let vy = 0
    const left = cursors.left.isDown || wasd.left.isDown
    const right = cursors.right.isDown || wasd.right.isDown
    const up = cursors.up.isDown || wasd.up.isDown
    const down = cursors.down.isDown || wasd.down.isDown

    if (!this.isAttacking) {
      if (left) { vx = -speed; this.facing = 'left' }
      else if (right) { vx = speed; this.facing = 'right' }
      if (up) { vy = -speed; this.facing = 'up' }
      else if (down) { vy = speed; this.facing = 'down' }

      // Normalize diagonal
      if (vx !== 0 && vy !== 0) {
        vx *= 0.707
        vy *= 0.707
      }

      this.body.setVelocity(vx, vy)

      // Animations
      const moving = vx !== 0 || vy !== 0
      const animSuffix = this.facing === 'down' ? 'right' : this.facing
      if (moving) {
        const anim = `player_walk_${animSuffix}`
        if (this.anims.currentAnim?.key !== anim) this.play(anim)
        this.setFlipX(this.facing === 'down' ? false : false)
      } else {
        const anim = `player_idle_${animSuffix}`
        if (this.anims.currentAnim?.key !== anim) this.play(anim)
      }
    } else {
      this.body.setVelocity(0, 0)
    }

    // Attack
    const now = this.scene.time.now
    if ((attackKey.isDown || Phaser.Input.Keyboard.JustDown(interactKey)) && 
        now - this.lastAttackTime > this.attackCooldown && !this.isAttacking) {
      this.doAttack()
    }

    // Update attack hitbox position
    this.updateAttackHitbox()

    // Emit sprint dust
    if (isSprinting && (vx !== 0 || vy !== 0) && Math.random() < 0.3) {
      this.spawnDust()
    }
  }

  doAttack() {
    this.isAttacking = true
    this.lastAttackTime = this.scene.time.now
    this.attackHitbox.active = true

    const animSuffix = this.facing === 'down' ? 'right' : this.facing
    this.play(`player_attack_${animSuffix}`)

    this.once('animationcomplete', () => {
      this.isAttacking = false
      this.attackHitbox.active = false
      const animSuffix2 = this.facing === 'down' ? 'right' : this.facing
      this.play(`player_idle_${animSuffix2}`)
    })
  }

  updateAttackHitbox() {
    const offset = 32
    switch (this.facing) {
      case 'right': this.attackHitbox.setPosition(this.x + offset, this.y); break
      case 'left':  this.attackHitbox.setPosition(this.x - offset, this.y); break
      case 'up':    this.attackHitbox.setPosition(this.x, this.y - offset); break
      case 'down':  this.attackHitbox.setPosition(this.x, this.y + offset); break
    }
  }

  takeDamage(amount) {
    if (this.isInvincible || this.isDead) return

    this.hp = Math.max(0, this.hp - amount)
    this.isInvincible = true

    // Flash red
    this.setTint(0xff4444)
    this.scene.time.delayedCall(100, () => this.clearTint())

    // Camera flash on hit
    this.scene.cameras.main.flash(150, 255, 50, 50, false)

    // Knockback
    const angle = Phaser.Math.Angle.Between(0, 0, this.body.velocity.x, this.body.velocity.y)
    this.scene.physics.velocityFromAngle(angle + 180, 120, this.body.velocity)

    this.scene.time.delayedCall(this.invincibleTime, () => {
      this.isInvincible = false
    })

    if (this.hp <= 0) this.die()

    // Notify UI
    this.scene.events.emit('playerHpChanged', this.hp, this.maxHp)
  }

  die() {
    this.isDead = true
    this.body.setVelocity(0, 0)
    this.play('player_death')
    this.attackHitbox.active = false
    this.scene.cameras.main.flash(400, 180, 0, 0, false)
    this.scene.time.delayedCall(1500, () => {
      this.scene.events.emit('playerDied')
    })
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount)
    this.scene.events.emit('playerHpChanged', this.hp, this.maxHp)
  }

  spawnDust() {
    if (!this.scene) return
    const dust = this.scene.add.sprite(
      this.x + Phaser.Math.Between(-8, 8),
      this.y + 16 + Phaser.Math.Between(-4, 4),
      'dust'
    )
    dust.setDepth(9)
    dust.setAlpha(0.7)
    dust.play('dust')
    dust.once('animationcomplete', () => dust.destroy())
  }
}
