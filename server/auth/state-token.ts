import crypto from 'crypto';

const SECRET_KEY = process.env.SESSION_SECRET || 'default-secret-key-change-in-production';

export function signStateToken(pendingUserToken: string): string {
  const payload = JSON.stringify({
    token: pendingUserToken,
    timestamp: Date.now(),
  });
  
  const hmac = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payload)
    .digest('base64url');
  
  const signedToken = `${Buffer.from(payload).toString('base64url')}.${hmac}`;
  return signedToken;
}

export function verifyStateToken(signedToken: string): string | null {
  try {
    const [payloadEncoded, providedHmac] = signedToken.split('.');
    
    if (!payloadEncoded || !providedHmac) {
      return null;
    }
    
    const payload = Buffer.from(payloadEncoded, 'base64url').toString('utf8');
    
    const expectedHmac = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(payload)
      .digest('base64url');
    
    if (expectedHmac !== providedHmac) {
      console.warn('[StateToken] HMAC verification failed');
      return null;
    }
    
    const data = JSON.parse(payload);
    
    const tokenAge = Date.now() - data.timestamp;
    const oneHour = 60 * 60 * 1000;
    
    if (tokenAge > oneHour) {
      console.warn('[StateToken] Token expired');
      return null;
    }
    
    return data.token;
  } catch (error) {
    console.error('[StateToken] Token verification error:', error);
    return null;
  }
}
