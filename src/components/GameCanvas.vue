<template>
  <div class="game-container">
    <div v-if="!gameId" class="game-controls">
      <button @click="createGame">Utwórz grę</button>
      <div class="join-game">
        <input v-model="joinGameId" placeholder="Wprowadź kod gry" />
        <button @click="joinGame">Dołącz do gry</button>
      </div>
    </div>
    <div v-else>
      <div class="game-info">
        <div>Kod gry: {{ gameId }}</div>
        <div>Gracze: {{ players.length }}/2</div>
        <div v-for="(score, playerId) in scores" :key="playerId">
          Gracz {{ playerId === socket.id ? 'Ty' : 'Przeciwnik' }}: {{ score }} punktów
        </div>
      </div>
      <canvas ref="gameCanvas"></canvas>
    </div>
  </div>
</template>

<script>
import { io } from 'socket.io-client';

export default {
  name: 'GameCanvas',
  data() {
    return {
      canvas: null,
      ctx: null,
      socket: null,
      gameId: null,
      joinGameId: '',
      players: [],
      scores: {},
      player: {
        x: 0,
        y: 0,
        radius: 20,
        speed: 5,
        color: '#3498db'
      },
      opponent: {
        x: 0,
        y: 0,
        radius: 20,
        color: '#e74c3c'
      },
      shapes: [],
      keys: {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
      }
    }
  },
  mounted() {
    this.socket = io('http://localhost:3000');
    this.setupSocketListeners();
    
    this.canvas = this.$refs.gameCanvas;
    this.ctx = this.canvas.getContext('2d');
    
    this.canvas.width = 800;
    this.canvas.height = 600;
    
    this.player.x = this.canvas.width / 2;
    this.player.y = this.canvas.height / 2;
    
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    this.gameLoop();
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    if (this.socket) {
      this.socket.disconnect();
    }
  },
  methods: {
    setupSocketListeners() {
      this.socket.on('gameCreated', ({ gameId }) => {
        this.gameId = gameId;
        this.players = [this.socket.id];
        this.scores = { [this.socket.id]: 0 };
      });

      this.socket.on('playerJoined', ({ players, scores }) => {
        this.players = players;
        this.scores = scores;
      });

      this.socket.on('opponentMove', ({ playerId, position }) => {
        this.opponent.x = position.x;
        this.opponent.y = position.y;
      });

      this.socket.on('shapeCollected', ({ playerId, shapeIndex, scores }) => {
        this.shapes.splice(shapeIndex, 1);
        this.scores = scores;
        this.generateShapes();
      });

      this.socket.on('playerLeft', ({ players, scores }) => {
        this.players = players;
        this.scores = scores;
      });

      this.socket.on('joinError', (message) => {
        alert(message);
      });
    },
    createGame() {
      this.socket.emit('createGame');
    },
    joinGame() {
      if (this.joinGameId) {
        this.socket.emit('joinGame', this.joinGameId);
      }
    },
    generateShapes() {
      const shapeTypes = ['triangle', 'square', 'polygon'];
      const colors = ['#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c'];
      
      const shape = {
        type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
        x: Math.random() * (this.canvas.width - 40) + 20,
        y: Math.random() * (this.canvas.height - 40) + 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 20
      };
      
      this.shapes.push(shape);
    },
    drawPlayer() {
      this.ctx.beginPath();
      this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.player.color;
      this.ctx.fill();
      this.ctx.closePath();
    },
    drawOpponent() {
      this.ctx.beginPath();
      this.ctx.arc(this.opponent.x, this.opponent.y, this.opponent.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.opponent.color;
      this.ctx.fill();
      this.ctx.closePath();
    },
    drawShapes() {
      this.shapes.forEach(shape => {
        this.ctx.beginPath();
        this.ctx.fillStyle = shape.color;
        
        switch(shape.type) {
          case 'triangle':
            this.ctx.moveTo(shape.x, shape.y - shape.size);
            this.ctx.lineTo(shape.x - shape.size, shape.y + shape.size);
            this.ctx.lineTo(shape.x + shape.size, shape.y + shape.size);
            break;
          case 'square':
            this.ctx.rect(shape.x - shape.size/2, shape.y - shape.size/2, shape.size, shape.size);
            break;
          case 'polygon':
            const sides = 6;
            const angle = (Math.PI * 2) / sides;
            this.ctx.moveTo(shape.x + shape.size * Math.cos(0), shape.y + shape.size * Math.sin(0));
            for (let i = 1; i <= sides; i++) {
              this.ctx.lineTo(shape.x + shape.size * Math.cos(angle * i), shape.y + shape.size * Math.sin(angle * i));
            }
            break;
        }
        
        this.ctx.fill();
        this.ctx.closePath();
      });
    },
    checkCollisions() {
      this.shapes.forEach((shape, index) => {
        const dx = this.player.x - shape.x;
        const dy = this.player.y - shape.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.player.radius + shape.size) {
          this.socket.emit('collectShape', {
            gameId: this.gameId,
            shapeIndex: index
          });
        }
      });
    },
    handleKeyDown(e) {
      if (this.keys.hasOwnProperty(e.key)) {
        this.keys[e.key] = true;
      }
    },
    handleKeyUp(e) {
      if (this.keys.hasOwnProperty(e.key)) {
        this.keys[e.key] = false;
      }
    },
    updatePlayer() {
      if (this.keys.ArrowUp && this.player.y > this.player.radius) {
        this.player.y -= this.player.speed;
      }
      if (this.keys.ArrowDown && this.player.y < this.canvas.height - this.player.radius) {
        this.player.y += this.player.speed;
      }
      if (this.keys.ArrowLeft && this.player.x > this.player.radius) {
        this.player.x -= this.player.speed;
      }
      if (this.keys.ArrowRight && this.player.x < this.canvas.width - this.player.radius) {
        this.player.x += this.player.speed;
      }

      if (this.gameId) {
        this.socket.emit('playerMove', {
          gameId: this.gameId,
          position: {
            x: this.player.x,
            y: this.player.y
          }
        });
      }
    },
    gameLoop() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.updatePlayer();
      this.checkCollisions();
      
      this.drawShapes();
      this.drawPlayer();
      if (this.players.length > 1) {
        this.drawOpponent();
      }
      
      requestAnimationFrame(this.gameLoop);
    }
  }
}
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f0f0f0;
}

.game-controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.join-game {
  display: flex;
  gap: 10px;
}

.game-info {
  margin-bottom: 20px;
  text-align: center;
  font-family: Arial, sans-serif;
  color: #333;
}

canvas {
  border: 2px solid #333;
  background-color: #fff;
}

button {
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #2980b9;
}

input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
}
</style> 