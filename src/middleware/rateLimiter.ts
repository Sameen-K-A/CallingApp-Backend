import { RateLimiterRedis } from 'rate-limiter-flexible';
import redis from '../config/redis.config';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errors/ApiError';

// Limit: 5 calls per minute per user
export const callInitiateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'limit:call_initiate',
  points: 5,
  duration: 60,   // Per 60 seconds
});

// Call Action Limiter (Accept/Reject/End/Cancel)
// Limit: 20 actions per minute (generous but prevents rapid spam)
export const callActionLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'limit:call_action',
  points: 20,
  duration: 60,
});

// Socket Connection Limiter (Prevent connection floods)
// Limit: 10 connections per minute per IP (handled at handshake)
export const connectionLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'limit:connection',
  points: 10,
  duration: 60,
});

// OTP Send/Resend Limiter
// Limit: 5 requests per 15 minutes per phone number
const otpRequestLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'limit:otp_request',
  points: 5,
  duration: 15 * 60,
});

// OTP Verify Limiter
// Limit: 10 attempts per 15 minutes per phone number
const otpVerifyLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'limit:otp_verify',
  points: 10,
  duration: 15 * 60,
});

// IP-based limiter for additional protection
// Limit: 20 requests per 15 minutes per IP
const ipLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'limit:ip',
  points: 20,
  duration: 15 * 60,
});

export const rateLimitOtpRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const phone = req.body.phone;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    // Check both phone and IP limits
    await Promise.all([
      otpRequestLimiter.consume(phone),
      ipLimiter.consume(ip)
    ]);

    next();
  } catch (error) {
    next(new ApiError(429, 'Too many requests. Please try again later.'));
  }
};

export const rateLimitOtpVerify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const phone = req.body.phone;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    // Check both phone and IP limits
    await Promise.all([
      otpVerifyLimiter.consume(phone),
      ipLimiter.consume(ip)
    ]);

    next();
  } catch (error) {
    next(new ApiError(429, 'Too many attempts. Please try again later.'));
  }
};