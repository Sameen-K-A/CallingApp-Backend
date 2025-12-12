import { Types } from 'mongoose';
import UserModel from '../../models/user.model';
import CallModel from '../../models/call.model';
import { getSocketId } from './presence.service';
import { ITelecaller } from '../../types/telecaller';
import { getIOInstance } from '..';

export interface UserCallDetails {
  _id: string;
  name: string;
  profile: string | null;
};

export interface CallInitiateResult {
  success: boolean;
  callId?: string;
  error?: string;
  telecaller?: UserCallDetails & { socketId: string };
  caller?: UserCallDetails;
};

export interface CallActionResult {
  success: boolean;
  error?: string;
  call?: {
    _id: string;
    callType: 'AUDIO' | 'VIDEO';
    userId: string;
    telecallerId: string;
  };
  caller?: UserCallDetails;
  userSocketId?: string;
  telecallerSocketId?: string;
};

export interface CallEndResult {
  success: boolean;
  error?: string;
  otherPartySocketId?: string;
  telecallerId?: string;
};

// ============================================
// Timer Management
// ============================================

const callTimers = new Map<string, NodeJS.Timeout>();

export const startCallTimer = (callId: string, userId: string, telecallerId: string): void => {
  const timer = setTimeout(async () => {
    console.log(`⏰ Call timer expired: ${callId}`);
    await handleMissedCall(callId, userId, telecallerId);
  }, 30000); // 30 seconds

  callTimers.set(callId, timer);
  console.log(`⏰ Started 30s timer for call: ${callId}`);
};

export const clearCallTimer = (callId: string): void => {
  const timer = callTimers.get(callId);
  if (timer) {
    clearTimeout(timer);
    callTimers.delete(callId);
    console.log(`⏰ Cleared timer for call: ${callId}`);
  }
};

const handleMissedCall = async (callId: string, userId: string, telecallerId: string): Promise<void> => {
  try {
    const call = await CallModel
      .findOne({ _id: callId, status: 'RINGING' })
      .lean();

    if (!call) {
      console.log(`⏰ Call ${callId} no longer RINGING, skipping missed`);
      return;
    }

    await CallModel.updateOne({ _id: callId }, { $set: { status: 'MISSED' } });

    console.log(`📞 Call marked as MISSED: ${callId}`);

    const io = getIOInstance();
    const userNamespace = io.of('/user');
    const telecallerNamespace = io.of('/telecaller');

    const userSocketId = getSocketId('USER', userId);
    const telecallerSocketId = getSocketId('TELECALLER', telecallerId);

    if (userSocketId) {
      userNamespace.to(userSocketId).emit('call:missed', { callId });
    };

    if (telecallerSocketId) {
      telecallerNamespace.to(telecallerSocketId).emit('call:missed', { callId });
    };

    callTimers.delete(callId);
  } catch (error) {
    console.error('❌ Error handling missed call:', error);
  }
};

// ============================================
// Get User/Telecaller Details
// ============================================

export const getUserDetailsForCall = async (userId: string): Promise<UserCallDetails | null> => {
  try {
    const user = await UserModel
      .findOne({ _id: userId, role: 'USER', accountStatus: 'ACTIVE' }, { _id: 1, name: 1, profile: 1 })
      .lean();

    if (!user) {
      return null;
    }

    return {
      _id: user._id.toString(),
      name: user.name || 'Unknown',
      profile: user.profile || null
    };
  } catch (error) {
    console.error('❌ Error fetching user details for call:', error);
    return null;
  }
};

export const getTelecallerDetailsForCall = async (telecallerId: string): Promise<UserCallDetails | null> => {
  try {
    const telecaller = await UserModel
      .findOne(
        { _id: telecallerId, role: 'TELECALLER', accountStatus: 'ACTIVE', 'telecallerProfile.approvalStatus': 'APPROVED' },
        { _id: 1, name: 1, profile: 1 }
      )
      .lean();

    if (!telecaller) {
      return null;
    }

    return {
      _id: telecaller._id.toString(),
      name: telecaller.name || 'Unknown',
      profile: telecaller.profile || null
    };
  } catch (error) {
    console.error('❌ Error fetching telecaller details for call:', error);
    return null;
  }
};

// ============================================
// Calculate Call Duration
// ============================================

const calculateDuration = (acceptedAt: Date): number => {
  const now = new Date();
  const durationMs = now.getTime() - acceptedAt.getTime();
  return Math.floor(durationMs / 1000);
};

// ============================================
// Initiate Call
// ============================================

export const initiateCall = async (userId: string, telecallerId: string, callType: 'AUDIO' | 'VIDEO'): Promise<CallInitiateResult> => {
  try {
    if (!Types.ObjectId.isValid(userId)) {
      return { success: false, error: 'Something went wrong. Please try again.' };
    };
    if (!Types.ObjectId.isValid(telecallerId)) {
      return { success: false, error: 'Something went wrong. Please try again.' };
    };

    const [user, telecaller] = await Promise.all([
      UserModel
        .findOne(
          { _id: userId, role: 'USER', accountStatus: 'ACTIVE' },
          { _id: 1, name: 1, profile: 1 }
        )
        .lean(),
      UserModel
        .findOne(
          { _id: telecallerId, role: 'TELECALLER', accountStatus: 'ACTIVE', 'telecallerProfile.approvalStatus': 'APPROVED' },
          { _id: 1, name: 1, profile: 1, telecallerProfile: 1 }
        )
        .lean() as Promise<(ITelecaller & { _id: Types.ObjectId }) | null>
    ]);

    if (!user) {
      return { success: false, error: 'Your account is not available. Please contact support.' };
    };
    if (!telecaller) {
      return { success: false, error: 'This person is no longer available for calls.' };
    };

    const telecallerName = telecaller.name || 'This person';
    const telecallerPresence = telecaller.telecallerProfile.presence;

    if (telecallerPresence === 'OFFLINE') {
      return { success: false, error: `${telecallerName} is currently offline. Please try again later.` };
    }

    if (telecallerPresence === 'ON_CALL') {
      return { success: false, error: `${telecallerName} is busy on another call. Please try again later.` };
    }

    const telecallerSocketId = getSocketId('TELECALLER', telecallerId);

    if (!telecallerSocketId) {
      return { success: false, error: `${telecallerName} is currently unavailable. Please try again later.` };
    }

    const call = await CallModel.create({
      userId: new Types.ObjectId(userId),
      telecallerId: new Types.ObjectId(telecallerId),
      callType,
      status: 'RINGING'
    });

    console.log(`📞 Call initiated: ${call._id} | ${userId} → ${telecallerId} | ${callType}`);

    startCallTimer(call._id.toString(), userId, telecallerId);

    return {
      success: true,
      callId: call._id.toString(),
      telecaller: {
        _id: telecallerId,
        name: telecaller.name || 'Unknown',
        profile: telecaller.profile || null,
        socketId: telecallerSocketId
      },
      caller: {
        _id: userId,
        name: user.name || 'Unknown',
        profile: user.profile || null
      }
    };
  } catch (error) {
    console.error('❌ Error initiating call:', error);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
};

// ============================================
// Accept Call
// ============================================

export const acceptCall = async (telecallerId: string, callId: string): Promise<CallActionResult> => {
  try {
    if (!Types.ObjectId.isValid(callId)) {
      return { success: false, error: 'Something went wrong. Please try again.' };
    };
    if (!Types.ObjectId.isValid(telecallerId)) {
      return { success: false, error: 'Something went wrong. Please try again.' };
    };

    const call = await CallModel
      .findOne({ _id: callId, telecallerId: telecallerId, status: 'RINGING' })
      .lean();

    if (!call) {
      return { success: false, error: 'Call not found or already ended.' };
    };

    clearCallTimer(callId);

    await CallModel.updateOne(
      { _id: callId },
      { $set: { status: 'ACCEPTED', acceptedAt: new Date() } }
    );

    await UserModel.updateOne(
      { _id: telecallerId, role: 'TELECALLER' },
      { $set: { 'telecallerProfile.presence': 'ON_CALL' } }
    );

    const caller = await getUserDetailsForCall(call.userId.toString());
    const userSocketId = getSocketId('USER', call.userId.toString());

    console.log(`📞 Call accepted: ${callId} | Telecaller: ${telecallerId}`);

    return {
      success: true,
      call: {
        _id: callId,
        callType: call.callType,
        userId: call.userId.toString(),
        telecallerId: telecallerId
      },
      caller: caller || { _id: call.userId.toString(), name: 'Unknown', profile: null },
      userSocketId: userSocketId
    };
  } catch (error) {
    console.error('❌ Error accepting call:', error);
    return { success: false, error: 'Failed to accept call. Please try again.' };
  }
};

// ============================================
// Reject Call
// ============================================

export const rejectCall = async (telecallerId: string, callId: string): Promise<CallActionResult> => {
  try {
    if (!Types.ObjectId.isValid(callId)) {
      return { success: false, error: 'Something went wrong. Please try again.' };
    };
    if (!Types.ObjectId.isValid(telecallerId)) {
      return { success: false, error: 'Something went wrong. Please try again.' };
    };

    const call = await CallModel
      .findOne({ _id: callId, telecallerId: telecallerId, status: 'RINGING' })
      .lean();

    if (!call) {
      return { success: false, error: 'Call not found or already ended.' };
    };

    clearCallTimer(callId);

    await CallModel.updateOne({ _id: callId }, { $set: { status: 'REJECTED' } });

    const userSocketId = getSocketId('USER', call.userId.toString());

    console.log(`📞 Call rejected: ${callId} | Telecaller: ${telecallerId}`);

    return {
      success: true,
      call: {
        _id: callId,
        callType: call.callType,
        userId: call.userId.toString(),
        telecallerId: telecallerId
      },
      userSocketId: userSocketId
    };
  } catch (error) {
    console.error('❌ Error rejecting call:', error);
    return { success: false, error: 'Failed to reject call. Please try again.' };
  }
};

// ============================================
// Cancel Call (User cancels during RINGING)
// ============================================

export const cancelCall = async (userId: string, callId: string): Promise<CallActionResult> => {
  try {
    if (!Types.ObjectId.isValid(callId)) {
      return { success: false, error: 'Something went wrong. Please try again.' };
    };
    if (!Types.ObjectId.isValid(userId)) {
      return { success: false, error: 'Something went wrong. Please try again.' };
    };

    const call = await CallModel
      .findOne({ _id: callId, userId: userId, status: 'RINGING' })
      .lean();

    if (!call) {
      return { success: false, error: 'Call not found or already ended.' };
    };

    // Clear the 30 second timer
    clearCallTimer(callId);
    await CallModel.updateOne({ _id: callId }, { $set: { status: 'MISSED' } });

    const telecallerSocketId = getSocketId('TELECALLER', call.telecallerId.toString());

    console.log(`📞 Call cancelled by user: ${callId} | User: ${userId}`);

    return {
      success: true,
      call: {
        _id: callId,
        callType: call.callType,
        userId: userId,
        telecallerId: call.telecallerId.toString()
      },
      telecallerSocketId
    };
  } catch (error) {
    console.error('❌ Error cancelling call:', error);
    return { success: false, error: 'Failed to cancel call. Please try again.' };
  }
};

// ============================================
// End Call (During active call)
// ============================================

export const endCall = async (callId: string, endedBy: 'USER' | 'TELECALLER', enderId: string): Promise<CallEndResult> => {
  try {
    if (!Types.ObjectId.isValid(callId)) {
      return { success: false, error: 'Invalid call ID.' };
    };

    const query = endedBy === 'USER'
      ? { _id: callId, userId: enderId, status: 'ACCEPTED' }
      : { _id: callId, telecallerId: enderId, status: 'ACCEPTED' };

    const call = await CallModel.findOne(query).lean();

    if (!call) {
      return { success: false, error: 'Call not found or already ended.' };
    }

    const duration = call.acceptedAt ? calculateDuration(call.acceptedAt) : 0;

    await CallModel.updateOne(
      { _id: callId },
      {
        $set: {
          status: 'COMPLETED',
          endedAt: new Date(),
          durationInSeconds: duration
        }
      }
    );

    await UserModel.updateOne(
      { _id: call.telecallerId, role: 'TELECALLER' },
      { $set: { 'telecallerProfile.presence': 'ONLINE' } }
    );

    console.log(`📞 Call ended: ${callId} | Duration: ${duration}s | Ended by: ${endedBy}`);

    const otherPartySocketId = endedBy === 'USER'
      ? getSocketId('TELECALLER', call.telecallerId.toString())
      : getSocketId('USER', call.userId.toString());

    return {
      success: true,
      otherPartySocketId,
      telecallerId: call.telecallerId.toString()
    };
  } catch (error) {
    console.error('❌ Error ending call:', error);
    return { success: false, error: 'Failed to end call.' };
  }
};

// ============================================
// Handle Disconnect During Ringing
// ============================================

export const handleUserDisconnectDuringCall = async (userId: string): Promise<void> => {
  try {
    // Check for ACCEPTED (active) calls FIRST - priority over ringing
    const activeCall = await CallModel
      .findOne({ userId: userId, status: 'ACCEPTED' })
      .lean();

    if (activeCall) {
      const callId = activeCall._id.toString();
      const telecallerId = activeCall.telecallerId.toString();
      const duration = activeCall.acceptedAt ? calculateDuration(activeCall.acceptedAt) : 0;

      await CallModel.updateOne(
        { _id: callId },
        {
          $set: {
            status: 'COMPLETED',
            endedAt: new Date(),
            durationInSeconds: duration
          }
        }
      );

      await UserModel.updateOne(
        { _id: telecallerId, role: 'TELECALLER' },
        { $set: { 'telecallerProfile.presence': 'ONLINE' } }
      );

      console.log(`📞 Call auto-ended (user disconnected): ${callId} | Duration: ${duration}s`);

      const io = getIOInstance();

      // Notify telecaller that call ended
      const telecallerNamespace = io.of('/telecaller');
      const telecallerSocketId = getSocketId('TELECALLER', telecallerId);

      if (telecallerSocketId) {
        telecallerNamespace.to(telecallerSocketId).emit('call:ended', { callId });
      }

      // Broadcast to all users that telecaller is available again
      const userNamespace = io.of('/user');
      userNamespace.emit('telecaller:presence-changed', {
        telecallerId: telecallerId,
        presence: 'ONLINE',
        telecaller: null
      });

      return;
    }

    // Check for RINGING calls
    const ringingCall = await CallModel
      .findOne({ userId: userId, status: 'RINGING' })
      .lean();

    if (ringingCall) {
      const callId = ringingCall._id.toString();
      clearCallTimer(callId);

      await CallModel.updateOne({ _id: callId }, { $set: { status: 'MISSED' } });

      console.log(`📞 Call auto-missed (user disconnected): ${callId}`);

      const io = getIOInstance();
      const telecallerNamespace = io.of('/telecaller');
      const telecallerSocketId = getSocketId('TELECALLER', ringingCall.telecallerId.toString());

      if (telecallerSocketId) {
        telecallerNamespace.to(telecallerSocketId).emit('call:cancelled', { callId });
      }
    }
  } catch (error) {
    console.error('❌ Error handling user disconnect during call:', error);
  }
};

export const handleTelecallerDisconnectDuringCall = async (telecallerId: string): Promise<void> => {
  try {
    // Check for ACCEPTED (active) calls FIRST - priority over ringing
    const activeCall = await CallModel
      .findOne({ telecallerId: telecallerId, status: 'ACCEPTED' })
      .lean();

    if (activeCall) {
      const callId = activeCall._id.toString();
      const duration = activeCall.acceptedAt ? calculateDuration(activeCall.acceptedAt) : 0;

      await CallModel.updateOne(
        { _id: callId },
        {
          $set: {
            status: 'COMPLETED',
            endedAt: new Date(),
            durationInSeconds: duration
          }
        }
      );

      console.log(`📞 Call auto-ended (telecaller disconnected): ${callId} | Duration: ${duration}s`);

      const io = getIOInstance();
      const userNamespace = io.of('/user');
      const userSocketId = getSocketId('USER', activeCall.userId.toString());

      if (userSocketId) {
        userNamespace.to(userSocketId).emit('call:ended', { callId });
      }

      return;
    }

    // Check for RINGING calls
    const ringingCall = await CallModel
      .findOne({ telecallerId: telecallerId, status: 'RINGING' })
      .lean();

    if (ringingCall) {
      const callId = ringingCall._id.toString();
      clearCallTimer(callId);
      await CallModel.updateOne({ _id: callId }, { $set: { status: 'MISSED' } });

      console.log(`📞 Call auto-missed (telecaller disconnected): ${callId}`);

      const io = getIOInstance();
      const userNamespace = io.of('/user');
      const userSocketId = getSocketId('USER', ringingCall.userId.toString());

      if (userSocketId) {
        userNamespace.to(userSocketId).emit('call:missed', { callId });
      }
    }
  } catch (error) {
    console.error('❌ Error handling telecaller disconnect during call:', error);
  }
};