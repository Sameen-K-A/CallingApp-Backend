import UserModel from "../../models/user.model";
import { IUserDocument } from "../../types/general";
import { isTelecaller } from '../../utils/guards';
import { getIOInstance } from '../index';
import { TelecallerBroadcastData, TelecallerPresenceChangePayload } from '../types/user.events';

type PresenceRoleType = 'USER' | 'TELECALLER';
type TelecallerPresence = 'ONLINE' | 'OFFLINE' | 'ON_CALL';

// ============================================
// Socket.IO Room Names
// ============================================

export const PRESENCE_ROOMS = {
  ONLINE_USERS: 'online-users',
  ONLINE_TELECALLERS: 'online-telecallers'
} as const;

// ============================================
// In-Memory Maps for userId <-> socketId
// ============================================

// USER maps
const userSocketMap = new Map<string, string>();    // userId -> socketId
const socketUserMap = new Map<string, string>();    // socketId -> userId

// TELECALLER maps
const telecallerSocketMap = new Map<string, string>();    // telecallerId -> socketId
const socketTelecallerMap = new Map<string, string>();    // socketId -> telecallerId

// ============================================
// Presence Operations (In-Memory)
// ============================================

export const setOnline = (type: PresenceRoleType, userId: string, socketId: string): void => {
  if (type === 'USER') {
    // Clean up old socket if user reconnects with new socket
    const oldSocketId = userSocketMap.get(userId);
    if (oldSocketId && oldSocketId !== socketId) {
      socketUserMap.delete(oldSocketId);
    }
    userSocketMap.set(userId, socketId);
    socketUserMap.set(socketId, userId);
  } else {
    // Clean up old socket if telecaller reconnects with new socket
    const oldSocketId = telecallerSocketMap.get(userId);
    if (oldSocketId && oldSocketId !== socketId) {
      socketTelecallerMap.delete(oldSocketId);
    }
    telecallerSocketMap.set(userId, socketId);
    socketTelecallerMap.set(socketId, userId);
  }
};

export const setOffline = (type: PresenceRoleType, userId: string, socketId: string): void => {
  if (type === 'USER') {
    // Only remove if this socket is the current one for this user
    const currentSocketId = userSocketMap.get(userId);
    if (currentSocketId === socketId) {
      userSocketMap.delete(userId);
    }
    socketUserMap.delete(socketId);
  } else {
    // Only remove if this socket is the current one for this telecaller
    const currentSocketId = telecallerSocketMap.get(userId);
    if (currentSocketId === socketId) {
      telecallerSocketMap.delete(userId);
    }
    socketTelecallerMap.delete(socketId);
  }
};

export const getSocketId = (type: PresenceRoleType, userId: string): string | null => {
  if (type === 'USER') {
    return userSocketMap.get(userId) || null;
  }
  return telecallerSocketMap.get(userId) || null;
};

export const isOnline = (type: PresenceRoleType, userId: string): boolean => {
  const socketId = getSocketId(type, userId);
  return socketId !== null;
};

export const getOnlineCount = (type: PresenceRoleType): number => {
  try {
    const io = getIOInstance();
    const roomName = type === 'USER' ? PRESENCE_ROOMS.ONLINE_USERS : PRESENCE_ROOMS.ONLINE_TELECALLERS;
    const namespace = type === 'USER' ? '/user' : '/telecaller';

    const room = io.of(namespace).adapter.rooms.get(roomName);
    return room?.size || 0;
  } catch (error) {
    console.error(`❌ getOnlineCount error for ${type}:`, error);
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
    // Reset DB presence to OFFLINE for all telecallers
    const result = await UserModel.updateMany(
      { role: 'TELECALLER', 'telecallerProfile.presence': { $ne: 'OFFLINE' } },
      { $set: { 'telecallerProfile.presence': 'OFFLINE' } }
    );

    console.log(`🧹 Reset ${result.modifiedCount} telecaller(s) presence to OFFLINE in DB`);
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

    // Broadcast to all users
    userNamespace.to(PRESENCE_ROOMS.ONLINE_USERS).emit('telecaller:presence-changed', payload);

    console.log(`📡 Broadcasted presence change: ${payload.telecallerId} -> ${payload.presence}`);
  } catch (error) {
    console.error('❌ Error broadcasting presence to users:', error);
  }
};