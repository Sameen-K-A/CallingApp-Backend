import { AccessToken } from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_API_URL = process.env.LIVEKIT_API_URL;

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_API_URL) {
  throw new Error('❌ LiveKit environment variables are missing');
}

export interface LiveKitTokenPayload {
  roomName: string;
  participantId: string;
  participantName: string;
}

export interface LiveKitCredentials {
  token: string;
  url: string;
  roomName: string;
}

export const generateLiveKitToken = async (payload: LiveKitTokenPayload): Promise<LiveKitCredentials> => {
  const { roomName, participantId, participantName } = payload;

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantId,
    name: participantName,
    ttl: '1h',
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();

  return {
    token,
    url: LIVEKIT_API_URL!,
    roomName,
  };
};