import { CallIdPayload, MessagePayload } from './user.events';

// Caller Related Payloads
export interface CallerBasicInfo {
  _id: string;
  name: string;
  profile: string | null;
};

// Call Related Payloads
// Server → Telecaller: Incoming call from user ========== & =========== Server → Telecaller: Call accepted confirmation with details
export interface CallDetailsPayload {
  callId: string;
  callType: 'AUDIO' | 'VIDEO';
  caller: CallerBasicInfo;
};

// ============================================
// Server → Telecaller Events
// ============================================
export interface ServerToTelecallerEvents {
  'error': (data: MessagePayload) => void;
  'call:incoming': (data: CallDetailsPayload) => void;
  'call:accepted': (data: CallDetailsPayload) => void;
  'call:missed': (data: CallIdPayload) => void;
  'call:cancelled': (data: CallIdPayload) => void;
  'call:ended': (data: CallIdPayload) => void;
};

// ============================================
// Telecaller → Server Events
// ============================================
export interface TelecallerToServerEvents {
  'call:accept': (data: CallIdPayload) => void;
  'call:reject': (data: CallIdPayload) => void;
  'call:end': (data: CallIdPayload) => void;
};

// ============================================
// Socket Data (attached to each telecaller socket)
// ============================================
export interface TelecallerSocketData {
  userId: string;
  role: 'TELECALLER';
};