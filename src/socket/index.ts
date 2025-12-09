import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { setupAdminNamespace } from './namespaces/admin.namespace';
import { setupUserNamespace } from './namespaces/user.namespace';
import { setupTelecallerNamespace } from './namespaces/telecaller.namespace';

export const initializeSocketIO = (httpServer: HTTPServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_LIVE_URL
        : process.env.FRONTEND_LOCAL_URL,
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  setupAdminNamespace(io);
  setupUserNamespace(io);
  setupTelecallerNamespace(io);

  console.log('⚡ Socket.IO server initialized with all namespaces');

  return io;
};

// Global Instance Management
let ioInstance: SocketIOServer | null = null;

export const setIOInstance = (io: SocketIOServer) => {
  ioInstance = io;
};

export const getIOInstance = (): SocketIOServer => {
  if (!ioInstance) {
    throw new Error('❌ Socket.IO instance not initialized. Call initializeSocketIO first.');
  }
  return ioInstance;
};