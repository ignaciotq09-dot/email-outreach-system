import { ConfidentialClientApplication, LogLevel } from '@azure/msal-node';
import { google } from 'googleapis';

// Get base URL for OAuth redirects
// Can optionally accept a request to determine protocol and host dynamically
function getBaseUrl(req?: any): string {
  // If request provided, use its host for maximum compatibility
  if (req) {
    // Respect X-Forwarded-Proto header (set by proxies like Replit)
    // This is safe because we have 'trust proxy' enabled in server/index.ts
    // Handle comma-separated values in multi-proxy chains (take first value)
    let protocol = req.protocol || (req.secure ? 'https' : 'http');
    const forwardedProto = req.get('x-forwarded-proto');
    if (forwardedProto) {
      protocol = forwardedProto.split(',')[0].trim();
    }
    
    const host = req.get('host');
    
    if (host) {
      return `${protocol}://${host}`;
    }
  }
  
  // Fallback to environment variables
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    // Replit deployment
    return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  }
  // Local development
  return process.env.BASE_URL || 'http://localhost:5000';
}

// Microsoft/Outlook OAuth Configuration
export function createMsalClient() {
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenantId = process.env.AZURE_TENANT_ID || 'common'; // 'common' allows any Microsoft account

  if (!clientId || !clientSecret) {
    throw new Error('AZURE_CLIENT_ID and AZURE_CLIENT_SECRET are required for Outlook OAuth');
  }

  const msalConfig = {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret,
    },
    system: {
      loggerOptions: {
        loggerCallback(loglevel: any, message: string, containsPii: boolean) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[MSAL]', message);
          }
        },
        piiLoggingEnabled: false,
        logLevel: LogLevel.Warning,
      },
    },
  };

  return new ConfidentialClientApplication(msalConfig);
}

// Outlook OAuth scopes
export const OUTLOOK_SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access', // Required for refresh tokens
  'https://graph.microsoft.com/Mail.Read',
  'https://graph.microsoft.com/Mail.ReadWrite',
  'https://graph.microsoft.com/Mail.Send',
  'https://graph.microsoft.com/User.Read',
];

// Outlook OAuth redirect URI (for connectors)
export function getOutlookRedirectUri(req?: any): string {
  return `${getBaseUrl(req)}/api/connect/outlook/callback`;
}

// Gmail OAuth Configuration
export function createGoogleOAuth2Client(req?: any) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required for Gmail OAuth');
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    getGmailRedirectUri(req)
  );

  return oauth2Client;
}

// Gmail OAuth scopes
// IMPORTANT: gmail.send and gmail.modify are RESTRICTED scopes
// You MUST add your email as a test user in Google Cloud Console first!
export const GMAIL_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',     // Re-enabled after adding test user
  'https://www.googleapis.com/auth/gmail.modify',  // Re-enabled after adding test user
  'https://www.googleapis.com/auth/calendar.events',  // Create, read, update, delete calendar events
  'https://www.googleapis.com/auth/calendar.readonly',  // Read calendar events
];

// Full scopes including restricted ones (for future use)
export const GMAIL_FULL_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

// Gmail OAuth redirect URI (for connectors)
export function getGmailRedirectUri(req?: any): string {
  return `${getBaseUrl(req)}/api/connect/gmail/callback`;
}

// Yahoo OAuth Configuration
// Note: mail-r and mail-w scopes require special approval from Yahoo
// Using standard OpenID Connect scopes that work with Yahoo
export const YAHOO_SCOPES = [
  'openid',
  'profile',
  'email',
];

export function getYahooAuthUrl(state: string, req?: any): string {
  const clientId = process.env.YAHOO_CLIENT_ID;
  
  if (!clientId) {
    throw new Error('YAHOO_CLIENT_ID is required for Yahoo OAuth');
  }

  const redirectUri = getYahooRedirectUri(req);
  const scopes = YAHOO_SCOPES.join(' ');
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    state,
  });

  return `https://api.login.yahoo.com/oauth2/request_auth?${params.toString()}`;
}

export function getYahooRedirectUri(req?: any): string {
  return `${getBaseUrl(req)}/api/connect/yahoo/callback`;
}

export async function exchangeYahooCodeForTokens(code: string, req?: any) {
  const clientId = process.env.YAHOO_CLIENT_ID;
  const clientSecret = process.env.YAHOO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('YAHOO_CLIENT_ID and YAHOO_CLIENT_SECRET are required');
  }

  const redirectUri = getYahooRedirectUri(req);
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Yahoo token exchange failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function refreshYahooAccessToken(refreshToken: string) {
  const clientId = process.env.YAHOO_CLIENT_ID;
  const clientSecret = process.env.YAHOO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('YAHOO_CLIENT_ID and YAHOO_CLIENT_SECRET are required');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Yahoo token refresh failed: ${response.status} ${errorText}`);
  }

  return response.json();
}
