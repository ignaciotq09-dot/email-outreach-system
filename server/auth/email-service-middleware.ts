// Middleware to inject user-specific email service into requests
import { Request, Response, NextFunction } from 'express';
import { getUserEmailService, UserEmailService } from '../user-email-service';

// Extend Express Request type to include emailService
declare global {
  namespace Express {
    interface Request {
      emailService?: UserEmailService;
    }
  }
}

/**
 * Middleware that injects the authenticated user's email service into req.emailService
 * Must be used AFTER requireAuth middleware
 */
export function attachUserEmailService(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    // Create user-specific email service based on their provider (gmail/outlook)
    req.emailService = getUserEmailService(req.user);
    next();
  } catch (error) {
    console.error('[EmailServiceMiddleware] Error creating email service:', error);
    return res.status(500).json({ message: 'Failed to initialize email service' });
  }
}
