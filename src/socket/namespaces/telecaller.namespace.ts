import { Server as SocketIOServer, Namespace } from 'socket.io';
import { requireRole, socketAuthMiddleware } from '../middleware/auth.middleware';
import {
  ServerToTelecallerEvents,
  TelecallerToServerEvents,
  TelecallerSocketData
} from '../types/telecaller.events';
import { setOffline, setOnline } from '../services/presence.service';

export const setupTelecallerNamespace = (io: SocketIOServer): Namespace<TelecallerToServerEvents, ServerToTelecallerEvents, {}, TelecallerSocketData> => {

  const telecallerNamespace = io.of('/telecaller') as Namespace<TelecallerToServerEvents, ServerToTelecallerEvents, {}, TelecallerSocketData>;

  telecallerNamespace.use(socketAuthMiddleware);
  telecallerNamespace.use(requireRole(['TELECALLER']));

  telecallerNamespace.on('connection', (socket) => {
    const userId = socket.data.userId;
    const role = socket.data.role;

    setOnline('TELECALLER', userId, socket.id);
    console.log(`🟢 Telecaller connected: ${socket.id} | User ID: ${userId} | Role: ${role}`);

    socket.on('disconnect', (reason) => {
      setOffline('TELECALLER', userId);
      console.log(`🔴 Tele caller disconnected: ${socket.id} - Reason: ${reason}`);
    });

    socket.on('error', (error) => {
      console.error('🟠 Socket error:', error);
      socket.emit('error', { message: 'An error occurred' });
    });
  });

  console.log('✅ Telecaller namespace initialized');
  return telecallerNamespace;
};

// Use this to emit events to telecaller app from anywhere in the app
export const getTelecallerNamespace = (io: SocketIOServer) => {
  return io.of('/telecaller') as Namespace<TelecallerToServerEvents, ServerToTelecallerEvents, {}, TelecallerSocketData>;
};