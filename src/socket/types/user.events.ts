// Base/Shared Payload Types
export interface CallIdPayload {
  callId: string;
};

export interface MessagePayload {
  message: string;
};

// Telecaller Related Payloads
export interface TelecallerBroadcastData {
  _id: string;
  name: string;
  profile: string | null;
  language: string;
  about: string;
};

export interface TelecallerBasicInfo {
  _id: string;
  name: string;
  profile: string | null;
};

export interface TelecallerPresenceChangePayload {
  telecallerId: string;
  presence: 'ONLINE' | 'OFFLINE' | 'ON_CALL';
  telecaller: TelecallerBroadcastData | null;
};

// Call Related Payloads
// User → Server: Initiate a call
export interface CallInitiatePayload {
  telecallerId: string;
  callType: 'AUDIO' | 'VIDEO';
};

// Server → User: Call is ringing
export interface CallRingingPayload {
  callId: string;
  telecaller: TelecallerBasicInfo;
};

// ============================================
// Server → User Events
// ============================================
export interface ServerToUserEvents {
  'error': (data: MessagePayload) => void;
  'telecaller:presence-changed': (data: TelecallerPresenceChangePayload) => void;
  'call:ringing': (data: CallRingingPayload) => void;
  'call:error': (data: MessagePayload) => void;
  'call:accepted': (data: CallIdPayload) => void;
  'call:rejected': (data: CallIdPayload) => void;
  'call:missed': (data: CallIdPayload) => void;
  'call:ended': (data: CallIdPayload) => void;
};

// ============================================
// User → Server Events
// ============================================
export interface UserToServerEvents {
  'call:initiate': (data: CallInitiatePayload, callback?: (response: { success: boolean; message?: string }) => void) => void;
  'call:cancel': (data: CallIdPayload) => void;
  'call:end': (data: CallIdPayload) => void;
};

// ============================================
// Socket Data (attached to each user socket)
// ============================================
export interface UserSocketData {
  userId: string;
  role: 'USER';
};