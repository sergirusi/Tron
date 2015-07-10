function Player () {
  this.username = 'Unnamed'
  this.color = Math.floor(Math.random() * 0xFFFFFF)
  this.pos = {
    x: 0,
    y: 0
  }
  this.speed = 5
  this.direction = 0 // 0: up, 1: right, 2: down, 3: left
  this.boost_time = 0
  this.stat = {speedup:0, invisible:0, invincible:0}
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

Player.prototype.boosted = function () {
  if(this.stat.speedup == 1 || this.stat.invisible == 1 || this.stat.invincible == 1) return true
  else return false
}

module.exports = Player
