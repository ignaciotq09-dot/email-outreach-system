import crypto from "crypto";

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error('[LinkedIn Cookie API] SESSION_SECRET environment variable is required for cookie encryption');
  }
  return crypto.createHash('sha256').update(sessionSecret).digest();
}

export function encryptCookies(cookies: any): { encrypted: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(JSON.stringify(cookies), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return { encrypted, iv: iv.toString('hex'), authTag: authTag.toString('hex') };
}

export function decryptCookies(encryptedData: { encrypted: string; iv: string; authTag: string }): any {
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), Buffer.from(encryptedData.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('[LinkedIn Cookie API] Error decrypting cookies:', error);
    return null;
  }
}
