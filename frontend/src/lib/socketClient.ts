/**
 * Centralized Socket.io client.
 *
 * In dev:   Vite proxy forwards /socket.io → localhost:3000
 * In prod:  Vercel vercel.json rewrites /socket.io → Render backend
 *
 * We never hardcode a host — always connect to the same origin ('/'),
 * letting the reverse proxy handle routing in both environments.
 */
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
  if (!socket) {
    socket = io('/', {
      path: '/socket.io',
      auth: token ? { token } : {},
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  } else if (token) {
    // Update auth token on existing socket if needed
    (socket.auth as Record<string, string>).token = token;
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
