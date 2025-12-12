import { MessagePayload } from './user.events';

// Presence Related Payloads
export interface OnlineCountsPayload {
  onlineUsers: number;
  onlineTelecallers: number;
  timestamp: Date;
};

// ============================================
// Server → Admin Events
// ============================================
export interface ServerToAdminEvents {
  'error': (data: MessagePayload) => void;
  'presence:counts': (data: OnlineCountsPayload) => void;
};

// ============================================
// Admin → Server Events
// ============================================
export interface AdminToServerEvents {
  'presence:request-counts': () => void;
};

// ============================================
// Socket Data (attached to each admin socket)
// ============================================
export interface AdminSocketData {
  userId: string;
  role: 'ADMIN';
};