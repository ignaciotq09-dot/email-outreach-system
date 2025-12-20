// From Replit Auth blueprint
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  // Detect if we're in production (HTTPS) or development (HTTP)
  const isProduction = process.env.NODE_ENV === 'production';
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction, // Only require HTTPS in production
      sameSite: 'lax', // Required for OAuth redirects
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  // Handle both function and property access for claims
  user.claims = typeof tokens.claims === 'function' ? tokens.claims() : tokens.claims;
  user.access_token = tokens.access_token;
  // Preserve existing refresh token if new response doesn't include one
  if (tokens.refresh_token) {
    user.refresh_token = tokens.refresh_token;
  }
  user.expires_at = user.claims?.exp;
}

// Check if an email has an existing account in the database
async function isExistingUser(email: string | null): Promise<boolean> {
  if (!email) {
    console.log('[Auth] No email provided - denying access');
    return false;
  }
  
  // Check if user already exists in database
  const existingUser = await storage.getUserByEmail(email);
  const isExisting = !!existingUser;
  console.log(`[Auth] Email ${email} account check: ${isExisting ? 'EXISTS - ALLOWED' : 'NOT FOUND - DENIED'}`);
  return isExisting;
}

async function upsertUser(
  claims: any,
  req?: any
) {
  const email = claims["email"];
  
  // Check if user already has an account BEFORE allowing login
  // Only existing users can sign in
  const userExists = await isExistingUser(email);
  if (!userExists) {
    throw new Error(`Access denied: No account exists for ${email}. Please contact the administrator to create an account.`);
  }
  
  // Check if there's signup profile data in the session
  const signupProfile = req?.session?.signupProfile;
  
  // Update existing user's profile (don't create new users)
  await storage.upsertReplitUser({
    replitAuthId: claims["sub"],
    email: claims["email"],
    firstName: signupProfile?.fullName || claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    // Store company and position from signup form if available
    ...(signupProfile && {
      company: signupProfile.company,
      position: signupProfile.position,
    }),
  });
  
  // Clear signup profile data after using it and save session
  if (req?.session?.signupProfile) {
    delete req.session.signupProfile;
    // Explicitly save session to ensure cleanup persists
    await new Promise<void>((resolve, reject) => {
      req.session.save((err: any) => {
        if (err) {
          console.error('[Auth] Failed to save session after profile merge:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (host: string, protocol: string) => {
    const strategyName = `replitauth:${host}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `${protocol}://${host}/api/callback`,
          passReqToCallback: true, // Enable passing request to verify callback
        },
        async (
          tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
          verified: passport.AuthenticateCallback,
          req: any
        ) => {
          try {
            console.log('[Auth] Verify callback triggered');
            console.log('[Auth] Tokens type:', typeof tokens);
            console.log('[Auth] Tokens.claims type:', typeof tokens.claims);
            
            const user = {};
            updateUserSession(user, tokens);
            
            // Get claims from user object (already populated by updateUserSession)
            const claims = user.claims;
            
            if (!claims) {
              console.error('[Auth] No claims found in tokens or user session');
              return verified(new Error('No claims found in authentication response'));
            }
            
            console.log('[Auth] Claims sub:', claims.sub);
            await upsertUser(claims, req);
            verified(null, user);
          } catch (error) {
            console.error('[Auth] Verify callback error:', error);
            verified(error as Error);
          }
        }
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const host = req.get("host")!; // Includes port for local dev
    ensureStrategy(host, req.protocol);
    passport.authenticate(`replitauth:${host}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const host = req.get("host")!;
    ensureStrategy(host, req.protocol);
    passport.authenticate(`replitauth:${host}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    const host = req.get("host")!;
    req.logout(() => {
      // Destroy session to fully invalidate and prevent session table bloat
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${host}`,
          }).href
        );
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
