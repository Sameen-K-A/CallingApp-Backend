import UserModel from "../../models/user.model";
import { ITelecaller } from "../../types/telecaller";
import { getIOInstance } from '../index';
import { TelecallerBroadcastData, TelecallerPresenceChangePayload } from '../types/user.events';

type PresenceRoleType = 'USER' | 'TELECALLER';

const onlineUsers = new Map<string, string>();       // userId -> socketId
const onlineTelecallers = new Map<string, string>(); // userId -> socketId

const getMap = (type: PresenceRoleType): Map<string, string> => {
  return type === 'USER' ? onlineUsers : onlineTelecallers;
};

// ============================================
// In-Memory Operations
// ============================================

export const setOnline = (type: PresenceRoleType, userId: string, socketId: string): void => {
  getMap(type).set(userId, socketId);
};

export const setOffline = (type: PresenceRoleType, userId: string): void => {
  getMap(type).delete(userId);
};

export const getOnlineCount = (type: PresenceRoleType): number => {
  return getMap(type).size;
};

export const getSocketId = (type: PresenceRoleType, userId: string): string | undefined => {
  return getMap(type).get(userId);
};

export const isOnline = (type: PresenceRoleType, userId: string): boolean => {
  return getMap(type).has(userId);
};

export const getAllOnlineUserIds = (type: PresenceRoleType): string[] => {
  return Array.from(getMap(type).keys());
};

export const getAllOnlineSocketIds = (type: PresenceRoleType): string[] => {
  return Array.from(getMap(type).values());
};

// ============================================
// Database Operations
// ============================================

export const updateTelecallerPresenceInDB = async (userId: string, presence: ITelecaller["telecallerProfile"]["presence"]): Promise<boolean> => {
  try {
    const result = await UserModel.updateOne(
      { _id: userId, role: 'TELECALLER' },
      { $set: { 'telecallerProfile.presence': presence } }
    );

    if (result.matchedCount === 0) {
      console.error(`⚠️ Presence update failed: Telecaller ${userId} not found`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ DB error updating presence for ${userId}:`, error);
    return false;
  }
};

export const resetAllTelecallerPresence = async (): Promise<void> => {
  try {
    const result = await UserModel.updateMany(
      { role: 'TELECALLER', 'telecallerProfile.presence': { $ne: 'OFFLINE' } },
      { $set: { 'telecallerProfile.presence': 'OFFLINE' } }
    );

    console.log(`🧹 Reset ${result.modifiedCount} telecaller(s) presence to OFFLINE`);

    // Clear in-memory maps
    onlineTelecallers.clear();
    onlineUsers.clear();
  } catch (error) {
    console.error('❌ Failed to reset telecaller presence:', error);
    throw error;
  }
};

// ============================================
// Telecaller Details for Broadcast
// ============================================

export const getTelecallerDetailsForBroadcast = async (userId: string): Promise<TelecallerBroadcastData | null> => {
  try {
    const telecaller = await UserModel
      .findOne({
        _id: userId,
        role: 'TELECALLER',
        accountStatus: 'ACTIVE',
        'telecallerProfile.approvalStatus': 'APPROVED'
      }, {
        _id: 1, name: 1, profile: 1, language: 1, 'telecallerProfile.about': 1
      })
      .lean();

    if (!telecaller) {
      return null;
    }

    return {
      _id: telecaller._id.toString(),
      name: telecaller.name || '',
      profile: telecaller.profile || null,
      language: telecaller.language || '',
      about: (telecaller as any).telecallerProfile?.about || '',
    };
  } catch (error) {
    console.error(`❌ Error fetching telecaller details for broadcast:`, error);
    return null;
  }
};

// ============================================
// Broadcast Operations
// ============================================

export const broadcastPresenceToUsers = (payload: TelecallerPresenceChangePayload): void => {
  try {
    const io = getIOInstance();
    const userNamespace = io.of('/user');

    userNamespace.emit('telecaller:presence-changed', payload);

    console.log(`📡 Broadcasted presence change: ${payload.telecallerId} -> ${payload.presence}`);
  } catch (error) {
    console.error('❌ Error broadcasting presence to users:', error);
  }
};