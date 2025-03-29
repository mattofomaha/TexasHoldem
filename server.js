// Server-side (Node.js with Socket.io)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let players = [];
let gameState = {
    deck: [],
    communityCards: [],
    pot: 0,
    currentBet: 0,
    currentPlayer: 0,
};

function createDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    socket.on('join', (name) => {
        players.push({ id: socket.id, name, chips: 1000, hand: [] });
        io.emit('updatePlayers', players);
    });
    
    socket.on('startGame', () => {
        gameState.deck = createDeck();
        gameState.communityCards = [];
        gameState.pot = 0;
        gameState.currentBet = 0;
        gameState.currentPlayer = 0;
        
        players.forEach(player => {
            player.hand = [gameState.deck.pop(), gameState.deck.pop()];
        });
        
        io.emit('gameStarted', { players, gameState });
    });
    
    socket.on('bet', (amount) => {
        let player = players[gameState.currentPlayer];
        if (player.chips >= amount) {
            player.chips -= amount;
            gameState.pot += amount;
            gameState.currentBet = amount;
            gameState.currentPlayer = (gameState.currentPlayer + 1) % players.length;
            io.emit('updateGame', { players, gameState });
        }
    });
    
    socket.on('disconnect', () => {
        players = players.filter(player => player.id !== socket.id);
        io.emit('updatePlayers', players);
    });
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});
