import { randomBytes, timingSafeEqual } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token using constant-time comparison
 */
export function validateCsrfToken(token: string, expectedToken: string): boolean {
  if (typeof token !== 'string' || typeof expectedToken !== 'string') {
    return false;
  }
  
  if (token.length !== expectedToken.length) {
    return false;
  }
  
  try {
    const tokenBuffer = Buffer.from(token, 'hex');
    const expectedBuffer = Buffer.from(expectedToken, 'hex');
    return timingSafeEqual(tokenBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Middleware to require CSRF token on mutating requests
 */
export function requireCsrfToken(req: Request, res: Response, next: NextFunction) {
  // Only check CSRF for mutating methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] as string;
  const sessionToken = req.session.csrfToken;

  if (!sessionToken || !validateCsrfToken(token, sessionToken)) {
    console.error('[CSRF] Token validation failed', {
      hasSessionToken: !!sessionToken,
      hasHeaderToken: !!token,
      method: req.method,
      path: req.path,
    });
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
}

/**
 * Endpoint to get/generate CSRF token
 */
export function getCsrfToken(req: Request, res: Response) {
  // Generate new token if none exists
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCsrfToken();
  }

  res.json({ token: req.session.csrfToken });
}
