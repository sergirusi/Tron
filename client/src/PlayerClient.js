var Player = require('../../shared/Player.js')
var KeyboardJS = require('./Keyboard.js')

var Map = require(('../../shared/Map.js'))
var map = new Map()

var keyboard = new KeyboardJS(false)

var playerTexture = PIXI.Texture.fromImage('player.png')
var streamTexture = PIXI.Texture.fromImage('stream.png')


PlayerClient.prototype = new Player()
PlayerClient.prototype.constructor = PlayerClient

function PlayerClient () {
    Player.call(this)
    this.generateSprite()
}

PlayerClient.prototype.generateSprite = function () {
  this.sprite = new PIXI.Sprite(playerTexture)
  this.sprite.tint = this.color
  this.sprite.scale.x = this.sprite.scale.y = 0.4
  this.ID = 0
  this.pos = this.sprite.position
  /*if(this.direction == 1) this.sprite.rotation += Math.PI/2
  else if(this.direction == 2) this.sprite.rotation -= Math.PI      
  else if(this.direction == 3) this.sprite.rotation -= Math.PI/2*/
  map.random_position(this.pos)
  this.updatePosition({
    x: this.pos.x,
    y: this.pos.y
  })
  this.sprite.anchor.set(0.5, 0.5)
  this.sprite.scale.set(0.2, 0.2)

  this.usernameSprite = new PIXI.Text(this.username)
  this.usernameSprite.style = {font: "30px Snippet", fill: "white"}
  this.usernameSprite.anchor.set(0.5, 0)
  this.usernameSprite.scale.set(2, 2)
  this.usernameSprite.position.y = 120
  this.sprite.addChild(this.usernameSprite)
}

PlayerClient.prototype.movement = function () {
  if(this.direction == 0) this.pos.y -= this.speed
  else if(this.direction == 1) this.pos.x += this.speed
  else if(this.direction == 2) this.pos.y += this.speed
  else if(this.direction == 3) this.pos.x -= this.speed
}

PlayerClient.prototype.setUsername = function (username) {
  this.username = username
  this.usernameSprite.text = username
}

PlayerClient.prototype.setColor = function (color) {
  this.color = color
  this.sprite.tint = color
}

PlayerClient.prototype.moveUsingInput = function () {
  oldDir = this.direction
  if (keyboard.char('W')) {
    if(oldDir == 1) this.sprite.rotation -= Math.PI/2
    else if(oldDir == 3) this.sprite.rotation += Math.PI/2
    if (oldDir != 2) this.direction = 0
  }
  else if (keyboard.char('A')) {
    if(oldDir == 0) this.sprite.rotation -= Math.PI/2
    else if(oldDir == 2) this.sprite.rotation += Math.PI/2
    if (oldDir != 1) this.direction = 3
  }
  else if (keyboard.char('D')) {
    if(oldDir == 0) this.sprite.rotation += Math.PI/2
    else if(oldDir == 2) this.sprite.rotation -= Math.PI/2
    if (oldDir != 3) this.direction = 1
  }
  else if (keyboard.char('S')) {
    if(oldDir == 1) this.sprite.rotation += Math.PI/2
    else if(oldDir == 3) this.sprite.rotation -= Math.PI/2
    if (oldDir != 0) this.direction = 2
  }
  return (oldDir != this.direction)
}

PlayerClient.prototype.rotate = function (Dir) {
  if (Dir.newDir == 0) {
    if(Dir.oldDir == 1) this.sprite.rotation -= Math.PI/2
    else if(Dir.oldDir == 3) this.sprite.rotation += Math.PI/2
    if (Dir.oldDir != 2) this.direction = 0
  }
  else if (Dir.newDir == 3) {
    if(Dir.oldDir == 0) this.sprite.rotation -= Math.PI/2
    else if(Dir.oldDir == 2) this.sprite.rotation += Math.PI/2
    if (Dir.oldDir != 1) this.direction = 3
  }
  else if (Dir.newDir == 1) {
    if(Dir.oldDir == 0) this.sprite.rotation += Math.PI/2
    else if(Dir.oldDir == 2) this.sprite.rotation -= Math.PI/2
    if (Dir.oldDir != 3) this.direction = 1
  }
  else if (Dir.newDir == 2) {
    if(Dir.oldDir == 1) this.sprite.rotation += Math.PI/2
    else if(Dir.oldDir == 3) this.sprite.rotation -= Math.PI/2
    if (Dir.oldDir != 0) this.direction = 2
  }
}

PlayerClient.prototype.generateStream = function (dp) {
  this.stream = new PIXI.Sprite(streamTexture)
  this.stream.anchor.set(0.5, 0.5)
  //if(dp.dire == 0) dp.pos.y = dp.pos.y + this.sprite.height/2
  //if(dp.dire == 1) dp.pos.x = dp.pos.x - this.sprite.height/2
  //if(dp.dire == 2) dp.pos.y = dp.pos.y - this.sprite.height/2
  //if(dp.dire == 3) dp.pos.x = dp.pos.x + this.sprite.height/2
  this.stream.position = dp.pos
  this.stream.tint = this.color
  this.fullstream.push(this.stream)
}


PlayerClient.prototype.generatePacket = function () {
  var packet = {
    ID: this.ID,
    username: this.username,
    color: this.color,
    pos: {
      x: this.pos.x,
      y: this.pos.y
    },
    speed: this.speed,
    direction: this.direction,
    boost_time: this.boost_time,
    stat: {
      speedup:this.stat.speedup, 
      invisible:this.stat.invisible, 
      invincible:this.stat.invincible
    }
  }
  return packet
}

module.exports = PlayerClient
