import { Router, Request, Response } from 'express';
import { storage } from '../../storage';
import { createGoogleOAuth2Client, GMAIL_SCOPES, getGmailRedirectUri } from '../oauth-config';
import { encryptToken } from '../token-encryption';
import { generateStateToken, validateStateToken } from './utils';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('[Connector] Initiating Gmail OAuth');
    const redirectUri = getGmailRedirectUri(req);
    console.log('[Connector] Generated redirect URI:', redirectUri);
    
    if (redirectUri.includes('localhost')) {
      console.error('[Connector] ERROR: Accessing from localhost');
      return res.status(400).send(`<!DOCTYPE html><html><head><title>OAuth Configuration Error</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:50px auto;padding:20px;background:#f5f5f5}.error-box{background:white;border-radius:8px;padding:30px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}h1{color:#dc2626;font-size:24px}.url-box{background:#f0f9ff;border:2px solid #0284c7;border-radius:4px;padding:15px;margin:15px 0}.url-box a{color:#0284c7;text-decoration:none;font-weight:500}.url-box a:hover{text-decoration:underline}.explanation{margin:20px 0;color:#4b5563;line-height:1.6}.note{background:#fef3c7;border-left:4px solid #f59e0b;padding:10px 15px;margin-top:20px}</style></head><body><div class="error-box"><h1>⚠️ OAuth Configuration Error</h1><div class="explanation">You're accessing this app from <strong>localhost</strong>, but Google OAuth is only configured for the production and development URLs.</div><p><strong>Please use one of these URLs instead:</strong></p><div class="url-box"><strong>Production URL:</strong><br><a href="https://workspace-ignaciotq09.repl.co/signup">https://workspace-ignaciotq09.repl.co/signup</a></div><div class="url-box"><strong>Development URL:</strong><br><a href="https://dbbee80b-a6d9-4f71-bd60-8635090eabf3-00-2yz1126bnbh8h.worf.replit.dev/signup">https://dbbee80b-a6d9-4f71-bd60-8635090eabf3-00-2yz1126bnbh8h.worf.replit.dev/signup</a></div><div class="note"><strong>Why is this happening?</strong> Google requires exact redirect URI matches for security.</div></div></body></html>`);
    }
    
    const oauth2Client = createGoogleOAuth2Client(req);
    const state = generateStateToken(req);
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GMAIL_SCOPES,
      state,
      prompt: 'select_account',
    });
    
    console.log('[Connector] Redirecting to Google for Gmail OAuth');
    res.redirect(authUrl);
  } catch (error) {
    console.error('[Connector] Gmail OAuth initiation failed:', error);
    res.redirect('/signup?error=connection_failed');
  }
});

router.get('/callback', async (req: any, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query;
    
    if (error) {
      console.error('[OAuth] Gmail error:', error, error_description);
      if (error === 'access_denied') {
        return res.status(403).send(`<!DOCTYPE html><html><head><title>Access Denied</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:50px auto;padding:20px;background:#f5f5f5}.error-box{background:white;border-radius:8px;padding:30px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}h1{color:#dc2626;font-size:24px}.explanation{margin:20px 0;color:#4b5563;line-height:1.6}.solutions{background:#f0f9ff;border-radius:4px;padding:15px;margin:20px 0}.solutions li{margin:10px 0}a{color:#0284c7;text-decoration:none;font-weight:500}a:hover{text-decoration:underline}</style></head><body><div class="error-box"><h1>❌ Access Denied (403)</h1><div class="explanation">Google has blocked access. Error: ${error_description || 'Access was denied'}</div><div class="solutions"><strong>Possible solutions:</strong><ul><li>Use the correct Google account</li><li>Click "Advanced" → "Go to [app name] (unsafe)" if prompted</li><li>Clear browser cookies and try again</li></ul></div><p><a href="/signup">← Back to Signup</a></p></div></body></html>`);
      }
      return res.redirect(`/signup?error=${error}`);
    }
    
    if (!code || typeof code !== 'string') {
      return res.redirect('/signup?error=no_code');
    }
    
    if (!validateStateToken(req, state as string)) {
      console.error('[OAuth][Security] Invalid OAuth state token');
      return res.redirect('/signup?error=invalid_state');
    }
    
    console.log('[OAuth] Gmail callback received, exchanging code for tokens');
    const oauth2Client = createGoogleOAuth2Client(req);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    if (!tokens.access_token) {
      return res.redirect('/signup?error=no_token');
    }
    
    const { google: googleapis } = await import('googleapis');
    const oauth2 = googleapis.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;
    
    if (!email) {
      return res.redirect('/signup?error=no_email');
    }
    
    console.log('[OAuth] Gmail OAuth completed for email:', email);
    
    let user = await storage.getUserByEmail(email);
    
    if (!user) {
      const signupProfile = req.session.signupProfile;
      if (!signupProfile?.fullName || !signupProfile?.company || !signupProfile?.position) {
        return res.redirect('/signup?error=missing_profile');
      }
      
      const nameParts = signupProfile.fullName.split(' ');
      user = await storage.createUser({
        email, passwordHash: null, name: signupProfile.fullName,
        firstName: nameParts[0] || signupProfile.fullName,
        lastName: nameParts.slice(1).join(' ') || null,
        companyName: signupProfile.company, position: signupProfile.position,
        emailProvider: 'gmail', profileImageUrl: null, emailVerified: true,
        verificationToken: null, resetPasswordToken: null, resetPasswordExpires: null,
        roleId: null, active: true, gmailConnected: true, replitAuthId: null, lastLoginAt: null,
      });
      delete req.session.signupProfile;
      console.log('[OAuth] Created new user via Gmail:', user.id);
    }
    
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;
    let refreshToken = tokens.refresh_token ? encryptToken(tokens.refresh_token) : undefined;
    
    if (!refreshToken) {
      const existingTokens = await storage.getOAuthTokens(user.id, 'gmail');
      if (existingTokens?.refreshToken) refreshToken = existingTokens.refreshToken;
    }
    
    await storage.storeOAuthTokens({
      userId: user.id, provider: 'gmail', email,
      accessToken: encryptToken(tokens.access_token), refreshToken, expiresAt,
      scope: GMAIL_SCOPES.join(' '),
    });
    
    req.session.userId = user.id;
    req.session.email = user.email;
    await new Promise<void>((resolve, reject) => req.session.save((err: any) => err ? reject(err) : resolve()));
    
    console.log('[OAuth] Gmail auth successful, user logged in:', user.id);
    res.redirect('/onboarding');
  } catch (error) {
    console.error('[OAuth] Gmail callback error:', error);
    res.redirect('/signup?error=connection_failed');
  }
});

export default router;
