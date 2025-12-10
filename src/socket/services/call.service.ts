import { Types } from 'mongoose';
import UserModel from '../../models/user.model';
import CallModel from '../../models/call.model';
import { getSocketId } from './presence.service';
import { ITelecaller } from '../../types/telecaller';

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