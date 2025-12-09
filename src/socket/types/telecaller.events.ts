
// Server → Tele caller Events
export interface ServerToTelecallerEvents {
  'error': (data: { message: string }) => void;
};

// Tele caller → Server Events
export interface TelecallerToServerEvents {

};



// ============================= Socket Data (attached to each Tele caller socket) ========================
export interface TelecallerSocketData {
  userId: string;
  role: 'TELECALLER';
};