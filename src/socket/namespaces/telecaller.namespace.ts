import { Server as SocketIOServer, Namespace } from 'socket.io';
import { requireRole, socketAuthMiddleware } from '../middleware/auth.middleware';
import {
  ServerToTelecallerEvents,
  TelecallerToServerEvents,
  TelecallerSocketData
} from '../types/telecaller.events';
import { setOffline, setOnline, updateTelecallerPresenceInDB } from '../services/presence.service';

export const setupTelecallerNamespace = (io: SocketIOServer): Namespace<TelecallerToServerEvents, ServerToTelecallerEvents, {}, TelecallerSocketData> => {

  const telecallerNamespace = io.of('/telecaller') as Namespace<TelecallerToServerEvents, ServerToTelecallerEvents, {}, TelecallerSocketData>;

  telecallerNamespace.use(socketAuthMiddleware);
  telecallerNamespace.use(requireRole(['TELECALLER']));

  telecallerNamespace.on('connection', async (socket) => {
    const userId = socket.data.userId;
    const role = socket.data.role;

    setOnline('TELECALLER', userId, socket.id);                                   // Update in-memory tracking
    const isDbUpdated = await updateTelecallerPresenceInDB(userId, 'ONLINE');     // Update database presence tracking

    if (isDbUpdated) {
      console.log(`🟢 Telecaller connected: ${socket.id} | User ID: ${userId} | Role: ${role}`);
    } else {
      console.log(`🟡 Telecaller connected (DB update failed): ${socket.id} | User ID: ${userId}`);
    };

    socket.on('disconnect', async (reason) => {
      setOffline('TELECALLER', userId);                                           // Update in-memory tracking
      const isDbUpdated = await updateTelecallerPresenceInDB(userId, 'OFFLINE');  // Update database presence

      if (isDbUpdated) {
        console.log(`🔴 Telecaller disconnected: ${socket.id} | User ID: ${userId} | Reason: ${reason}`);
      } else {
        console.log(`🟠 Telecaller disconnected (DB update failed): ${socket.id} | User ID: ${userId}`);
      }
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