var PlayerClient = require('./PlayerClient.js')

var serverURL = 'localhost:9000'
var socket = require('socket.io-client')(serverURL)

// You can use either `new PIXI.WebGLRenderer`, `new PIXI.CanvasRenderer`, or `PIXI.autoDetectRenderer`
// which will try to choose the best renderer for the environment you are in.
var renderer = new PIXI.autoDetectRenderer(800, 600);
renderer.backgroundColor = 0xf0f0f0

// The renderer will create a canvas element for you that you can then insert into the DOM.
document.body.appendChild(renderer.view);

// You need to create a root container that will hold the scene you want to draw.
var stage = new PIXI.Container();

var player = new PlayerClient()
var username = prompt("What's your username?")
player.setUsername(username)

// Add the player's sprite to the scene we are building.
global.player = player

var Dir = {oldDir:0, newDir:0}

var otherPlayers = {}
global.otherPlayers = otherPlayers
var pickup1 = PIXI.Texture.fromImage('pickup1.png')
var pickup2 = PIXI.Texture.fromImage('pickup2.png')
var pickup3 = PIXI.Texture.fromImage('pickup3.png')
var pickups = {}
var id_pickups = {}

var barrierTexture = PIXI.Texture.fromImage('barrier.png') 
var barriers = {}

// kick off the animation loop (defined below)
animate();

function animate() {
    // start the timer for the next animation loop
    requestAnimationFrame(animate);
    stage.addChild(player.sprite);
    console.log('boost_time = ' + p.boost_time)
    if(player.boost_time > 0) --player.boost_time
    if(player.boosted() && player.boost_time == 0) socket.emit('initial_state', player.stat)
    // move player using keyboard keys
    var DirChanged = player.moveUsingInput()
    if(DirChanged) {
      Dir.newDir = player.direction
      socket.emit('update_direction', Dir)
    }
    player.movement()
    var DirPos = {dire: player.direction, pos: player.pos.clone()}
    player.generateStream(DirPos)
    stage.addChild(player.stream)
    stage.addChild(player.sprite)
    socket.emit('update_stream', DirPos)
    socket.emit('update_position', player.pos)

    // this is the main render call that makes pixi draw your container and its children.
    renderer.render(stage);
}

socket.on('update_ID', function (id) {
  player.ID = id
})

socket.on('logged_player', function (playerInfo) {
  var otherPlayer = new PlayerClient()
  otherPlayer.ID = playerInfo.ID
  otherPlayer.setUsername(playerInfo.username)
  otherPlayer.setColor(playerInfo.color)
  otherPlayer.updatePosition(playerInfo.pos)
  otherPlayer.updateDirection(playerInfo.direction)
  otherPlayer.speed = playerInfo.speed
  otherPlayer.boost_time = playerInfo.boost_time
  otherPlayer.stat = playerInfo.stat
  otherPlayer.stream = playerInfo.stream
  otherPlayer.fullstream = playerInfo.fullstream
  if(otherPlayer.ID != 0)stage.addChild(otherPlayer.sprite)
  otherPlayers[playerInfo.id] = otherPlayer
})

socket.on('update_direction', function (pDir) {
  var otherPlayer = otherPlayers[pDir.id]
  otherPlayer.updateDirection(pDir.newDir)
  otherPlayer.rotate(pDir)
})

socket.on('update_stream', function (dp) {
  var otherPlayer = otherPlayers[dp.pos.id]
  otherPlayer.generateStream(dp)
  stage.addChild(otherPlayer.stream)
})

socket.on('update_position', function (pos) {
  // pos
  // {x, y, id}
  var otherPlayer = otherPlayers[pos.id]
  otherPlayer.updatePosition(pos)
  stage.addChild(otherPlayer.sprite)
})

socket.on('initial_state', function (params) {
  if(params.ID == player.ID) var otherPlayer = player
  else var otherPlayer = otherPlayers[params.statID]
  
  if(params.stats.speedup == 1) {
    otherPlayer.stat.speedup = 0
    otherPlayer.speed = 2
  }
  if(params.stats.invisible == 1) {
    otherPlayer.stat.invisible = 0
    otherPlayer.sprite.tint = otherPlayer.color
  }
  if(params.stats.invisible == 1) {
    otherPlayer.stat.invincible = 0
    otherPlayer.sprite.removeChild(barrierSprite)
  }
})

socket.on('init_pickups', function (newPickups) {
  for (var pickupId in newPickups) {
    var pickup = newPickups[pickupId]
    if(pickup.kind == 1)var pickupSprite = new PIXI.Sprite(pickup1)
    else if(pickup.kind == 2) var pickupSprite = new PIXI.Sprite(pickup2)
    else if (pickup.kind == 3) var pickupSprite = new PIXI.Sprite(pickup3)
    pickupSprite.position.x = pickup.x
    pickupSprite.position.y = pickup.y
    pickupSprite.anchor.set(0.5, 0.5)
    pickupSprite.scale.set(0.1, 0.1)
    stage.addChild(pickupSprite)
    pickups[pickupId] = pickupSprite
    id_pickups[pickupId] = pickup.kind
  }
})

socket.on('collected_pickup', function (pickupId) {
  var pickupSprite = pickups[pickupId]
  if (pickupSprite) {
    stage.removeChild(pickupSprite)
    delete pickups[pickupId]
    delete id_pickups[pickupId]
  }
})

socket.on('update_player', function (p) {
  if(p.id == player.ID) var otherPlayer = player
  else var otherPlayer = otherPlayers[p.id]

  if(p.pickup.kind == 1) {
    otherPlayer.speed = 8
    otherPlayer.boost_time = 50
    otherPlayer.stat.speedup = 1
  }
  else if(p.pickup.kind == 2) {
    otherPlayer.sprite.tint = null
    otherPlayer.boost_time = 50
    otherPlayer.stat.invisible = 1
  }
  else if(p.pickup.kind == 3) {
    if(otherPlayer.stat.invincible == 0) {
      var barrierSprite = new PIXI.Sprite(barrierTexture)
      barrierSprite.anchor.set(0.5, 0.5)
      barrierSprite.position.x = 0
      barrierSprite.position.y = 0
      barrierSprite.scale.set = (1.5, 1.5)
      otherPlayer.sprite.addChild(barrierSprite)
      barriers[p.id] = barrierSprite
    }
    otherPlayer.boost_time = 50
    otherPlayer.stat.invincible = 1
  }
  otherPlayers[p.id] = otherPlayer
})

socket.on('stream_collision', function (id) {
  var player_over = otherPlayers[id]
  stage.removeChild(player_over)
  delete otherPlayers[id]
})

socket.on('players_collision', function (Id) {
    var player_over1 = otherPlayers[Id.playerId]
    var player_over2 = otherPlayers[Id.enemyId]
    console.log(player_over1)
    console.log(player_over2)
    stage.removeChild(player_over1)
    stage.removeChild(player_over2)
    delete otherPlayers[Id.playerId]
    delete otherPlayers[Id.enemyId]
})

socket.on('player_disconnected', function (id) {
  var otherPlayer = otherPlayers[id]
  if (otherPlayer) {
    stage.removeChild(otherPlayer.sprite)
    delete otherPlayers[id] //otherPlayers[id] = undefined
  }
})

socket.on('connect', function () {
  console.log('connected')
  socket.emit('login', player.generatePacket())
})

// npm install
//
// npm run <script-name>
// npm run build
//
// node index.js
// http-server . <-p port>

/* CONSULTAR PLAYER

console.log('ID = ' + p.ID)
console.log('username = ' + p.username)
console.log('pos = ' + p.pos.x + ', ' + p.pos.y)
console.log('speed = ' + p.speed)
console.log('color = ' + p.color)
console.log('direction = ' + p.direction)
console.log('boost_time = ' + p.boost_time)
*/
