import { Router, Request, Response } from 'express';
import { storage } from '../../storage';
import { getYahooAuthUrl, exchangeYahooCodeForTokens, YAHOO_SCOPES, getYahooRedirectUri } from '../oauth-config';
import { encryptToken } from '../token-encryption';
import { generateStateToken, validateStateToken } from './utils';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('[OAuth] Initiating Yahoo OAuth');
    const redirectUri = getYahooRedirectUri(req);
    console.log('[OAuth] Yahoo redirect URI:', redirectUri);
    
    const state = generateStateToken(req);
    const authUrl = getYahooAuthUrl(state, req);
    
    console.log('[OAuth] Redirecting to Yahoo for OAuth');
    res.redirect(authUrl);
  } catch (error) {
    console.error('[OAuth] Yahoo OAuth initiation failed:', error);
    res.redirect('/signup?error=connection_failed');
  }
});

router.get('/callback', async (req: any, res: Response) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      console.error('[OAuth] Yahoo error:', error);
      return res.redirect(`/signup?error=${error}`);
    }
    
    if (!code || typeof code !== 'string') {
      return res.redirect('/signup?error=no_code');
    }
    
    if (!validateStateToken(req, state as string)) {
      console.error('[OAuth][Security] Invalid OAuth state token');
      return res.redirect('/signup?error=invalid_state');
    }
    
    console.log('[OAuth] Yahoo callback received, exchanging code for tokens');
    const tokenResponse = await exchangeYahooCodeForTokens(code, req);
    
    if (!tokenResponse.access_token) {
      return res.redirect('/onboarding?error=no_token');
    }
    
    let email: string | undefined;
    try {
      const userInfoResponse = await fetch('https://api.login.yahoo.com/openid/v1/userinfo', {
        headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` },
      });
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        email = userInfo.email;
      }
    } catch (error) {
      console.error('[Connector] Failed to fetch Yahoo user info:', error);
    }
    
    if (!email) {
      return res.redirect('/signup?error=no_email');
    }
    
    console.log('[OAuth] Yahoo OAuth completed for email:', email);
    
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
        emailProvider: 'yahoo', profileImageUrl: null, emailVerified: true,
        verificationToken: null, resetPasswordToken: null, resetPasswordExpires: null,
        roleId: null, active: true, gmailConnected: false, replitAuthId: null, lastLoginAt: null,
      });
      delete req.session.signupProfile;
      console.log('[OAuth] Created new user via Yahoo:', user.id);
    }
    
    const expiresAt = tokenResponse.expires_in ? new Date(Date.now() + tokenResponse.expires_in * 1000) : undefined;
    let refreshToken = tokenResponse.refresh_token ? encryptToken(tokenResponse.refresh_token) : undefined;
    
    if (!refreshToken) {
      const existingTokens = await storage.getOAuthTokens(user.id, 'yahoo');
      if (existingTokens?.refreshToken) refreshToken = existingTokens.refreshToken;
    }
    
    await storage.storeOAuthTokens({
      userId: user.id, provider: 'yahoo', email,
      accessToken: encryptToken(tokenResponse.access_token), refreshToken, expiresAt,
      scope: YAHOO_SCOPES.join(' '),
    });
    
    req.session.userId = user.id;
    req.session.email = user.email;
    await new Promise<void>((resolve, reject) => req.session.save((err: any) => err ? reject(err) : resolve()));
    
    console.log('[OAuth] Yahoo auth successful, user logged in:', user.id);
    res.redirect('/onboarding');
  } catch (error) {
    console.error('[OAuth] Yahoo callback error:', error);
    res.redirect('/signup?error=connection_failed');
  }
});

export default router;
