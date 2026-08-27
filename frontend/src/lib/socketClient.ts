/**
 * Centralized Socket.io client.
 *
 * In dev:   Vite proxy forwards /socket.io → localhost:3000
 * In prod:  Connects directly to Backend server (Render / configured URL)
 *           because Vercel Serverless proxy does not support WebSocket handshake upgrades.
 */
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const getBackendUrl = (): string => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) {
    return 'https://ktd-store-backend.onrender.com';
  }
  return '/';
};

export function getSocket(token?: string): Socket {
  if (!socket) {
    const targetUrl = getBackendUrl();
    socket = io(targetUrl, {
      path: '/socket.io',
      auth: token ? { token } : {},
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socket.on('connect_error', (err) => {
      // Graceful error logging to avoid spamming console
      console.warn('[Socket.io] Connection notice:', err.message);
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

