function Player () {
  this.username = 'Unnamed'
  this.color = Math.floor(Math.random() * 0xFFFFFF)
  this.pos = {
    x: 0,
    y: 0
  }
  this.direction = 0 // 0: up, 1: right, 2: down, 3: left
  this.stream = {}
  this.fullstream = []
}

Player.prototype.updatePosition = function (pos) {
  this.pos.x = pos.x
  this.pos.y = pos.y
}

Player.prototype.updateDirection = function (dir) {
	this.direction = dir
}

module.exports = Player
