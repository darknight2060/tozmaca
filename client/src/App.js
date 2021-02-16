import React, { Component } from 'react';
import io from 'socket.io-client';
import './App.css';

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 640;
const TILE_WIDTH = 64;
const TILE_HEIGHT = 64;

class Coin {
  constructor(ctx, game) {
    this.ctx = ctx;
    this.game = game;
    // server overrides
    this.x = -100;
    this.y = -100;
  };

  draw = () => {
    const currentPlayer = this.game.players.find(player => player.id === this.game.socket.id);
    this.ctx.drawImage(
      // TODO user0 > use type to show different skins
      this.game.images.coin, 0, 0, TILE_WIDTH, TILE_HEIGHT,
      (CANVAS_WIDTH / 2 - 32) + (this.x - currentPlayer.x),
      (CANVAS_HEIGHT / 2 - 32) + (this.y - currentPlayer.y),
      TILE_WIDTH, TILE_HEIGHT);
  };
};

class Player {
  constructor(ctx, game) {
    this.ctx = ctx;
    this.game = game;
    // server override ediyor
    this.health = 100;
    this.isDead = false;
    this.moderator = false;
    this.coins = 0;
    this.medkits = 0;
    this.id = 0;
    this.x = -100;
    this.y = -100;
    this.type = 0;
    this.hborder = '';
    this.hbar = 0;
    this.nbar = 0;
    this.mycolor = '';
    this.ucolor = '';
    this.score = 0;
    this.oyuncu = game.players.length;
  };

  drawSelf = () => {
    const x = CANVAS_WIDTH / 2 - 32;
    const y = CANVAS_HEIGHT / 2 - 32;

    if (this.isDead) {
      this.ctx.font = '40px arial';
      this.ctx.fillStyle = 'white';
      this.ctx.textAlign = "center";
      this.ctx.fillText(`ÖLDÜN`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 400);
    }

    if (!this.isDead) {
      this.ctx.drawImage(
        // TODO user0 > use type to show different skins
        this.game.images.users[this.type], 0, 0, TILE_WIDTH, TILE_HEIGHT,
        x, y,
        TILE_WIDTH, TILE_HEIGHT);

      // RENDER HEALTH BAR
      this.ctx.font = '18px Spicy Rice, cursive;';
      this.ctx.fillStyle = 'white';
      this.ctx.textAlign = "center";
      this.ctx.fillText(`${this.name} | ${this.score}`, x + TILE_WIDTH / 2, y + this.nbar);

      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(x + 16, y + (this.hbar), 32, 12)
      this.ctx.fillStyle = this.mycolor;
      this.ctx.fillRect(x + 16 + 2, y + this.hbar + 2, 28 * this.health / 100, 8)

      this.ctx.font = '14px arial';
      this.ctx.fillStyle = 'white';
      this.ctx.textAlign = "left";
      this.ctx.fillText(`BAKIYE: ${this.coins} TL`, 20, CANVAS_HEIGHT - 20);
      this.ctx.fillText(`MEDKITLER: ${this.medkits} ADET`, 20, CANVAS_HEIGHT - 40);
    }
    this.ctx.font = '14px arial';
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = "left";
    this.ctx.fillText(`OYUNCU SAYISI: ${this.oyuncu}`, 20, CANVAS_HEIGHT - CANVAS_HEIGHT + 20);
  };

  draw = () => {
    const currentPlayer = this.game.players.find(player => player.id === this.game.socket.id);
    if (currentPlayer.id === this.id) {
      return this.drawSelf();
    }

    if (!this.isDead) {
      const x = (CANVAS_WIDTH / 2 - 32) + (this.x - currentPlayer.x)
      const y = (CANVAS_HEIGHT / 2 - 32) + (this.y - currentPlayer.y)
      this.ctx.drawImage(
        // TODO user0 > use type to show different skins
        this.game.images.users[this.type], 0, 0, TILE_WIDTH, TILE_HEIGHT,
        x,
        y,
        TILE_WIDTH, TILE_HEIGHT);

      // RENDER HEALTH BAR
      this.ctx.font = '18px arial';
      this.ctx.fillStyle = 'red';
      this.ctx.textAlign = "center";
      this.ctx.fillText(this.name, x + TILE_WIDTH / 2, y + this.nbar);

      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(x + 16, y + this.hbar, 32, 12)
      this.ctx.fillStyle = this.ucolor;
      this.ctx.fillRect(x + 16 + 2, y + this.hbar + 2, 28 * this.health / 100, 8)
      //
    }
  };
};

class Game {
  constructor(ctx, socket) {
    console.log('init');
    this.socket = socket;
    this.ctx = ctx;
    this.seconds = 5;
    this.images = {
        tiles: {},
        images: {},
    };
    this.players = [];
    this.layers = [];

    socket.on('PLAYERS_UPDATE', (players) => {
      const newPlayers = [];
      for (var i = 0; i < players.length; i++) {
        const newPlayer = new Player(ctx, this);
        newPlayer.id = players[i].id;
        newPlayer.name = players[i].name;
        newPlayer.health = players[i].health;
        newPlayer.isDead = players[i].isDead;
        newPlayer.coins = players[i].coins;
        newPlayer.medkits = players[i].medkits;
        newPlayer.x = players[i].x;
        newPlayer.y = players[i].y;
        newPlayer.type = players[i].type;
        newPlayer.hborder = players[i].hborder;
        newPlayer.hbar = players[i].hbar;
        newPlayer.nbar = players[i].nbar;
        newPlayer.mycolor = players[i].mycolor;
        newPlayer.ucolor = players[i].ucolor;
        newPlayer.score = players[i].score;
        newPlayers.push(newPlayer);
        var NEW = newPlayer.name;
      }
      this.players = newPlayers;
    });

    //socket.on('GAME_STATE_UPDATE', (state) => {
    //  this.winnerId = state.winnerId;
    //});

    socket.on('COINS_UPDATE', (coins) => {
      const newCoins = [];
      for (var i = 0; i < coins.length; i++) {
        const newCoin = new Coin(ctx, this);
        newCoin.x = coins[i].x;
        newCoin.y = coins[i].y;
        newCoins.push(newCoin);
      }
      this.coins = newCoins;
    });

    socket.on('LAYERS_UPDATE', layers => {
      this.layers = layers;
    });
  }

  init = async () => {
    console.log('load');
    const tile0 = await this.loadImage('./assets/layers/0.png');
    const tile1 = await this.loadImage('./assets/layers/1.png');
    const tile2 = await this.loadImage('./assets/layers/2.png');
    const tile3 = await this.loadImage('./assets/layers/3.png');
    const tile4 = await this.loadImage('./assets/layers/4.png');
    const user0 = await this.loadImage('./assets/users/0.png');
    const user1 = await this.loadImage('./assets/users/1.png');
    const user2 = await this.loadImage('./assets/users/2.png');
    const user3 = await this.loadImage('./assets/users/3.png');
    const user4 = await this.loadImage('./assets/users/4.png');
    const user5 = await this.loadImage('./assets/users/5.png');
    const coin = await this.loadImage('./assets/coin.png');
    this.images = {
      coin,
      users: {
        0: user0,
        1: user1,
        2: user2,
        3: user3,
        4: user4,
        5: user5,
      },
      tiles: {
        0: tile0,
        1: tile1,
        2: tile2,
        3: tile3,
        4: tile4,
      },
    }

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  };

  onKeyDown = event => {
    const keyCode = event.keyCode;
    // LEFT
    if (keyCode === 65 || keyCode === 37) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { dirx: -1 });
    }
    // RIGHT
    else if (keyCode === 68 || keyCode === 39) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { dirx: 1 });
    }
    // UP
    if (keyCode === 87 || keyCode === 38) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { diry: -1 });
    }
    // DOWN
    else if (keyCode === 83 || keyCode === 40) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { diry: 1 });
    }
  }

  onKeyUp = event => {
    const keyCode = event.keyCode;
    // LEFT
    if (keyCode === 65 || keyCode === 37) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { dirx: 0 });
    }
    // RIGHT
    else if (keyCode === 68 || keyCode === 39) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { dirx: 0 });
    }
    // UP
    if (keyCode === 87 || keyCode === 38) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { diry: 0 });
    }
    // DOWN
    else if (keyCode === 83 || keyCode === 40) {
      this.socket.emit('PLAYER_DIRECTION_UPDATE', { diry: 0 });
    }

    // M
    if (keyCode === 77) {
      this.socket.emit('PURCHASE', { type: 'MEDKIT' });
    }

    // N
    if (keyCode === 78) {
      this.socket.emit('USE_MATERIAL', { type: 'MEDKIT' });
    }

    if (keyCode === 98) {
      this.socket.emit('PURCHASE', { type: 'BULLET' });
    }

    if (keyCode === 19) {
      this.socket.emit('MOD', { type: 'MOD' });
    }

    if (keyCode === 49) {
      this.socket.emit('MODITEM', { type: 'FULL' });
    }

    if (keyCode === 50) {
      this.socket.emit('MODITEM', { type: 'LOW_HEALTH' });
    }

    if (keyCode === 51) {
      this.socket.emit('MODITEM', { type: 'KILL' });
    }

    if (keyCode === 52) {
      this.socket.emit('MODITEM', { type: 'PINK' });
    }

    if (keyCode === 53) {
      this.socket.emit('MODITEM', { type: 'BLUE' });
    }

    if (keyCode === 54) {
      this.socket.emit('MODITEM', { type: 'RED' });
    }
  }

  loadImage = (src) => {
    var img = new Image();
    var d = new Promise(function (resolve, reject) {
        img.onload = function () {
            resolve(img);
        };

        img.onerror = function () {
            reject('Could not load image: ' + src);
        };
    });

    img.src = src;
    return d;
  }

  update = () => {
    // for (var m = 0; m < this.players.length; m++) {
    //   const player = this.players[m];
    //   player.update();
    // }
  }

  draw = () => {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const currentPlayer = this.players.find(player => player.id === this.socket.id);
    // TODO bototm right corner
    const cameraCornerX = currentPlayer.x - CANVAS_WIDTH / 2;
    const cameraCornerY = currentPlayer.y - CANVAS_HEIGHT / 2;
    const offsetX = currentPlayer.x % TILE_WIDTH;
    const offsetY = currentPlayer.y % TILE_HEIGHT;
    const startTileX = Math.floor(cameraCornerX / TILE_WIDTH) - 1
    const startTileY = Math.floor(cameraCornerY / TILE_HEIGHT) - 1

    const cols = CANVAS_WIDTH / TILE_WIDTH + 2;
    const rows = CANVAS_HEIGHT / TILE_HEIGHT + 2;
    for (var i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      for (var j = 0; j < rows; j++) {
        for (var k = 0; k < cols; k++) {
          let imageType;
          try {
            imageType = startTileX + k >= 0 && startTileY + j >= 0 ? layer[startTileY + j][ startTileX + k] : undefined;
          } catch(err){}

          if (imageType === undefined) {
            this.ctx.drawImage(
              this.images.tiles[1], 0, 0, TILE_WIDTH, TILE_HEIGHT,
              k * TILE_WIDTH - offsetX - 64, j * TILE_HEIGHT - offsetY - 64,
              TILE_WIDTH, TILE_HEIGHT);
          } else {
            this.ctx.drawImage(
              this.images.tiles[imageType], 0, 0, TILE_WIDTH, TILE_HEIGHT,
              k * TILE_WIDTH - offsetX - 64, j * TILE_HEIGHT - offsetY - 64,
              TILE_WIDTH, TILE_HEIGHT);
          }
        }
      }
    }
    // this.users.forEach(user => user.draw());

    for (var l = 0; l < this.coins.length; l++) {
      const coin = this.coins[l];
      coin.draw(cameraCornerX, cameraCornerY);
    }

    for (var m = 0; m < this.players.length; m++) {
      const player = this.players[m];
      player.draw(cameraCornerX, cameraCornerY);
    }
  }
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      CURRENT_STEP: '',
      isGameRunning: false,
    };
    this.canvasRef = React.createRef();
    this.lastLoop = null;
  }

  start = async (name, ctx) => {
    document.getElementById("myBtn").disabled = true;
    if (this.state.name == 'darknight') {
      alert('Bu isim alınamaz!');
    } else {
      var socket = io('http://localhost:8000');
    };

    socket.on('disconnect', () => {
      this.setState({isGameRunning: false});
      setTimeout(window.location.reload, 10000);
    });

    socket.emit('PLAYER_NAME_UPDATE', { name: this.state.name });
    if (!this.state.isGameRunning) {
      this.game = new Game(this.getCtx(), socket);
      await this.game.init();
      this.loop();
    }
    this.setState(state => ({nameEntered: true, isGameRunning: !state.isGameRunning}));
  }

  loop = () => {
    requestAnimationFrame(() => {
      const now = Date.now();
      // if (now - this.lastLoop > (1000 / 30)) {
      this.game.update();
      this.game.draw();

      this.lastLoop = Date.now();

      if (this.state.isGameRunning) {
        this.loop();
      }
    });
  }

  getCtx = () => this.canvasRef.current.getContext('2d');

  render() {
    if ((typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1)) {
      return <div className="error"><p>Üzgünüm dostum, mobilde oynanmıyor...</p></div>;
    }

    return (
      <div style={{height: '100%'}} id="divs">
        {!this.state.nameEntered && (
          <div className="">
          <div className="start-div">
            <img></img>
            <h1>Tozmaca</h1>
            <input type="text" onChange={(evt) => this.setState({name: evt.target.value.substring(0, 10)})}/>
            <button disabled={!this.state.name} onClick={this.start} id="myBtn">BAŞLA!</button>
            <h3><a href="https://ahmetkerem.herokuapp.com/nasiloynanir">Nasıl Oynanır?</a></h3>
          </div>
          </div>
        )}
        <div className="options">
       </div>
        <div style={{height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center',}} id="divs">
          <canvas ref={this.canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
          </canvas>
        </div>
      </div>
    );
  }
}

export default App;
