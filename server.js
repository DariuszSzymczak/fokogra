import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const games = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createGame', () => {
    const gameId = Math.random().toString(36).substring(2, 8);
    games.set(gameId, {
      players: [socket.id],
      scores: { [socket.id]: 0 },
      shapes: []
    });
    socket.join(gameId);
    socket.emit('gameCreated', { gameId });
  });

  socket.on('joinGame', (gameId) => {
    const game = games.get(gameId);
    if (game && game.players.length < 2) {
      game.players.push(socket.id);
      game.scores[socket.id] = 0;
      socket.join(gameId);
      io.to(gameId).emit('playerJoined', {
        players: game.players,
        scores: game.scores
      });
    } else {
      socket.emit('joinError', 'Game not found or full');
    }
  });

  socket.on('playerMove', (data) => {
    const { gameId, position } = data;
    socket.to(gameId).emit('opponentMove', {
      playerId: socket.id,
      position
    });
  });

  socket.on('collectShape', (data) => {
    const { gameId, shapeIndex } = data;
    const game = games.get(gameId);
    if (game) {
      game.scores[socket.id] += 10;
      game.shapes.splice(shapeIndex, 1);
      io.to(gameId).emit('shapeCollected', {
        playerId: socket.id,
        shapeIndex,
        scores: game.scores
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Clean up games when players disconnect
    for (const [gameId, game] of games.entries()) {
      if (game.players.includes(socket.id)) {
        game.players = game.players.filter(id => id !== socket.id);
        delete game.scores[socket.id];
        if (game.players.length === 0) {
          games.delete(gameId);
        } else {
          io.to(gameId).emit('playerLeft', {
            playerId: socket.id,
            players: game.players,
            scores: game.scores
          });
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 