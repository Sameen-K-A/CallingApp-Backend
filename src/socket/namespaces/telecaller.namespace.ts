import { Server as SocketIOServer, Namespace } from 'socket.io';
import { requireRole, socketAuthMiddleware, requireActiveAccount, requireApprovedTelecaller } from '../middleware/auth.middleware';
import { CallIdPayload } from '../types/user.events';
import {
  ServerToTelecallerEvents,
  TelecallerToServerEvents,
  TelecallerSocketData,
} from '../types/telecaller.events';
import {
  setOnline,
  setOffline,
  updateTelecallerPresenceInDB,
  getTelecallerDetailsForBroadcast,
  broadcastPresenceToUsers,
  getSocketId
} from '../services/presence.service';
import {
  acceptCall,
  rejectCall,
  endCall,
  handleTelecallerDisconnectDuringCall,
} from '../services/call.service';
import { getIOInstance } from '../index';
import { callActionLimiter } from '../../middleware/rateLimiter';

// ============================================
// Setup Telecaller Namespace
// ============================================

export const setupTelecallerNamespace = (io: SocketIOServer): Namespace<TelecallerToServerEvents, ServerToTelecallerEvents, {}, TelecallerSocketData> => {

  const telecallerNamespace = io.of('/telecaller') as Namespace<TelecallerToServerEvents, ServerToTelecallerEvents, {}, TelecallerSocketData>;

  telecallerNamespace.use(socketAuthMiddleware);
  telecallerNamespace.use(requireRole(['TELECALLER']));
  telecallerNamespace.use(requireActiveAccount);
  telecallerNamespace.use(requireApprovedTelecaller);

  telecallerNamespace.on('connection', async (socket) => {
    const userId = socket.data.userId;
    const role = socket.data.role;

    await setOnline('TELECALLER', userId, socket.id);

    const [isDbUpdated, telecallerDetails] = await Promise.all([
      updateTelecallerPresenceInDB(userId, 'ONLINE'),
      getTelecallerDetailsForBroadcast(userId)
    ]);

    if (isDbUpdated) {
      console.log(`🟢 Telecaller connected: ${socket.id} | User ID: ${userId} | Role: ${role}`);

      if (telecallerDetails) {
        broadcastPresenceToUsers({
          telecallerId: userId,
          presence: 'ONLINE',
          telecaller: telecallerDetails
        });
      }
    } else {
      console.log(`🟡 Telecaller connected (DB update failed): ${socket.id} | User ID: ${userId}`);
    }

    // ============================================
    // Call Accept Handler
    // ============================================
    socket.on('call:accept', async (data: CallIdPayload) => {
      try {
        await callActionLimiter.consume(userId);
      } catch (err) {
        socket.emit('error', { message: 'Too many requests. Please wait.' });
        return;
      }

      console.log(`📞 Call accept request: ${userId} | Call ID: ${data.callId}`);

      if (!data.callId) {
        socket.emit('error', { message: 'Invalid call ID.' });
        return;
      }

      const result = await acceptCall(userId, data.callId);

      if (!result.success || !result.call) {
        socket.emit('error', { message: result.error || 'Failed to accept call.' });

        // Notify user that acceptance failed
        if (result.userSocketId) {
          const io = getIOInstance();
          const userNamespace = io.of('/user');
          const userSocketId = await getSocketId('USER', result.userSocketId);

          if (userSocketId) {
            userNamespace.to(userSocketId).emit('call:error', {
              message: 'Call setup failed. Please try again.'
            });
          }
        };

        return;
      }

      broadcastPresenceToUsers({
        telecallerId: userId,
        presence: 'ON_CALL',
        telecaller: null
      });

      if (result.userSocketId && result.userLiveKit) {
        const io = getIOInstance();
        const userNamespace = io.of('/user');

        console.log('📤 Sending call:accepted to USER socket:', result.userSocketId);

        userNamespace.to(result.userSocketId).emit('call:accepted', {
          callId: data.callId,
          livekit: result.userLiveKit,
        });

        console.log('✅ Emitted call:accepted to USER');
      }

      socket.emit('call:accepted', {
        callId: data.callId,
        callType: result.call.callType,
        caller: result.caller!,
        livekit: result.telecallerLiveKit!,
      });

      console.log('✅ Emitted call:accepted to TELECALLER');
    });

    // ============================================
    // Call Reject Handler
    // ============================================
    socket.on('call:reject', async (data: CallIdPayload) => {
      try {
        await callActionLimiter.consume(userId);
      } catch (err) {
        return;
      }

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

    // ============================================
    // Call End Handler
    // ============================================
    socket.on('call:end', async (data: CallIdPayload) => {
      try {
        await callActionLimiter.consume(userId);
      } catch (err) {
        return;
      }

      console.log(`📞 Call end request: ${userId} | Call ID: ${data.callId}`);

      if (!data.callId) {
        socket.emit('error', { message: 'Invalid call ID.' });
        return;
      }

      const result = await endCall(data.callId, 'TELECALLER', userId);

      if (!result.success) {
        console.log(`❌ Call end failed: ${result.error}`);
        return;
      }

      if (result.otherPartySocketId) {
        const io = getIOInstance();
        const userNamespace = io.of('/user');

        userNamespace.to(result.otherPartySocketId).emit('call:ended', {
          callId: data.callId
        });

        console.log(`📤 Emitted call:ended to user: ${result.otherPartySocketId}`);
      }

      broadcastPresenceToUsers({
        telecallerId: userId,
        presence: 'ONLINE',
        telecaller: null
      });
    });

    // ============================================
    // Disconnect Handler
    // ============================================
    socket.on('disconnect', async (reason) => {
      await setOffline('TELECALLER', userId);

      const [isDbUpdated] = await Promise.all([
        updateTelecallerPresenceInDB(userId, 'OFFLINE'),
        handleTelecallerDisconnectDuringCall(userId)
      ]);

      if (isDbUpdated) {
        console.log(`🔴 Telecaller disconnected: ${socket.id} | User ID: ${userId} | Reason: ${reason}`);

        broadcastPresenceToUsers({
          telecallerId: userId,
          presence: 'OFFLINE',
          telecaller: null
        });
      } else {
        console.log(`🟠 Telecaller disconnected (DB update failed): ${socket.id} | User ID: ${userId}`);
      }
    });

    // ============================================
    // Error Handler
    // ============================================
    socket.on('error', (error) => {
      console.error('🟠 Socket error:', error);
      socket.emit('error', { message: 'An error occurred' });
    });
  });

  console.log('✅ Telecaller namespace initialized');
  return telecallerNamespace;
};

// ============================================
// Get Telecaller Namespace Instance
// ============================================

export const getTelecallerNamespace = (io: SocketIOServer): Namespace<TelecallerToServerEvents, ServerToTelecallerEvents, {}, TelecallerSocketData> => {
  return io.of('/telecaller') as Namespace<TelecallerToServerEvents, ServerToTelecallerEvents, {}, TelecallerSocketData>;
};