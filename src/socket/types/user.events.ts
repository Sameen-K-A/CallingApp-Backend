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

// ============================= Server → User Events ========================
export interface ServerToUserEvents {
  'error': (data: { message: string }) => void;
  'telecaller:presence-changed': (data: TelecallerPresenceChangePayload) => void;
};

// ============================= User → Server Events ========================
export interface UserToServerEvents {

};



// ============================= Socket Data (attached to each user socket) ========================
export interface UserSocketData {
  userId: string;
  role: 'USER';
};