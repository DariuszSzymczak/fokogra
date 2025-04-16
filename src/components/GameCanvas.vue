<template>
  <div class="game-container">
    <canvas ref="gameCanvas"></canvas>
    <div class="score">Punkty: {{ score }}</div>
  </div>
</template>

<script>
export default {
  name: 'GameCanvas',
  data() {
    return {
      canvas: null,
      ctx: null,
      player: {
        x: 0,
        y: 0,
        radius: 20,
        speed: 5,
        color: '#3498db'
      },
      shapes: [],
      score: 0,
      keys: {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
      }
    }
  },
  mounted() {
    this.canvas = this.$refs.gameCanvas;
    this.ctx = this.canvas.getContext('2d');
    
    // Set canvas size
    this.canvas.width = 800;
    this.canvas.height = 600;
    
    // Initialize player position
    this.player.x = this.canvas.width / 2;
    this.player.y = this.canvas.height / 2;
    
    // Initialize game
    for (let i = 0; i < 5; i++) {
      this.generateShapes();
    }
    
    // Add event listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    // Start game loop
    this.gameLoop();
  },
  beforeUnmount() {
    // Clean up event listeners
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  },
  methods: {
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
          this.shapes.splice(index, 1);
          this.score += 10;
          this.generateShapes();
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
    },
    gameLoop() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.updatePlayer();
      this.checkCollisions();
      
      this.drawShapes();
      this.drawPlayer();
      
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

canvas {
  border: 2px solid #333;
  background-color: #fff;
}

.score {
  margin-top: 20px;
  font-size: 24px;
  font-family: Arial, sans-serif;
  color: #333;
}
</style> 