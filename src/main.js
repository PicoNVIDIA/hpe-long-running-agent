import Phaser from 'phaser'
import BootScene from './scenes/BootScene.js'
import MenuScene from './scenes/MenuScene.js'
import GameScene from './scenes/GameScene.js'
import UIScene from './scenes/UIScene.js'

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  pixelArt: true,
  antialias: false,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, GameScene, UIScene]
}

new Phaser.Game(config)
