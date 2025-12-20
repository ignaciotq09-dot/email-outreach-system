// Authentication routes
import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

interface SessionData {
  userId?: number;
  csrfToken?: string;
}

export function registerOAuthRoutes(app: Express) {
  // Development-only login bypass
  // IMPORTANT: Security check - only enabled when NOT deployed
  // REPL_DEPLOYMENT is set when app is deployed via Replit Deployments
  const isDeployed = !!process.env.REPL_DEPLOYMENT;
  const isProduction = process.env.NODE_ENV === 'production';
  const enableDevLogin = !isDeployed && !isProduction;
  
  console.log('[Auth] Environment check:', { 
    NODE_ENV: process.env.NODE_ENV, 
    REPL_DEPLOYMENT: process.env.REPL_DEPLOYMENT,
    isDeployed,
    isProduction,
    enableDevLogin 
  });
  
  if (enableDevLogin) {
    app.post('/api/auth/dev-login', async (req: Request, res: Response) => {
      try {
        console.log('[DevAuth] Development login requested');
        
        const devEmail = 'dev@example.com';
        const devName = 'Dev User';
        
        // Find or create dev user
        let [devUser] = await db.select().from(users).where(eq(users.email, devEmail));
        
        if (!devUser) {
          console.log('[DevAuth] Creating dev user...');
          const [newUser] = await db.insert(users).values({
            email: devEmail,
            name: devName,
            firstName: 'Dev',
            lastName: 'User',
            companyName: 'Development',
            emailVerified: true,
            active: true,
          }).returning();
          devUser = newUser;
          console.log('[DevAuth] Created dev user with ID:', devUser.id);
        }
        
        // Set up session
        const session = req.session as SessionData;
        session.userId = devUser.id;
        session.csrfToken = crypto.randomBytes(32).toString('hex');
        
        // Save session explicitly
        req.session.save((err) => {
          if (err) {
            console.error('[DevAuth] Session save error:', err);
            return res.status(500).json({ error: 'Failed to save session' });
          }
          
          console.log('[DevAuth] Login successful for user ID:', devUser.id);
          res.json({ 
            success: true, 
            user: devUser,
            csrfToken: session.csrfToken,
            message: 'Development login successful'
          });
        });
      } catch (error) {
        console.error('[DevAuth] Error:', error);
        res.status(500).json({ error: 'Dev login failed' });
      }
    });
    
    console.log('[Auth] Development login endpoint enabled: POST /api/auth/dev-login');
  }

  // Get current user from session
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const session = req.session as SessionData;
      const userId = session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = await storage.getUserById(userId);
      
      if (!user) {
        delete session.userId;
        console.warn('[Auth] Invalid user ID in session, clearing');
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('[Auth] Get current user error:', error);
      res.status(500).json({ error: 'Failed to get current user' });
    }
  });

  // Logout
  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('[Auth] Logout error:', err);
          return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ success: true });
      });
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      res.status(500).json({ error: 'Failed to logout' });
    }
  });
}
