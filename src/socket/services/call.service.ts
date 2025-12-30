import { Types } from 'mongoose';
import UserModel from '../../models/user.model';
import CallModel from '../../models/call.model';
import { getSocketId } from './presence.service';
import { getIOInstance } from '..';
import { destroyLiveKitRoom } from '../../services/livekit.service';
import { generateLiveKitToken, LiveKitCredentials } from '../../services/livekit.service';
import { isLeanTelecaller } from '../../utils/guards';

// Call timer duration in milliseconds
const CALL_TIMER_DURATION_MS = 30 * 1000;

// Store active timers (for cleanup if needed)
const activeTimers = new Map<string, NodeJS.Timeout>();

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

type SocketNamespace = '/user' | '/telecaller';

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

const emitToSocket = (namespace: SocketNamespace, socketId: string | null, event: string, payload: object): void => {
  if (!socketId) return;

  const io = getIOInstance();
  io.of(namespace).to(socketId).emit(event, payload);
};

// ============================================
// Timer Management
// ============================================

const handleMissedCall = async (callId: string, userId: string, telecallerId: string): Promise<void> => {
  try {
    // Remove from active timers
    activeTimers.delete(callId);

    const call = await CallModel
      .findOneAndUpdate({ _id: callId, status: 'RINGING' }, { $set: { status: 'MISSED' } }, { new: true })
      .lean();

    if (!call) {
      console.log(`⏰ Call ${callId} no longer RINGING, skipping missed`);
      return;
    }

    console.log(`📞 Call marked as MISSED: ${callId}`);

    const userSocketId = getSocketId('USER', userId);
    const telecallerSocketId = getSocketId('TELECALLER', telecallerId);

    emitToSocket('/user', userSocketId, 'call:missed', { callId });
    emitToSocket('/telecaller', telecallerSocketId, 'call:missed', { callId });

  } catch (error) {
    console.error('❌ Error handling missed call:', error);
  }
};

export const startCallTimer = (callId: string, userId: string, telecallerId: string): void => {
  const timer = setTimeout(() => {
    handleMissedCall(callId, userId, telecallerId);
  }, CALL_TIMER_DURATION_MS);

  activeTimers.set(callId, timer);
  console.log(`⏰ Started ${CALL_TIMER_DURATION_MS / 1000}s timer for call: ${callId}`);
};

export const clearCallTimer = (callId: string): void => {
  const timer = activeTimers.get(callId);
  if (timer) {
    clearTimeout(timer);
    activeTimers.delete(callId);
    console.log(`⏰ Cleared timer for call: ${callId}`);
  }
};

// ============================================
// Cleanup Stale Ringing Calls (Server Startup)
// ============================================

export const cleanupStaleRingingCalls = async (): Promise<void> => {
  try {
    const staleTime = new Date(Date.now() - CALL_TIMER_DURATION_MS);

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
      console.warn(`⚠️ initiateCall: Invalid ObjectId - userId: ${userId}, telecallerId: ${telecallerId}`);
      return createErrorResult('Something went wrong. Please try again.');
    }

    const [user, telecallerDoc] = await Promise.all([
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
        .lean()
    ]);

    if (!user) {
      console.warn(`⚠️ initiateCall: User not found or inactive - userId: ${userId}`);
      return createErrorResult('Your account is not available. Please contact support.');
    };

    if (!telecallerDoc) {
      console.warn(`⚠️ initiateCall: Telecaller not found - telecallerId: ${telecallerId}`);
      return createErrorResult('This person is no longer available for calls.');
    };

    // Use lean type guard for proper type narrowing
    if (!isLeanTelecaller(telecallerDoc)) {
      console.warn(`⚠️ initiateCall: Invalid telecaller data - telecallerId: ${telecallerId}`);
      return createErrorResult('This person is no longer available for calls.');
    }

    const telecallerName = telecallerDoc.name || 'This person';
    const telecallerPresence = telecallerDoc.telecallerProfile.presence;

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

    // TRY to create - MongoDB index will reject duplicates
    let call;
    try {
      call = await CallModel.create({
        userId: new Types.ObjectId(userId),
        telecallerId: new Types.ObjectId(telecallerId),
        callType,
        status: 'RINGING'
      });
    } catch (error: any) {
      if (error.code === 11000) { // Duplicate key error (code 11000) = concurrent call exists
        if (error.keyPattern?.userId) {
          return createErrorResult('You already have an active call.');
        }
        if (error.keyPattern?.telecallerId) {
          return createErrorResult(`${telecallerName} is busy. Please try again.`);
        }
        return createErrorResult('Unable to connect. Please try again.');
      }
      throw error;
    }

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
        name: telecallerDoc.name || 'Unknown',
        profile: telecallerDoc.profile || null,
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
      console.warn(`⚠️ acceptCall: Invalid ObjectId - callId: ${callId}, telecallerId: ${telecallerId}`);
      return createErrorResult('Something went wrong. Please try again.');
    }

    const call = await CallModel.findOneAndUpdate(
      { _id: callId, telecallerId: telecallerId, status: 'RINGING' },
      { $set: { status: 'ACCEPTED', acceptedAt: new Date() } },
      { new: true }
    ).lean();

    if (!call) {
      console.warn(`⚠️ acceptCall: Call not found or not RINGING - callId: ${callId}, telecallerId: ${telecallerId}`);
      return createErrorResult('Call is no longer available.');
    }

    clearCallTimer(callId);

    const roomName = call._id.toString();

    let userLiveKit: LiveKitCredentials;
    let telecallerLiveKit: LiveKitCredentials;
    let caller: UserCallDetails | null;

    try {
      const [callerDetails, telecallerDetails] = await Promise.all([
        getUserDetailsForCall(call.userId.toString()),
        getTelecallerDetailsForCall(telecallerId)
      ]);

      caller = callerDetails;

      [userLiveKit, telecallerLiveKit] = await Promise.all([
        generateLiveKitToken({
          roomName: roomName,
          participantId: call.userId.toString(),
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

      // Rollback in parallel since operations are independent
      await Promise.all([
        CallModel.updateOne(
          { _id: callId },
          { $set: { status: 'MISSED', endedAt: new Date() } }
        ),
        UserModel.updateOne(
          { _id: telecallerId, role: 'TELECALLER' },
          { $set: { 'telecallerProfile.presence': 'ONLINE' } }
        )
      ]);

      return createErrorResult('Failed to setup call. Please try again.');
    }

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
      userSocketId: userSocketId || undefined,
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
      console.warn(`⚠️ rejectCall: Invalid ObjectId - callId: ${callId}, telecallerId: ${telecallerId}`);
      return createErrorResult('Something went wrong. Please try again.');
    }

    const call = await CallModel
      .findOneAndUpdate({ _id: callId, telecallerId: telecallerId, status: 'RINGING' }, { $set: { status: 'REJECTED' } }, { new: false })
      .lean();

    if (!call) {
      console.warn(`⚠️ rejectCall: Call not found or not RINGING - callId: ${callId}`);
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
      userSocketId: userSocketId || undefined
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
      console.warn(`⚠️ cancelCall: Invalid ObjectId - callId: ${callId}, userId: ${userId}`);
      return createErrorResult('Something went wrong. Please try again.');
    }

    const call = await CallModel
      .findOneAndUpdate({ _id: callId, userId: userId, status: 'RINGING' }, { $set: { status: 'MISSED' } }, { new: false })
      .lean();

    if (!call) {
      console.warn(`⚠️ cancelCall: Call not found or not RINGING - callId: ${callId}, userId: ${userId}`);
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
      telecallerSocketId: telecallerSocketId || undefined
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
      console.warn(`⚠️ endCall: Invalid callId: ${callId}`);
      return createErrorResult('Invalid call ID.');
    }

    const query = endedBy === 'USER'
      ? { _id: callId, userId: enderId, status: 'ACCEPTED' }
      : { _id: callId, telecallerId: enderId, status: 'ACCEPTED' };

    const call = await CallModel.findOne(query).lean();

    if (!call) {
      console.warn(`⚠️ endCall: Call not found or not ACCEPTED - callId: ${callId}, endedBy: ${endedBy}`);
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
      ),
      destroyLiveKitRoom(call._id.toString())
    ]);

    console.log(`📞 Call ended: ${callId} | Duration: ${duration}s | Ended by: ${endedBy}`);

    const otherPartySocketId = endedBy === 'USER'
      ? getSocketId('TELECALLER', call.telecallerId.toString())
      : getSocketId('USER', call.userId.toString());

    return {
      success: true,
      otherPartySocketId: otherPartySocketId || undefined,
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
        ),
        destroyLiveKitRoom(callId),
      ]);

      console.log(`📞 Call auto-ended (user disconnected): ${callId} | Duration: ${duration}s`);

      // Notify telecaller that call ended
      const telecallerSocketId = getSocketId('TELECALLER', telecallerId);
      emitToSocket('/telecaller', telecallerSocketId, 'call:ended', { callId });

      // Broadcast to all users that telecaller is available again
      const io = getIOInstance();
      io.of('/user').emit('telecaller:presence-changed', {
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

      const telecallerSocketId = getSocketId('TELECALLER', ringingCall.telecallerId.toString());
      emitToSocket('/telecaller', telecallerSocketId, 'call:cancelled', { callId });
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

      // Run updates in parallel since they are independent
      await Promise.all([
        CallModel.updateOne(
          { _id: callId },
          { $set: { status: 'COMPLETED', endedAt: new Date(), durationInSeconds: duration } }
        ),
        destroyLiveKitRoom(callId)
      ]);

      console.log(`📞 Call auto-ended (telecaller disconnected): ${callId} | Duration: ${duration}s`);

      const userSocketId = getSocketId('USER', activeCall.userId.toString());
      emitToSocket('/user', userSocketId, 'call:ended', { callId });

      return;
    }

    // Handle RINGING call
    if (ringingCall) {
      const callId = ringingCall._id.toString();
      clearCallTimer(callId);

      await CallModel.updateOne({ _id: callId }, { $set: { status: 'MISSED' } });

      console.log(`📞 Call auto-missed (telecaller disconnected): ${callId}`);

      const userSocketId = getSocketId('USER', ringingCall.userId.toString());
      emitToSocket('/user', userSocketId, 'call:missed', { callId });
    }
  } catch (error) {
    console.error('❌ Error handling telecaller disconnect during call:', error);
  }
};