import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../middleware/errors/ApiError'

export interface TokenPayload {
  userId: string
  phone: string
  role?: 'TELECALLER' | 'ADMIN'
};

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: 'TELECALLER' | 'ADMIN';
    }
  }
};

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not defined in environment')
  return secret
};

export const createToken = (userId: string, phone: string, role?: 'TELECALLER' | 'ADMIN'): string => {
  const payload: TokenPayload = { userId, phone }
  if (role === 'TELECALLER' || role === 'ADMIN') {
    payload.role = role
  }
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' })
};

export const decodeToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, getSecret()) as TokenPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'Token has expired')
    }
    throw new ApiError(401, 'Invalid token')
  }
};

export const authenticate = (requiredRole?: 'TELECALLER' | 'ADMIN') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies['authenticationToken'] || req.headers.authorization?.replace('Bearer ', '')
      if (!token) {
        throw new ApiError(401, 'Authentication token is required.')
      };

      const decoded = decodeToken(token);

      if (requiredRole && decoded.role !== requiredRole) {
        throw new ApiError(403, `Access denied. Requires ${requiredRole} role.`)
      };

      req.userId = decoded.userId
      req.userRole = decoded.role

      next()
    } catch (error) {
      next(error)
    }
  };

};