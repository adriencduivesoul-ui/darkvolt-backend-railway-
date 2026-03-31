import { io, Socket } from 'socket.io-client';

// FORCER RAILWAY EN PRODUCTION - PLUS DE VARIABLES D'ENVIRONNEMENT
const serverUrl = 'https://darkvolt-backend-production.up.railway.app';

export const socket: Socket = io(serverUrl, {
  autoConnect: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 15,
});

export default socket;
