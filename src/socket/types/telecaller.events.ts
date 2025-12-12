export interface CallIncomingPayload {    // Server → Client: Incoming call from user
  callId: string;
  callType: 'AUDIO' | 'VIDEO';
  caller: {
    _id: string;
    name: string;
    profile: string | null;
  };
};

export interface CallAcceptPayload {
  callId: string;
};

export interface CallRejectPayload {
  callId: string;
};

export interface CallAcceptedPayload {
  callId: string;
  callType: 'AUDIO' | 'VIDEO';
  caller: {
    _id: string;
    name: string;
    profile: string | null;
  };
};

export interface CallMissedPayload {
  callId: string;
};

export interface CallCancelledPayload {
  callId: string;
};

// Server → Tele caller Events
export interface ServerToTelecallerEvents {
  'error': (data: { message: string }) => void;
  'call:incoming': (data: CallIncomingPayload) => void;
  'call:accepted': (data: CallAcceptedPayload) => void;
  'call:missed': (data: CallMissedPayload) => void;
  'call:cancelled': (data: CallCancelledPayload) => void;
};

// Tele caller → Server Events
export interface TelecallerToServerEvents {
  'call:accept': (data: CallAcceptPayload) => void;
  'call:reject': (data: CallRejectPayload) => void;
};



// ============================= Socket Data (attached to each Tele caller socket) ========================
export interface TelecallerSocketData {
  userId: string;
  role: 'TELECALLER';
};