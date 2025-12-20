import session from 'express-session';
import ConnectPgSimple from 'connect-pg-simple';
import { db } from '../db';

const PgSession = ConnectPgSimple(session);

export function createSessionMiddleware() {
  const sessionSecret = process.env.SESSION_SECRET;
  
  if (!sessionSecret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }

  return session({
    store: new PgSession({
      pool: (db as any)._.session.postgres,
      tableName: 'sessions',
      createTableIfMissing: false,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax', // Lax mode allows OAuth redirects while still providing CSRF protection
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  });
}
