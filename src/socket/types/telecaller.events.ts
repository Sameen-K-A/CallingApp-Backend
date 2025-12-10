export interface CallIncomingPayload {    // Server → Client: Incoming call from user
  callId: string;
  callType: 'AUDIO' | 'VIDEO';
  caller: {
    _id: string;
    name: string;
    profile: string | null;
  };
};

// Server → Tele caller Events
export interface ServerToTelecallerEvents {
  'error': (data: { message: string }) => void;
  'call:incoming': (data: CallIncomingPayload) => void;
};

// Tele caller → Server Events
export interface TelecallerToServerEvents {

};



// ============================= Socket Data (attached to each Tele caller socket) ========================
export interface TelecallerSocketData {
  userId: string;
  role: 'TELECALLER';
};