import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../../storage';

interface SessionData {
  oauthState?: string;
}

export function requireAuth(req: any, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    return next();
  }
  return res.status(401).json({ message: 'Not authenticated' });
}

export function generateStateToken(req: Request): string {
  const state = uuidv4();
  (req.session as SessionData).oauthState = state;
  return state;
}

export function validateStateToken(req: Request, providedState: string | undefined): boolean {
  const session = req.session as SessionData;
  if (!providedState || !session.oauthState) {
    return false;
  }
  const isValid = providedState === session.oauthState;
  if (isValid) {
    delete session.oauthState;
  }
  return isValid;
}

export async function getUserFromRequest(req: any) {
  if (req.session?.userId) {
    return storage.getUserById(req.session.userId);
  }
  if (req.user?.claims?.sub) {
    return storage.getUserByReplitAuthId(req.user.claims.sub);
  }
  return undefined;
}
