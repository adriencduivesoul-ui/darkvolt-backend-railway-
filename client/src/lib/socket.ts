import { io, Socket } from 'socket.io-client';

const URL = (import.meta.env.VITE_API_URL as string) || '';

export const socket: Socket = io(URL, {
  autoConnect: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 15,
});

export default socket;
