import { Server as SocketIOServer, Namespace } from 'socket.io';
import { requireRole, socketAuthMiddleware } from '../middleware/auth.middleware';
import {
  ServerToUserEvents,
  UserToServerEvents,
  UserSocketData
} from '../types/user.events';
import { setOffline, setOnline } from '../services/presence.service';

export const setupUserNamespace = (io: SocketIOServer): Namespace<UserToServerEvents, ServerToUserEvents, {}, UserSocketData> => {

  const userNamespace = io.of('/user') as Namespace<UserToServerEvents, ServerToUserEvents, {}, UserSocketData>;

  userNamespace.use(socketAuthMiddleware);
  userNamespace.use(requireRole(['USER']));

  userNamespace.on('connection', (socket) => {
    const userId = socket.data.userId;
    const role = socket.data.role;

    setOnline('USER', userId, socket.id);
    console.log(`🟢 User connected: ${socket.id} | User ID: ${userId} | Role: ${role}`);

    socket.on('disconnect', (reason) => {
      setOffline('USER', userId);
      console.log(`🔴 User disconnected: ${socket.id} - Reason: ${reason}`);
    });

    socket.on('error', (error) => {
      console.error('🟠 Socket error:', error);
      socket.emit('error', { message: 'An error occurred' });
    });
  });

  console.log('✅ User namespace initialized');
  return userNamespace;
};

// Use this to emit events to user application from anywhere in the app
export const getUserNamespace = (io: SocketIOServer) => {
  return io.of('/user') as Namespace<UserToServerEvents, ServerToUserEvents, {}, UserSocketData>;
};