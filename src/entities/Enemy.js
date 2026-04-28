import * as Phaser from 'phaser'

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = 'skeleton') {
    super(scene, x, y, type)
    this.enemyType = type

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setScale(type === 'slime' ? 2 : 2)
    this.setDepth(9)

    if (type === 'skeleton') {
      this.body.setSize(24, 30)
      this.body.setOffset(12, 16)
      this.maxHp = 60
      this.hp = 60
      this.speed = 55
      this.attackDamage = 15
      this.attackRange = 45
      this.detectionRange = 200
      this.attackCooldown = 1200
    } else { // slime
      this.body.setSize(20, 16)
      this.body.setOffset(6, 14)
      this.maxHp = 30
      this.hp = 30
      this.speed = 40
      this.attackDamage = 8
      this.attackRange = 36
      this.detectionRange = 160
      this.attackCooldown = 900
    }

    this.isDead = false
    this.isAttacking = false
    this.lastAttackTime = 0
    this.state = 'idle' // idle, chase, attack
    this.startX = x
    this.startY = y
    this.patrolTimer = 0
    this.patrolDir = { x: 0, y: 0 }

    this.play(`${type}_idle`)
  }

  update(player, time) {
    if (this.isDead) return

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)

    if (dist < this.detectionRange && !player.isDead) {
      if (dist < this.attackRange) {
        this.state = 'attack'
        this.body.setVelocity(0, 0)
        this.attackPlayer(player, time)
      } else {
        this.state = 'chase'
        this.chasePlayer(player)
      }
    } else {
      this.state = 'idle'
      this.patrol(time)
    }
  }

  chasePlayer(player) {
    if (this.isAttacking) return
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
    const vx = Math.cos(angle) * this.speed
    const vy = Math.sin(angle) * this.speed
    this.body.setVelocity(vx, vy)

    // Flip based on direction
    this.setFlipX(vx < 0)

    const moving = `${this.enemyType}_walk`
    if (this.anims.currentAnim?.key !== moving) this.play(moving)
  }

  patrol(time) {
    if (this.isAttacking) return
    this.patrolTimer -= 16
    if (this.patrolTimer <= 0) {
      this.patrolTimer = Phaser.Math.Between(1500, 3000)
      if (Math.random() < 0.4) {
        const angle = Math.random() * Math.PI * 2
        this.patrolDir = {
          x: Math.cos(angle) * (this.speed * 0.5),
          y: Math.sin(angle) * (this.speed * 0.5)
        }
      } else {
        this.patrolDir = { x: 0, y: 0 }
      }
    }

    // Don't wander too far from start
    const distFromStart = Phaser.Math.Distance.Between(this.x, this.y, this.startX, this.startY)
    if (distFromStart > 120) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.startX, this.startY)
      this.patrolDir = {
        x: Math.cos(angle) * (this.speed * 0.5),
        y: Math.sin(angle) * (this.speed * 0.5)
      }
    }

    this.body.setVelocity(this.patrolDir.x, this.patrolDir.y)
    if (this.patrolDir.x !== 0) this.setFlipX(this.patrolDir.x < 0)

    const moving = this.patrolDir.x !== 0 || this.patrolDir.y !== 0
    const idleAnim = `${this.enemyType}_idle`
    const walkAnim = `${this.enemyType}_walk`
    const target = moving ? walkAnim : idleAnim
    if (this.anims.currentAnim?.key !== target) this.play(target)
  }

  attackPlayer(player, time) {
    if (this.isAttacking) return
    if (time - this.lastAttackTime < this.attackCooldown) return

    this.lastAttackTime = time
    this.isAttacking = true
    this.body.setVelocity(0, 0)

    const attackAnim = `${this.enemyType}_attack`
    this.play(attackAnim)

    // Deal damage at midpoint of animation
    this.scene.time.delayedCall(this.attackCooldown * 0.4, () => {
      if (!this.isDead && !player.isDead) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
        if (dist < this.attackRange + 10) {
          player.takeDamage(this.attackDamage)
        }
      }
    })

    this.once('animationcomplete', () => {
      this.isAttacking = false
      if (!this.isDead) this.play(`${this.enemyType}_idle`)
    })
  }

  takeDamage(amount) {
    if (this.isDead) return

    this.hp -= amount
    this.setTint(0xff8888)
    this.scene.time.delayedCall(120, () => {
      if (!this.isDead) this.clearTint()
    })

    // Knockback
    if (this.scene.player) {
      const angle = Phaser.Math.Angle.Between(this.scene.player.x, this.scene.player.y, this.x, this.y)
      this.body.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100)
      this.scene.time.delayedCall(150, () => {
        if (this.body) this.body.setVelocity(0, 0)
      })
    }

    if (this.hp <= 0) {
      this.die()
    } else {
      const dmgAnim = `${this.enemyType}_damaged`
      if (this.anims.exists(dmgAnim)) {
        this.play(dmgAnim)
        this.once('animationcomplete', () => {
          if (!this.isDead) this.play(`${this.enemyType}_idle`)
        })
      }
    }
  }

  die() {
    this.isDead = true
    this.body.setVelocity(0, 0)
    this.body.enable = false
    this.play(`${this.enemyType}_death`)

    this.scene.events.emit('enemyKilled', this.x, this.y, this.enemyType)

    this.once('animationcomplete', () => {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 500,
        onComplete: () => this.destroy()
      })
    })
  }
}
