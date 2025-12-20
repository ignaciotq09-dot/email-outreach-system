import { Router, Request, Response } from 'express';
import { storage } from '../../storage';
import { createMsalClient, OUTLOOK_SCOPES, getOutlookRedirectUri } from '../oauth-config';
import { encryptToken } from '../token-encryption';
import { generateStateToken, validateStateToken } from './utils';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('[OAuth] Initiating Outlook OAuth');
    const msalClient = createMsalClient();
    const state = generateStateToken(req);
    
    const authCodeUrlParameters = {
      scopes: OUTLOOK_SCOPES,
      redirectUri: getOutlookRedirectUri(req),
      state,
      prompt: 'consent',
    };

    const authUrl = await msalClient.getAuthCodeUrl(authCodeUrlParameters);
    console.log('[OAuth] Redirecting to Microsoft for Outlook OAuth');
    res.redirect(authUrl);
  } catch (error) {
    console.error('[OAuth] Outlook OAuth initiation failed:', error);
    res.redirect('/signup?error=connection_failed');
  }
});

router.get('/callback', async (req: any, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query;
    
    if (error) {
      console.error('[OAuth] Outlook error:', error, error_description);
      return res.redirect(`/signup?error=${error}`);
    }
    
    if (!code || typeof code !== 'string') {
      return res.redirect('/signup?error=no_code');
    }
    
    if (!validateStateToken(req, state as string)) {
      console.error('[OAuth][Security] Invalid OAuth state token');
      return res.redirect('/signup?error=invalid_state');
    }
    
    console.log('[OAuth] Outlook callback received, exchanging code for tokens');
    const msalClient = createMsalClient();
    
    const tokenRequest = { code, scopes: OUTLOOK_SCOPES, redirectUri: getOutlookRedirectUri(req) };
    const response = await msalClient.acquireTokenByCode(tokenRequest);
    
    if (!response.accessToken) {
      return res.redirect('/onboarding?error=no_token');
    }
    
    let email: string | undefined;
    try {
      const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { 'Authorization': `Bearer ${response.accessToken}` },
      });
      if (graphResponse.ok) {
        const profile = await graphResponse.json();
        email = profile.mail || profile.userPrincipalName;
      } else {
        email = response.account?.username || response.account?.homeAccountId;
      }
    } catch {
      email = response.account?.username || response.account?.homeAccountId;
    }
    
    if (!email) {
      return res.redirect('/signup?error=no_email');
    }
    
    console.log('[OAuth] Outlook OAuth completed for email:', email);
    
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
        emailProvider: 'outlook', profileImageUrl: null, emailVerified: true,
        verificationToken: null, resetPasswordToken: null, resetPasswordExpires: null,
        roleId: null, active: true, gmailConnected: false, replitAuthId: null, lastLoginAt: null,
      });
      delete req.session.signupProfile;
      console.log('[OAuth] Created new user via Outlook:', user.id);
    }
    
    const expiresAt = response.expiresOn ? new Date(response.expiresOn) : undefined;
    const responseRefreshToken = (response as any).refreshToken as string | undefined;
    let refreshToken = responseRefreshToken ? encryptToken(responseRefreshToken) : undefined;
    
    if (!refreshToken) {
      const existingTokens = await storage.getOAuthTokens(user.id, 'outlook');
      if (existingTokens?.refreshToken) refreshToken = existingTokens.refreshToken;
    }
    
    await storage.storeOAuthTokens({
      userId: user.id, provider: 'outlook', email,
      accessToken: encryptToken(response.accessToken), refreshToken, expiresAt,
      scope: OUTLOOK_SCOPES.join(' '),
    });
    
    req.session.userId = user.id;
    req.session.email = user.email;
    await new Promise<void>((resolve, reject) => req.session.save((err: any) => err ? reject(err) : resolve()));
    
    console.log('[OAuth] Outlook auth successful, user logged in:', user.id);
    res.redirect('/onboarding');
  } catch (error) {
    console.error('[OAuth] Outlook callback error:', error);
    res.redirect('/signup?error=connection_failed');
  }
});

export default router;
