import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerAllRoutes } from "./routes/index";
import { setupEmailWebSocket } from "./services/email-websocket";
import { setupInboxWebSocket } from "./services/inbox-websocket";
import { requireCsrfToken } from "./auth/csrf";
import { storage } from "./storage";
import connectorRoutes from "./auth/connector-routes";
import { createSessionMiddleware } from "./auth/session";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware (Postgres-backed)
  // This must be done FIRST before any routes that use sessions
  app.use(createSessionMiddleware());

  // Store signup profile data in session (for OAuth-only signup)
  app.post('/api/signup/set-profile', async (req: any, res) => {
    try {
      const { fullName, company, position } = req.body;
      
      if (!fullName || !company || !position) {
        return res.status(400).json({ message: "Missing required profile fields" });
      }
      
      // Store in session for OAuth callback to use
      req.session.signupProfile = { fullName, company, position };
      
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      console.log('[Auth] Signup profile data stored in session');
      res.json({ success: true });
    } catch (error) {
      console.error('Error storing signup profile:', error);
      res.status(500).json({ message: "Failed to store profile data" });
    }
  });

  // Register email connector routes (Gmail/Outlook/Yahoo OAuth)
  app.use('/api/connect', connectorRoutes);

  // Get authenticated user (OAuth-only authentication)
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // OAuth-only: Check session for logged-in user
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated - Please log in with Gmail, Outlook, or Yahoo" });
      }
      
      const user = await storage.getUserById(req.session.userId);
      
      if (!user) {
        // Clear invalid session
        delete req.session.userId;
        console.warn('[Auth] Invalid user ID in session, clearing');
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Sanitize user object - return only necessary fields to avoid circular references
      const sanitizedUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        companyName: user.companyName,
        position: user.position,
        profileImageUrl: user.profileImageUrl || undefined,
        emailProvider: user.emailProvider,
        createdAt: user.createdAt,
      };
      
      return res.json(sanitizedUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout endpoint
  app.post('/api/logout', async (req: any, res) => {
    try {
      await new Promise<void>((resolve, reject) => {
        req.session.destroy((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  // Apply CSRF protection globally to all API routes
  // Excludes: GET/HEAD/OPTIONS (handled in middleware)
  //           /api/login, /api/signup, /api/logout (auth endpoints)
  //           /api/callback (Replit Auth OAuth callback)
  //           /api/connect/* (email connector OAuth callbacks)
  //           /api/auth/csrf-token, /api/auth/user (token/user fetch)
  app.use('/api', (req, res, next) => {
    const path = req.path;
    
    // Skip CSRF for auth endpoints
    if (path === '/login' || path === '/signup' || path === '/callback' || path === '/logout' || path === '/auth/csrf-token' || path === '/auth/user' || path === '/auth/dev-login') {
      return next();
    }
    
    // Skip CSRF for email connector OAuth callbacks (state token validates CSRF)
    if (path.startsWith('/connect/')) {
      return next();
    }
    
    // Apply CSRF to everything else
    requireCsrfToken(req, res, next);
  });

  // Register all application routes
  registerAllRoutes(app);

  const httpServer = createServer(app);
  
  // Setup WebSocket for real-time email progress updates
  setupEmailWebSocket(httpServer);
  
  // Setup WebSocket for real-time inbox updates (new replies, status changes)
  setupInboxWebSocket(httpServer);

  return httpServer;
}
