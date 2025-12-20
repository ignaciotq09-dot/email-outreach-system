import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // OAuth-only authentication: User must have a valid session from OAuth login
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized - Please log in with Gmail, Outlook, or Yahoo' });
  }
  next();
}

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: 'Too many accounts created. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 reset requests per hour
  message: 'Too many password reset requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
