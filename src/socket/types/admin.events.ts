
// Server → Admin Events
export interface ServerToAdminEvents {
  'presence:counts': (data: OnlineCountsPayload) => void;
  'error': (data: { message: string }) => void;
};

// Admin → Server Events
export interface AdminToServerEvents {
  'presence:request-counts': () => void;
};




// ============================================ Payload Types ========================================
export interface OnlineCountsPayload {
  onlineUsers: number;
  onlineTelecallers: number;
  timestamp: Date;
}

// ============================= Socket Data (attached to each admin socket) ========================
export interface AdminSocketData {
  userId: string;
  role: 'ADMIN';
}