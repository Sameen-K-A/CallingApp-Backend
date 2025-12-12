import { Server as SocketIOServer, Namespace } from 'socket.io';
import { requireRole, socketAuthMiddleware } from '../middleware/auth.middleware';
import {
  ServerToUserEvents,
  UserToServerEvents,
  UserSocketData,
  CallInitiatePayload,
  CallIdPayload,
} from '../types/user.events';
import { broadcastPresenceToUsers, setOffline, setOnline } from '../services/presence.service';
import {
  initiateCall,
  cancelCall,
  endCall,
  handleUserDisconnectDuringCall,
} from '../services/call.service';
import { getIOInstance } from '../index';

// ============================================
// Setup User Namespace
// ============================================

export const setupUserNamespace = (io: SocketIOServer): Namespace<UserToServerEvents, ServerToUserEvents, {}, UserSocketData> => {

  const userNamespace = io.of('/user') as Namespace<UserToServerEvents, ServerToUserEvents, {}, UserSocketData>;

  userNamespace.use(socketAuthMiddleware);
  userNamespace.use(requireRole(['USER']));

  userNamespace.on('connection', (socket) => {
    const userId = socket.data.userId;
    const role = socket.data.role;

    setOnline('USER', userId, socket.id);
    console.log(`🟢 User connected: ${socket.id} | User ID: ${userId} | Role: ${role}`);

    // ============================================
    // Call Initiate Handler
    // ============================================
    socket.on('call:initiate', async (data: CallInitiatePayload) => {
      console.log(`📞 Call initiate request: ${userId} → ${data.telecallerId} | Type: ${data.callType}`);

      if (!data.telecallerId || !data.callType) {
        socket.emit('call:error', { message: 'Invalid call request' });
        return;
      }

      if (!['AUDIO', 'VIDEO'].includes(data.callType)) {
        socket.emit('call:error', { message: 'Invalid call type' });
        return;
      }

      const result = await initiateCall(userId, data.telecallerId, data.callType);

      if (!result.success || !result.callId) {
        console.log(`❌ Call initiation failed: ${result.error}`);
        socket.emit('call:error', { message: result.error || 'Failed to initiate call' });
        return;
      }

      const io = getIOInstance();
      const telecallerNamespace = io.of('/telecaller');

      telecallerNamespace.to(result.telecaller!.socketId).emit('call:incoming', {
        callId: result.callId,
        callType: data.callType,
        caller: {
          _id: result.caller!._id,
          name: result.caller!.name,
          profile: result.caller!.profile
        }
      });

      console.log(`📤 Emitted call:incoming to telecaller: ${result.telecaller!.socketId}`);

      socket.emit('call:ringing', {
        callId: result.callId,
        telecaller: {
          _id: result.telecaller!._id,
          name: result.telecaller!.name,
          profile: result.telecaller!.profile
        }
      });

      console.log(`📤 Emitted call:ringing to user: ${socket.id}`);
    });

    // ============================================
    // Call Cancel Handler
    // ============================================
    socket.on('call:cancel', async (data: CallIdPayload) => {
      console.log(`📞 Call cancel request: ${userId} | Call ID: ${data.callId}`);

      if (!data.callId) {
        socket.emit('call:error', { message: 'Invalid call ID' });
        return;
      }

      const result = await cancelCall(userId, data.callId);

      if (!result.success) {
        console.log(`❌ Call cancel failed: ${result.error}`);
        return;
      }

      if (result.telecallerSocketId) {
        const io = getIOInstance();
        const telecallerNamespace = io.of('/telecaller');

        telecallerNamespace.to(result.telecallerSocketId).emit('call:cancelled', {
          callId: data.callId
        });

        console.log(`📤 Emitted call:cancelled to telecaller: ${result.telecallerSocketId}`);
      }
    });

    // ============================================
    // Call End Handler
    // ============================================
    socket.on('call:end', async (data: CallIdPayload) => {
      console.log(`📞 Call end request: ${userId} | Call ID: ${data.callId}`);

      if (!data.callId) {
        socket.emit('call:error', { message: 'Invalid call ID' });
        return;
      }

      const result = await endCall(data.callId, 'USER', userId);

      if (!result.success) {
        console.log(`❌ Call end failed: ${result.error}`);
        return;
      }

      if (result.otherPartySocketId) {
        const io = getIOInstance();
        const telecallerNamespace = io.of('/telecaller');

        telecallerNamespace.to(result.otherPartySocketId).emit('call:ended', {
          callId: data.callId
        });

        console.log(`📤 Emitted call:ended to telecaller: ${result.otherPartySocketId}`);
      }

      if (result.telecallerId) {
        broadcastPresenceToUsers({
          telecallerId: result.telecallerId,
          presence: 'ONLINE',
          telecaller: null
        });
      }
    });

    // ============================================
    // Disconnect Handler
    // ============================================
    socket.on('disconnect', async (reason) => {
      setOffline('USER', userId);
      console.log(`🔴 User disconnected: ${socket.id} - Reason: ${reason}`);

      await handleUserDisconnectDuringCall(userId);
    });

    // ============================================
    // Error Handler
    // ============================================
    socket.on('error', (error) => {
      console.error('🟠 Socket error:', error);
      socket.emit('error', { message: 'An error occurred' });
    });
  });

  console.log('✅ User namespace initialized');
  return userNamespace;
};

// ============================================
// Get User Namespace Instance
// ============================================

export const getUserNamespace = (io: SocketIOServer): Namespace<UserToServerEvents, ServerToUserEvents, {}, UserSocketData> => {
  return io.of('/user') as Namespace<UserToServerEvents, ServerToUserEvents, {}, UserSocketData>;
};