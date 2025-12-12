import { Server as SocketIOServer, Namespace } from 'socket.io';
import { requireRole, socketAuthMiddleware } from '../middleware/auth.middleware';
import {
  ServerToTelecallerEvents,
  TelecallerToServerEvents,
  TelecallerSocketData,
  CallAcceptPayload,
  CallRejectPayload,
} from '../types/telecaller.events';
import {
  setOnline,
  setOffline,
  updateTelecallerPresenceInDB,
  getTelecallerDetailsForBroadcast,
  broadcastPresenceToUsers
} from '../services/presence.service';
import { acceptCall, rejectCall, handleTelecallerDisconnectDuringCall } from '../services/call.service';
import { getIOInstance } from '../index';

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

      // Fetch telecaller details and broadcast to all users
      const telecallerDetails = await getTelecallerDetailsForBroadcast(userId);

      if (telecallerDetails) {
        broadcastPresenceToUsers({
          telecallerId: userId,
          presence: 'ONLINE',
          telecaller: telecallerDetails
        });
      };
    } else {
      console.log(`🟡 Telecaller connected (DB update failed): ${socket.id} | User ID: ${userId}`);
    };

    // ============================================
    // Call Accept Handler
    // ============================================
    socket.on('call:accept', async (data: CallAcceptPayload) => {
      console.log(`📞 Call accept request: ${userId} | Call ID: ${data.callId}`);

      if (!data.callId) {
        socket.emit('error', { message: 'Invalid call ID.' });
        return;
      }

      const result = await acceptCall(userId, data.callId);

      if (!result.success || !result.call) {
        socket.emit('error', { message: result.error || 'Failed to accept call.' });
        return;
      }

      broadcastPresenceToUsers({
        telecallerId: userId,
        presence: 'ON_CALL',
        telecaller: null
      });

      if (result.userSocketId) {
        const io = getIOInstance();
        const userNamespace = io.of('/user');

        userNamespace.to(result.userSocketId).emit('call:accepted', {
          callId: data.callId
        });

        console.log(`📤 Emitted call:accepted to user: ${result.userSocketId}`);
      }

      socket.emit('call:accepted', {
        callId: data.callId,
        callType: result.call.callType,
        caller: result.caller!
      });

      console.log(`📤 Emitted call:accepted to telecaller: ${socket.id}`);
    });

    // ============================================
    // Call Reject Handler
    // ============================================
    socket.on('call:reject', async (data: CallRejectPayload) => {
      console.log(`📞 Call reject request: ${userId} | Call ID: ${data.callId}`);

      if (!data.callId) {
        socket.emit('error', { message: 'Invalid call ID.' });
        return;
      }

      const result = await rejectCall(userId, data.callId);

      if (!result.success) {
        socket.emit('error', { message: result.error || 'Failed to reject call.' });
        return;
      }

      if (result.userSocketId) {
        const io = getIOInstance();
        const userNamespace = io.of('/user');

        userNamespace.to(result.userSocketId).emit('call:rejected', {
          callId: data.callId
        });

        console.log(`📤 Emitted call:rejected to user: ${result.userSocketId}`);
      }
    });

    socket.on('disconnect', async (reason) => {
      setOffline('TELECALLER', userId);                                           // Update in-memory tracking
      const isDbUpdated = await updateTelecallerPresenceInDB(userId, 'OFFLINE');  // Update database presence

      if (isDbUpdated) {
        console.log(`🔴 Telecaller disconnected: ${socket.id} | User ID: ${userId} | Reason: ${reason}`);

        // Broadcast offline status to all users
        broadcastPresenceToUsers({
          telecallerId: userId,
          presence: 'OFFLINE',
          telecaller: null
        });
      } else {
        console.log(`🟠 Telecaller disconnected (DB update failed): ${socket.id} | User ID: ${userId}`);
      }

      await handleTelecallerDisconnectDuringCall(userId);
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