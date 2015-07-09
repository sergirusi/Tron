var port = process.env.PORT || 9000
var io = require('socket.io')(port)

var Player = require('../shared/Player.js')

var MAP_WIDTH = 800
var MAP_HEIGHT = 600

var players = {}
var pickups = {}

io.on('connection', function (socket) {
  socket.broadcast.emit('hi')
  console.log('connection', socket.id)
  var player = new Player()
  player.id = socket.id
  players[socket.id] = player

  for (var playerId in players) {
    var player = players[playerId]
    socket.emit('logged_player', player)

  }
  //socket.emit('init_players', players)

  socket.emit('init_pickups', pickups)

  socket.on('login', function (info) {
    console.log(info)
    var player = players[socket.id]
    player.username = info.username
    player.color = info.color
    player.pos = info.pos
    player.direction = info.direction
    socket.broadcast.emit('logged_player', player)
  })

  socket.on('update_direction', function (Dir) {
    var player = players[socket.id]
    player.updateDirection(Dir.newDir)
    //console.log('direction', dir)
    Dir.id = socket.id
    socket.broadcast.emit('update_direction', Dir)
    checkPickupCollision(socket.id)
  })

  socket.on('update_position', function (pos) {
    var player = players[socket.id]
    player.updatePosition(pos)
    //console.log('pos', pos)
    pos.id = socket.id
    socket.broadcast.emit('update_position', pos)
    checkPickupCollision(socket.id)
  })

  socket.on('disconnect', function () {
    console.log('disconnection', socket.id)
    delete players[socket.id]
    socket.broadcast.emit('player_disconnected', socket.id)
  })
})

var pickupCount = Math.floor(Math.random() * 30 + 10)
for (var i = 0; i < pickupCount; ++i) {
  var pickup = {
    id: i,
    x: Math.floor(Math.random() * MAP_WIDTH),
    y: Math.floor(Math.random() * MAP_HEIGHT)
  }
  pickups[pickup.id] = pickup
}

function checkPickupCollision (playerId) {
  var player = players[playerId]
  for (var pickupId in pickups) {
    var pickup = pickups[pickupId]
    if (distPtoP(player.pos, pickup) < 50) {
      io.sockets.emit('collected_pickup', pickup.id)
      console.log('collision with pickup', pickup)
      delete pickups[pickupId]
    }
  }
}

function distPtoP (pos1, pos2) {
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2))
}

console.log('server started on port', port)
