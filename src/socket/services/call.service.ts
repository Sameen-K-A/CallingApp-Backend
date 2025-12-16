import { Types } from 'mongoose';
import UserModel from '../../models/user.model';
import CallModel from '../../models/call.model';
import { getSocketId } from './presence.service';
import { ITelecaller } from '../../types/telecaller';
import { getIOInstance } from '..';
import { generateLiveKitToken, LiveKitCredentials } from '../../services/livekit.service';

export interface UserCallDetails {
  _id: string;
  name: string;
  profile: string | null;
};

export interface CallInitiateResult {
  success: boolean;
  callId?: string;
  error?: string;
  roomName?: string;
  telecaller?: UserCallDetails & {
    socketId: string;
    livekit?: LiveKitCredentials;
  };
  caller?: UserCallDetails & {
    livekit?: LiveKitCredentials;
  };
};

export interface CallActionResult {
  success: boolean;
  error?: string;
  call?: {
    _id: string;
    callType: 'AUDIO' | 'VIDEO';
    userId: string;
    telecallerId: string;
    roomName: string;
  };
  caller?: UserCallDetails;
  userSocketId?: string;
  telecallerSocketId?: string;
  userLiveKit?: LiveKitCredentials;
  telecallerLiveKit?: LiveKitCredentials;
};

export interface CallEndResult {
  success: boolean;
  error?: string;
  otherPartySocketId?: string;
  telecallerId?: string;
};

// ============================================
// Helper Functions
// ============================================

const isValidObjectId = (id: string): boolean => Types.ObjectId.isValid(id);

const calculateDuration = (acceptedAt: Date): number => {
  const now = new Date();
  const durationMs = now.getTime() - acceptedAt.getTime();
  return Math.floor(durationMs / 1000);
};

const createErrorResult = <T extends { success: boolean; error?: string }>(error: string): T => {
  return { success: false, error } as T;
};

// ============================================
// Timer Management
// ============================================

const callTimers = new Map<string, NodeJS.Timeout>();

export const startCallTimer = (callId: string, userId: string, telecallerId: string): void => {
  const timer = setTimeout(async () => {
    console.log(`⏰ Call timer expired: ${callId}`);
    await handleMissedCall(callId, userId, telecallerId);
  }, 30000);

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
      .findOneAndUpdate({ _id: callId, status: 'RINGING' }, { $set: { status: 'MISSED' } }, { new: true })
      .lean();

    if (!call) {
      console.log(`⏰ Call ${callId} no longer RINGING, skipping missed`);
      return;
    }

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
// Cleanup Stale Ringing Calls (Server Startup)
// ============================================

export const cleanupStaleRingingCalls = async (): Promise<void> => {
  try {
    const staleTime = new Date(Date.now() - 30000);

    const result = await CallModel.updateMany(
      { status: 'RINGING', createdAt: { $lt: staleTime } },
      { $set: { status: 'MISSED' } }
    );

    console.log(`🧹 Cleaned up ${result.modifiedCount} stale RINGING call(s)`);
  } catch (error) {
    console.error('❌ Failed to cleanup stale RINGING calls:', error);
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
// Initiate Call
// ============================================

export const initiateCall = async (userId: string, telecallerId: string, callType: 'AUDIO' | 'VIDEO'): Promise<CallInitiateResult> => {
  try {
    if (!isValidObjectId(userId) || !isValidObjectId(telecallerId)) {
      return createErrorResult('Something went wrong. Please try again.');
    }

    const [existingUserCall, existingTelecallerCall, user, telecaller] = await Promise.all([
      CallModel.findOne({
        userId: userId,
        status: { $in: ['RINGING', 'ACCEPTED'] }
      }).lean(),

      CallModel.findOne({
        telecallerId: telecallerId,
        status: { $in: ['RINGING', 'ACCEPTED'] }
      }).lean(),

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

    if (existingUserCall) {
      return createErrorResult('You already have an active call.');
    }

    if (existingTelecallerCall) {
      return createErrorResult('This person is busy. Please try again later.');
    }

    if (!user) {
      return createErrorResult('Your account is not available. Please contact support.');
    };
    if (!telecaller) {
      return createErrorResult('This person is no longer available for calls.');
    };

    const telecallerName = telecaller.name || 'This person';
    const telecallerPresence = telecaller.telecallerProfile.presence;

    if (telecallerPresence === 'OFFLINE') {
      return createErrorResult(`${telecallerName} is currently offline. Please try again later.`);
    }

    if (telecallerPresence === 'ON_CALL') {
      return createErrorResult(`${telecallerName} is busy on another call. Please try again later.`);
    }

    const telecallerSocketId = getSocketId('TELECALLER', telecallerId);

    if (!telecallerSocketId) {
      return createErrorResult(`${telecallerName} is currently unavailable. Please try again later.`);
    }

    const call = await CallModel.create({
      userId: new Types.ObjectId(userId),
      telecallerId: new Types.ObjectId(telecallerId),
      callType,
      status: 'RINGING'
    });

    const callId = call._id.toString();
    const roomName = callId;

    console.log(`📞 Call initiated: ${callId} | Room: ${roomName} | ${userId} → ${telecallerId} | ${callType}`);
    startCallTimer(callId, userId, telecallerId);

    return {
      success: true,
      callId: callId,
      roomName: roomName,
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
    return createErrorResult('Something went wrong. Please try again.');
  }
};

// ============================================
// Accept Call
// ============================================

export const acceptCall = async (telecallerId: string, callId: string): Promise<CallActionResult> => {
  try {
    if (!isValidObjectId(callId) || !isValidObjectId(telecallerId)) {
      return createErrorResult('Something went wrong. Please try again.');
    }

    // Step 1: Validate call exists and is RINGING (read only)
    const existingCall = await CallModel
      .findOne({ _id: callId, telecallerId: telecallerId, status: 'RINGING' })
      .lean();

    if (!existingCall) {
      return createErrorResult('Call not found or already ended.');
    }

    const roomName = existingCall._id.toString();

    // Step 2: Get details and generate tokens in parallel
    let userLiveKit: LiveKitCredentials;
    let telecallerLiveKit: LiveKitCredentials;
    let caller: UserCallDetails | null;

    try {
      const [callerDetails, telecallerDetails] = await Promise.all([
        getUserDetailsForCall(existingCall.userId.toString()),
        getTelecallerDetailsForCall(telecallerId)
      ]);

      caller = callerDetails;

      [userLiveKit, telecallerLiveKit] = await Promise.all([
        generateLiveKitToken({
          roomName: roomName,
          participantId: existingCall.userId.toString(),
          participantName: callerDetails?.name || 'Unknown User',
        }),
        generateLiveKitToken({
          roomName: roomName,
          participantId: telecallerId,
          participantName: telecallerDetails?.name || 'Unknown Telecaller',
        }),
      ]);
    } catch (tokenError) {
      console.error('❌ Failed to generate LiveKit tokens:', tokenError);
      return createErrorResult('Failed to setup call. Please try again.');
    }

    // Step 3: Update call status to ACCEPTED (with status re-check)
    const call = await CallModel
      .findOneAndUpdate(
        { _id: callId, telecallerId: telecallerId, status: 'RINGING' },
        { $set: { status: 'ACCEPTED', acceptedAt: new Date() } },
        { new: true }
      ).lean();

    if (!call) {
      return createErrorResult('Call is no longer available.');
    }

    // Step 4: Clear timer
    clearCallTimer(callId);

    // Step 5: Update presence to ON_CALL
    await UserModel.updateOne(
      { _id: telecallerId, role: 'TELECALLER' },
      { $set: { 'telecallerProfile.presence': 'ON_CALL' } }
    );

    const userSocketId = getSocketId('USER', call.userId.toString());

    console.log(`📞 Call accepted: ${callId} | Telecaller: ${telecallerId}`);

    return {
      success: true,
      call: {
        _id: callId,
        callType: call.callType,
        userId: call.userId.toString(),
        telecallerId: telecallerId,
        roomName: roomName
      },
      caller: caller || { _id: call.userId.toString(), name: 'Unknown', profile: null },
      userSocketId: userSocketId,
      userLiveKit,
      telecallerLiveKit,
    };
  } catch (error) {
    console.error('❌ Error accepting call:', error);
    return createErrorResult('Failed to accept call. Please try again.');
  }
};

// ============================================
// Reject Call
// ============================================

export const rejectCall = async (telecallerId: string, callId: string): Promise<CallActionResult> => {
  try {
    if (!isValidObjectId(callId) || !isValidObjectId(telecallerId)) {
      return createErrorResult('Something went wrong. Please try again.');
    }

    const call = await CallModel
      .findOneAndUpdate({ _id: callId, telecallerId: telecallerId, status: 'RINGING' }, { $set: { status: 'REJECTED' } }, { new: false })
      .lean();

    if (!call) {
      return createErrorResult('Call not found or already ended.');
    }

    clearCallTimer(callId);

    const userSocketId = getSocketId('USER', call.userId.toString());
    const roomName = call._id.toString();

    console.log(`📞 Call rejected: ${callId} | Telecaller: ${telecallerId}`);

    return {
      success: true,
      call: {
        _id: callId,
        callType: call.callType,
        userId: call.userId.toString(),
        telecallerId: telecallerId,
        roomName: roomName
      },
      userSocketId: userSocketId
    };
  } catch (error) {
    console.error('❌ Error rejecting call:', error);
    return createErrorResult('Failed to reject call. Please try again.');
  }
};

// ============================================
// Cancel Call (User cancels during RINGING)
// ============================================

export const cancelCall = async (userId: string, callId: string): Promise<CallActionResult> => {
  try {
    if (!isValidObjectId(callId) || !isValidObjectId(userId)) {
      return createErrorResult('Something went wrong. Please try again.');
    }

    const call = await CallModel
      .findOneAndUpdate({ _id: callId, userId: userId, status: 'RINGING' }, { $set: { status: 'MISSED' } }, { new: false })
      .lean();

    if (!call) {
      return createErrorResult('Call not found or already ended.');
    };

    clearCallTimer(callId);

    const telecallerSocketId = getSocketId('TELECALLER', call.telecallerId.toString());
    const roomName = call._id.toString();

    console.log(`📞 Call cancelled by user: ${callId} | User: ${userId}`);

    return {
      success: true,
      call: {
        _id: callId,
        callType: call.callType,
        userId: userId,
        telecallerId: call.telecallerId.toString(),
        roomName: roomName
      },
      telecallerSocketId
    };
  } catch (error) {
    console.error('❌ Error cancelling call:', error);
    return createErrorResult('Failed to cancel call. Please try again.');
  }
};

// ============================================
// End Call (During active call)
// ============================================

export const endCall = async (callId: string, endedBy: 'USER' | 'TELECALLER', enderId: string): Promise<CallEndResult> => {
  try {
    if (!isValidObjectId(callId)) {
      return createErrorResult('Invalid call ID.');
    }

    const query = endedBy === 'USER'
      ? { _id: callId, userId: enderId, status: 'ACCEPTED' }
      : { _id: callId, telecallerId: enderId, status: 'ACCEPTED' };

    const call = await CallModel.findOne(query).lean();

    if (!call) {
      return createErrorResult('Call not found or already ended.');
    }

    const duration = call.acceptedAt ? calculateDuration(call.acceptedAt) : 0;

    // Run both updates in parallel
    await Promise.all([
      CallModel.updateOne(
        { _id: callId },
        { $set: { status: 'COMPLETED', endedAt: new Date(), durationInSeconds: duration } }
      ),
      UserModel.updateOne(
        { _id: call.telecallerId, role: 'TELECALLER' },
        { $set: { 'telecallerProfile.presence': 'ONLINE' } }
      )
    ]);

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
    return createErrorResult('Failed to end call.');
  }
};

// ============================================
// Handle User Disconnect During Call
// ============================================

export const handleUserDisconnectDuringCall = async (userId: string): Promise<void> => {
  try {
    const [activeCall, ringingCall] = await Promise.all([
      CallModel.findOne({ userId: userId, status: 'ACCEPTED' }).lean(),
      CallModel.findOne({ userId: userId, status: 'RINGING' }).lean()
    ]);

    // Handle ACCEPTED (active) call - priority over ringing
    if (activeCall) {
      const callId = activeCall._id.toString();
      const telecallerId = activeCall.telecallerId.toString();
      const duration = activeCall.acceptedAt ? calculateDuration(activeCall.acceptedAt) : 0;

      await Promise.all([
        CallModel.updateOne(
          { _id: callId },
          { $set: { status: 'COMPLETED', endedAt: new Date(), durationInSeconds: duration } }
        ),
        UserModel.updateOne(
          { _id: telecallerId, role: 'TELECALLER' },
          { $set: { 'telecallerProfile.presence': 'ONLINE' } }
        )
      ]);

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

    // Handle RINGING call
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

// ============================================
// Handle Telecaller Disconnect During Call
// ============================================

export const handleTelecallerDisconnectDuringCall = async (telecallerId: string): Promise<void> => {
  try {
    const [activeCall, ringingCall] = await Promise.all([
      CallModel.findOne({ telecallerId: telecallerId, status: 'ACCEPTED' }).lean(),
      CallModel.findOne({ telecallerId: telecallerId, status: 'RINGING' }).lean()
    ]);

    // Handle ACCEPTED (active) call - priority over ringing
    if (activeCall) {
      const callId = activeCall._id.toString();
      const duration = activeCall.acceptedAt ? calculateDuration(activeCall.acceptedAt) : 0;

      await CallModel.updateOne(
        { _id: callId },
        { $set: { status: 'COMPLETED', endedAt: new Date(), durationInSeconds: duration } }
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

    // Handle RINGING call
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