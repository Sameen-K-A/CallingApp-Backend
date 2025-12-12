export interface TelecallerBroadcastData {    // Telecaller Broadcast Data (sent when telecaller comes online)
  _id: string;
  name: string;
  profile: string | null;
  language: string;
  about: string;
};

export interface TelecallerPresenceChangePayload {  // Presence Change Payload
  telecallerId: string;
  presence: 'ONLINE' | 'OFFLINE' | 'ON_CALL';
  telecaller: TelecallerBroadcastData | null;
};

export interface CallInitiatePayload {    // Client → Server: User initiates a call
  telecallerId: string;
  callType: 'AUDIO' | 'VIDEO';
};

export interface CallRingingPayload {     // Server → Client: Call is ringing on telecaller's side
  callId: string;
  telecaller: {
    _id: string;
    name: string;
    profile: string | null;
  };
};

export interface CallErrorPayload {   // Server → Client: Call initiation failed
  message: string;
};

export interface CallAcceptedPayload {
  callId: string;
};

export interface CallRejectedPayload {
  callId: string;
};

export interface CallCancelPayload {
  callId: string;
}

export interface CallMissedPayload {
  callId: string;
}

export interface CallEndPayload {
  callId: string;
}

export interface CallEndedPayload {
  callId: string;
}

// ============================= Server → User Events ========================
export interface ServerToUserEvents {
  'error': (data: { message: string }) => void;
  'telecaller:presence-changed': (data: TelecallerPresenceChangePayload) => void;
  'call:ringing': (data: CallRingingPayload) => void;
  'call:error': (data: CallErrorPayload) => void;
  'call:accepted': (data: CallAcceptedPayload) => void;
  'call:rejected': (data: CallRejectedPayload) => void;
  'call:missed': (data: CallMissedPayload) => void;
  'call:ended': (data: CallEndedPayload) => void;
};

// ============================= User → Server Events ========================
export interface UserToServerEvents {
  'call:initiate': (data: CallInitiatePayload, callback?: (response: { success: boolean; message?: string }) => void) => void;
  'call:cancel': (data: CallCancelPayload) => void;
  'call:end': (data: CallEndPayload) => void;
};



// ============================= Socket Data (attached to each user socket) ========================
export interface UserSocketData {
  userId: string;
  role: 'USER';
};