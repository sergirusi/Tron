var PlayerClient = require('./PlayerClient.js')

var serverURL = 'localhost:9000'
var socket = require('socket.io-client')(serverURL)

// You can use either `new PIXI.WebGLRenderer`, `new PIXI.CanvasRenderer`, or `PIXI.autoDetectRenderer`
// which will try to choose the best renderer for the environment you are in.
var renderer = new PIXI.autoDetectRenderer(800, 600);

// The renderer will create a canvas element for you that you can then insert into the DOM.
document.body.appendChild(renderer.view);

// You need to create a root container that will hold the scene you want to draw.
var stage = new PIXI.Container();

var player = new PlayerClient()
var username = prompt("What's your username?")
player.setUsername(username)

// Add the player's sprite to the scene we are building.
stage.addChild(player.sprite);
global.player = player

var Dir = {oldDir:0, newDir:0}

var otherPlayers = {}
global.otherPlayers = otherPlayers
var pickupTexture = PIXI.Texture.fromImage('pickup1.png')
var pickups = {}

// kick off the animation loop (defined below)
animate();

function animate() {
    // start the timer for the next animation loop
    requestAnimationFrame(animate);

    // move player using keyboard keys
    Dir.oldDir = player.direction
    var DirChanged = player.moveUsingInput()
    if(DirChanged) {
      Dir.newDir = player.direction
      socket.emit('update_direction', Dir)
    }
    var oldPos = player.pos.clone()
    player.movement()
    player.generateStream(oldPos)
    stage.addChild(player.stream)
    socket.emit('update_position', player.pos)
    

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
  // pos
  // {x, y, id}
  var otherPlayer = otherPlayers[pDir.id]
  otherPlayer.updateDirection(pDir.newDir)
  otherPlayer.rotate(pDir)
})

socket.on('update_position', function (pos) {
  // pos
  // {x, y, id}
  var otherPlayer = otherPlayers[pos.id]
  otherPlayer.updatePosition(pos)
})

socket.on('init_pickups', function (newPickups) {
  for (var pickupId in newPickups) {
    var pickup = newPickups[pickupId]
    var pickupSprite = new PIXI.Sprite(pickupTexture)
    pickupSprite.position.x = pickup.x
    pickupSprite.position.y = pickup.y
    pickupSprite.anchor.set(0.5, 0.5)
    pickupSprite.scale.set(0.05, 0.05)
    stage.addChild(pickupSprite)
    pickups[pickupId] = pickupSprite
  }
})

socket.on('collected_pickup', function (pickupId) {
  var pickupSprite = pickups[pickupId]
  if (pickupSprite) {
    stage.removeChild(pickupSprite)
    delete pickups[pickupId]
  }
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
