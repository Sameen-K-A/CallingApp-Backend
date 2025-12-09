import { Socket } from 'socket.io';
import { decodeToken, TokenPayload } from '../../utils/jwt';
import { ExtendedError } from 'socket.io/dist/namespace';

const getAuthTokenFromCookies = (cookieHeader?: string): string | undefined => {
  if (!cookieHeader) return;

  return cookieHeader
    .split(";")
    .map(c => c.trim())
    .find(c => c.startsWith("authenticationToken="))
    ?.split("=")[1];
};

export const socketAuthMiddleware = (socket: Socket, next: (err?: ExtendedError) => void) => {
  try {
    const cookieToken = getAuthTokenFromCookies(socket.handshake.headers.cookie);

    const token =
      cookieToken ||                   // From httpOnly cookie (ADMIN WEB)
      socket.handshake.auth.token      // From client: { auth: { token } } (MOBILE APP)

    if (!token) {
      return next(new Error('Authentication token required'));
    };

    // Verify and decode token using your existing JWT utility
    const decoded: TokenPayload = decodeToken(token as string);

    // Attach user data to socket instance
    socket.data.userId = decoded.userId;
    socket.data.role = decoded.role || 'USER';

    next();

  } catch (error: any) {
    next(new Error('Invalid or expired token'));
  }
};

// ==================================== Role-based authentication middleware =====================================
export const requireRole = (allowedRoles: Array<'ADMIN' | 'USER' | 'TELECALLER'>) => {
  return (socket: Socket, next: (err?: ExtendedError) => void) => {
    const userRole = socket.data.role;

    if (!allowedRoles.includes(userRole)) {
      return next(new Error('Access denied'));
    }

    next();
  };
};