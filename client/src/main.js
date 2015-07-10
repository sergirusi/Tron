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
var barrier = new PIXI.Sprite(barrierTexture)
barrier.anchor.set(0.5, 0.5)
barrier.position = player.sprite.position
// kick off the animation loop (defined below)
animate();

function animate() {
    // start the timer for the next animation loop
    requestAnimationFrame(animate);
    stage.addChild(player.sprite);
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
    if(player.stat.invincible == 1) player.sprite.addChild(barrier)
    if(player.boost_time > 0) --player.boost_time
    if(player.boosted() && player.boost_time == 0) player.initial_stats() 

    // this is the main render call that makes pixi draw your container and its children.
    renderer.render(stage);
}

socket.on('logged_player', function (playerInfo) {
  var otherPlayer = new PlayerClient()
  otherPlayer.setUsername(playerInfo.username)
  otherPlayer.setColor(playerInfo.color)
  otherPlayer.updatePosition(playerInfo.pos)
  otherPlayer.updateDirection(playerInfo.direction)
  stage.addChild(otherPlayer.sprite)
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

socket.on('init_pickups', function (newPickups) {
  for (var pickupId in newPickups) {
    var pickup = newPickups[pickupId]
    var rand = Math.ceil(Math.random()*3)
    if(rand == 1)var pickupSprite = new PIXI.Sprite(pickup1)
    else if(rand == 2) var pickupSprite = new PIXI.Sprite(pickup2)
    else if (rand == 3) var pickupSprite = new PIXI.Sprite(pickup3)
    pickupSprite.position.x = pickup.x
    pickupSprite.position.y = pickup.y
    pickupSprite.anchor.set(0.5, 0.5)
    pickupSprite.scale.set(0.1, 0.1)
    stage.addChild(pickupSprite)
    pickups[pickupId] = pickupSprite
    id_pickups[pickupId] = rand
  }
})

socket.on('collected_pickup', function (Id) {
  var pickupSprite = pickups[Id.pickupId]
  if (pickupSprite) {
    var otherPlayer = otherPlayers[Id.playerId]
    var booster = id_pickups[Id.pickupId]
    otherPlayer.boost(booster)
    stage.removeChild(pickupSprite)
    delete pickups[Id.pickupId]
    delete id_pickups[Id.pickupId]
  }
})

socket.on('players_collision', function (Id) {
    var player_over1 = otherPlayers[Id.playerId]
    //var player_over2 = otherPlayers[Id.enemyId]
    console.log(player_over1)
    console.log(player_over2)
    //stage.removeChild(player_over1)
    //stage.removeChild(player_over2)
    delete otherPlayers[Id.playerId]
    //delete otherPlayers[Id.enemyId]
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
