import rateLimit from 'express-rate-limit';

import { createLogger } from '../utils/logger.js';

const logger = createLogger('rate-limiter');

/**
 * Enhanced rate limiting with safe logging
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many login attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Login rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      rateLimitType: 'login',
    });
    res.status(429).json({
      success: false,
      error: 'Too many login attempts from this IP, please try again after 15 minutes.',
    });
  },
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many API requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('API rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      rateLimitType: 'api',
    });
    res.status(429).json({
      success: false,
      error: 'Too many API requests from this IP, please try again later.',
    });
  },
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many requests for this operation, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      rateLimitType: 'strict',
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests for this operation, please try again later.',
    });
  },
});
