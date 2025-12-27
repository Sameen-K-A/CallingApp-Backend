import { Socket } from 'socket.io';
import { decodeToken, TokenPayload } from '../../utils/jwt';
import { ExtendedError } from 'socket.io/dist/namespace';
import { connectionLimiter } from '../../middleware/rateLimiter';
import UserModel from '../../models/user.model';
import { isTelecaller } from '../../utils/guards';

const getAuthTokenFromCookies = (cookieHeader?: string): string | undefined => {
  if (!cookieHeader) return;

  return cookieHeader
    .split(";")
    .map(c => c.trim())
    .find(c => c.startsWith("authenticationToken="))
    ?.split("=")[1];
};

export const socketAuthMiddleware = async (socket: Socket, next: (err?: ExtendedError) => void) => {
  try {
    // Connection rate limiting by IP
    const clientIp = socket.handshake.address || 'unknown';
    try {
      await connectionLimiter.consume(clientIp);
    } catch (rateLimitError) {
      return next(new Error('Too many connection attempts. Please wait.'));
    }

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

// ==================================== Account status check middleware =====================================
export const requireActiveAccount = async (socket: Socket, next: (err?: ExtendedError) => void) => {
  try {
    const userId = socket.data.userId;
    const role = socket.data.role;

    // Skip for ADMIN - they don't have accountStatus
    if (role === 'ADMIN') {
      return next();
    }

    const user = await UserModel.findById(userId).select('accountStatus').lean();

    if (!user) {
      return next(new Error('Account not found'));
    }

    if (user.accountStatus === 'SUSPENDED') {
      return next(new Error('Account suspended. Please contact support.'));
    }

    next();
  } catch (error) {
    next(new Error('Failed to verify account status'));
  }
};

// ==================================== Telecaller approval check middleware =====================================
export const requireApprovedTelecaller = async (socket: Socket, next: (err?: ExtendedError) => void) => {
  try {
    const userId = socket.data.userId;

    const user = await UserModel.findById(userId).select('role telecallerProfile.approvalStatus').lean();

    if (!user) {
      return next(new Error('Account not found'));
    }

    if (!isTelecaller(user as any)) {
      return next(new Error('Invalid account type'));
    }

    const approvalStatus = (user as any).telecallerProfile?.approvalStatus;

    if (approvalStatus !== 'APPROVED') {
      return next(new Error('Account not approved. Please wait for admin approval.'));
    }

    next();
  } catch (error) {
    next(new Error('Failed to verify approval status'));
  }
};