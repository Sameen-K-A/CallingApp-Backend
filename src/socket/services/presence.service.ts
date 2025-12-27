import redis, { REDIS_KEYS } from "../../config/redis.config";
import UserModel from "../../models/user.model";
import { IUserDocument } from "../../types/general";
import { isTelecaller } from '../../utils/guards';
import { getIOInstance } from '../index';
import { TelecallerBroadcastData, TelecallerPresenceChangePayload } from '../types/user.events';

type PresenceRoleType = 'USER' | 'TELECALLER';
type TelecallerPresence = 'ONLINE' | 'OFFLINE' | 'ON_CALL';

// ============================================
// Redis Operations
// ============================================

export const setOnline = async (type: PresenceRoleType, userId: string, socketId: string): Promise<void> => {
  try {
    const key = type === 'USER' ? REDIS_KEYS.USER_SOCKET(userId) : REDIS_KEYS.TELECALLER_SOCKET(userId);
    const reverseKey = type === 'USER' ? REDIS_KEYS.SOCKET_USER(socketId) : REDIS_KEYS.SOCKET_TELECALLER(socketId);

    // Set userId -> socketId
    await redis.set(key, socketId);

    // Set socketId -> userId (for disconnect handling)
    // Expire in 24 hours just in case of stale keys
    await redis.setex(reverseKey, 86400, userId);
  } catch (error) {
    console.error(`❌ Redis setOnline error for ${type} ${userId}:`, error);
  }
};

export const setOffline = async (type: PresenceRoleType, userId: string): Promise<void> => {
  try {
    const key = type === 'USER' ? REDIS_KEYS.USER_SOCKET(userId) : REDIS_KEYS.TELECALLER_SOCKET(userId);
    await redis.del(key);
  } catch (error) {
    console.error(`❌ Redis setOffline error for ${type} ${userId}:`, error);
  }
};

export const getSocketId = async (type: PresenceRoleType, userId: string): Promise<string | null> => {
  try {
    const key = type === 'USER' ? REDIS_KEYS.USER_SOCKET(userId) : REDIS_KEYS.TELECALLER_SOCKET(userId);
    return await redis.get(key);
  } catch (error) {
    console.error(`❌ Redis getSocketId error for ${type} ${userId}:`, error);
    return null;
  }
};

export const isOnline = async (type: PresenceRoleType, userId: string): Promise<boolean> => {
  try {
    const socketId = await getSocketId(type, userId);
    return socketId !== null;
  } catch (error) {
    console.error(`❌ Redis isOnline error for ${type} ${userId}:`, error);
    return false;
  }
};

export const getOnlineCount = async (type: PresenceRoleType): Promise<number> => {
  try {
    const pattern = type === 'USER' ? 'presence:user:*' : 'presence:telecaller:*';
    const keys = await redis.keys(pattern);
    return keys.length;
  } catch (error) {
    console.error(`❌ Redis getOnlineCount error for ${type}:`, error);
    return 0;
  }
};

// ============================================
// Database Operations
// ============================================

export const updateTelecallerPresenceInDB = async (userId: string, presence: TelecallerPresence): Promise<boolean> => {
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
    // 1. Reset DB
    const result = await UserModel.updateMany(
      { role: 'TELECALLER', 'telecallerProfile.presence': { $ne: 'OFFLINE' } },
      { $set: { 'telecallerProfile.presence': 'OFFLINE' } }
    );

    console.log(`🧹 Reset ${result.modifiedCount} telecaller(s) presence to OFFLINE in DB`);

    // 2. Clear Redis Presence Keys
    const keys = await redis.keys('presence:*');
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`🧹 Cleared ${keys.length} presence keys from Redis`);
    }
  } catch (error) {
    console.error('❌ Failed to reset telecaller presence:', error);
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
      .lean() as IUserDocument | null;

    if (!telecaller) {
      return null;
    }

    // Use type guard for safe access
    const about = isTelecaller(telecaller) ? telecaller.telecallerProfile.about : '';

    return {
      _id: telecaller._id.toString(),
      name: telecaller.name || '',
      profile: telecaller.profile || null,
      language: telecaller.language || '',
      about: about || '',
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