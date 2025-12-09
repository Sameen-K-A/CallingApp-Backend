import { Server as SocketIOServer, Namespace } from 'socket.io';
import { ServerToAdminEvents, AdminToServerEvents, AdminSocketData } from '../types/admin.events';
import { requireRole, socketAuthMiddleware } from '../middleware/auth.middleware';
import { getOnlineCount } from '../services/presence.service';

export const setupAdminNamespace = (io: SocketIOServer): Namespace<AdminToServerEvents, ServerToAdminEvents, {}, AdminSocketData> => {

  const adminNamespace = io.of('/admin') as Namespace<AdminToServerEvents, ServerToAdminEvents, {}, AdminSocketData>;

  adminNamespace.use(socketAuthMiddleware);
  adminNamespace.use(requireRole(['ADMIN']));

  adminNamespace.on('connection', (socket) => {
    const userId = socket.data.userId;
    const role = socket.data.role;

    console.log(`🟢 Admin connected: ${socket.id} | User ID: ${userId} | Role: ${role}`);

    socket.on('presence:request-counts', () => {
      socket.emit('presence:counts', {
        onlineUsers: getOnlineCount('USER'),
        onlineTelecallers: getOnlineCount('TELECALLER'),
        timestamp: new Date()
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔴 Admin disconnected: ${socket.id} - Reason: ${reason}`);
    });

    socket.on('error', (error) => {
      console.error('🟠 Socket error:', error);
      socket.emit('error', { message: 'An error occurred' });
    });
  });

  console.log('✅ Admin namespace initialized');
  return adminNamespace;
};

// Use this to emit events to admin dashboard from anywhere in the app
export const getAdminNamespace = (io: SocketIOServer) => {
  return io.of('/admin') as Namespace<AdminToServerEvents, ServerToAdminEvents, {}, AdminSocketData>;
};