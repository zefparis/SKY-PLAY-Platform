// DEPRECATED — ce service est remplacé par ChatGateway dans api-deploy
// Ne pas utiliser — conservé pour référence uniquement

const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const server = app.listen(4001, () => {
  console.log(' Realtime Gateway running on ws://localhost:4001');
});

const wss = new WebSocket.Server({ server });

const clients = new Map();

wss.on('connection', (ws, req) => {
  const userId = req.url.split('?userId=')[1];
  
  if (userId) {
    clients.set(userId, ws);
    console.log(`User ${userId} connected`);
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(ws, data, userId);
    } catch (error) {
      console.error('Invalid message:', error);
    }
  });

  ws.on('close', () => {
    if (userId) {
      clients.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  });

  ws.send(JSON.stringify({ type: 'connected', message: 'Connected to SKY PLAY' }));
});

function handleMessage(ws, data, userId) {
  switch (data.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
    
    case 'challenge_update':
      broadcast({ type: 'challenge_update', data: data.payload });
      break;
    
    case 'chat_message':
      broadcast({ type: 'chat_message', data: data.payload });
      break;
    
    default:
      ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
  }
}

function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function sendToUser(userId, message) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}
