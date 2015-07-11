var port = process.env.PORT || 9000
var io = require('socket.io')(port)

var Player = require('../shared/Player.js')
var Map = require('../shared/Map.js')

var map = new Map()

var time_pickup = 350
var id_pickup = 0

var id_player = 1
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
    player.ID = id_player
    ++id_player
    player.username = info.username
    player.color = info.color
    player.pos = info.pos
    player.speed = info.speed
    player.direction = info.direction
    player.boost_time = info.boost_time
    player.stat = info.stat
    player.fullstream = info.fullstream
    socket.broadcast.emit('logged_player', player)
    socket.emit('update_ID', player.ID)
  })

  socket.on('update_direction', function (Dir) {
    var player = players[socket.id]
    player.updateDirection(Dir.newDir)
    //console.log('direction', dir)
    Dir.id = socket.id
    socket.broadcast.emit('update_direction', Dir)
    checkPickupCollision(socket.id)
    //checkStreamCollision(socket.id)
    //checkMotoCollision(socket.id)
  })

  socket.on('update_stream', function (DirPos) {
    DirPos.pos.id = socket.id
    socket.broadcast.emit('update_stream', DirPos)
  })

  socket.on('update_position', function (pos) {
    var player = players[socket.id]
    player.updatePosition(pos)
    pos.id = socket.id
    socket.broadcast.emit('update_position', pos)
    checkPickupCollision(socket.id)
    //checkStreamCollision(socket.id)
    //checkMotoCollision(socket.id)
  })

  socket.on('initial_state', function (stats) {
    var player = players[socket.id]
    player.pos.id = socket.id
    var params = {ID: player.ID, stats: stats, statID: player.pos.id}
    socket.broadcast.emit('initial_state', params)
  })

  socket.on('disconnect', function () {
    console.log('disconnection', socket.id)
    delete players[socket.id]
    socket.broadcast.emit('player_disconnected', socket.id)
  })
})

var pickupCount = Math.ceil(Math.random() * 10)
for (var i = 0; i < pickupCount; ++i) {
  var pickup = {
    id: i,
    kind: Math.ceil(Math.random()*3),
    x: 0,
    y: 0
  }
  map.random_position(pickup)
  pickups[pickup.id] = pickup
}

function checkPickupCollision (playerId) {
  var player = players[playerId]
  for (var pickupId in pickups) {
    var pickup = pickups[pickupId]
    if (distPtoP(player.pos, pickup) < 30) {
      var pickupId = pickup.id
      io.sockets.emit('collected_pickup', pickupId)
      console.log('collision with pickup', pickup)
      var p = {id: player.ID, playerId: playerId, pickup: pickup} 
      io.sockets.emit('update_player', p)
      delete pickups[pickupId]
    }
  }
}

function checkMotoCollision (playerId) {
  var player = players[playerId]
  for (var enemyId in players) {
    var enemy = players[enemyId]
    if (enemyId != playerId && distPtoP(player.pos, enemy.pos) < 30) {
      var IDs = {playerId: playerId, enemyId: enemyId}
      io.sockets.emit('players_collision', IDs)
      console.log('collision with players', pickup)
      delete players[playerId]
      delete players[enemyId]
    }
  }
}

function checkStreamCollision (playerId) {
 var player = players[playerId]
  for (var otherPlayerId in players) {
    var otherPlayer = players[otherPlayerId]
    for(var i = 0; i < otherPlayer.fullstream.length; i++) {
      if (distPtoP(player.pos, otherPlayer.fullstream[i].position) < 30) {
        io.sockets.emit('stream_collision', playerId)
        console.log('collision with stream', pickup)
        delete players[playerId]
      }
    }
  } 
}

function distPtoP (pos1, pos2) {
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2))
}

console.log('server started on port', port)
