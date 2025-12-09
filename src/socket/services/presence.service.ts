type PresenceRoleType = 'USER' | 'TELECALLER';

const onlineUsers = new Map<string, string>();       // userId -> socketId
const onlineTelecallers = new Map<string, string>(); // userId -> socketId

export const setOnline = (type: PresenceRoleType, userId: string, socketId: string): void => {
  const map = type === 'USER' ? onlineUsers : onlineTelecallers;
  map.set(userId, socketId);
};

export const setOffline = (type: PresenceRoleType, userId: string): void => {
  const map = type === 'USER' ? onlineUsers : onlineTelecallers;
  map.delete(userId);
};

export const getOnlineCount = (type: PresenceRoleType): number => {
  const map = type === 'USER' ? onlineUsers : onlineTelecallers;
  return map.size;
};