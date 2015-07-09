function Map () {
  this.MAXWIDTH = 800
  this.MAXHEIGHT = 600
  this.CEL_SIZE = 25
}

// NUMBER OF COLUMNS = 32 -> 800/25
// NUMBER OF ROWS = 24 -> 600/25

Map.prototype.random_position = function (pos) {
  pos.x = Math.floor(Math.random() * this.MAXWIDTH)
  pos.y = Math.floor(Math.random() * this.MAXHEIGHT)
  
  pos.x = ((Math.floor(pos.x/this.CEL_SIZE))*this.CEL_SIZE) + (this.CEL_SIZE/2) // We look for the cell that the player will initially be, 
  pos.y = ((Math.floor(pos.y/this.CEL_SIZE))*this.CEL_SIZE) + (this.CEL_SIZE/2) // adding (CEL_SIZE/2) to the position's coordinates, to take the center of the cell. 
}

module.exports = Map
