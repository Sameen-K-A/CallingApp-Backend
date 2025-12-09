
// Server → User Events
export interface ServerToUserEvents {
  'error': (data: { message: string }) => void;
};

// User → Server Events
export interface UserToServerEvents {

};



// ============================= Socket Data (attached to each user socket) ========================
export interface UserSocketData {
  userId: string;
  role: 'USER';
};