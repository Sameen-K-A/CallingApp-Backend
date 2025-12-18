import { RateLimiterRedis } from 'rate-limiter-flexible';
import redis from '../config/redis.config';

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