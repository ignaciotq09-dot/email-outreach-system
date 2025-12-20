import crypto from 'crypto';

// Encryption for storing OAuth tokens securely
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;

function getEncryptionKey(): string {
  const key = process.env.SESSION_SECRET || process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('SESSION_SECRET or ENCRYPTION_KEY required for token encryption');
  }
  return key;
}

/**
 * Encrypt sensitive data (OAuth tokens)
 */
export function encryptToken(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    const key = crypto.pbkdf2Sync(
      getEncryptionKey(),
      salt,
      ITERATIONS,
      32,
      'sha512'
    );

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);

    const tag = (cipher as any).getAuthTag();

    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
  } catch (error) {
    console.error('[Encryption] Failed to encrypt token:', error);
    throw new Error('Token encryption failed');
  }
}

/**
 * Decrypt sensitive data (OAuth tokens)
 */
export function decryptToken(encryptedData: string): string {
  try {
    const buffer = Buffer.from(encryptedData, 'base64');

    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    );
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = crypto.pbkdf2Sync(
      getEncryptionKey(),
      salt,
      ITERATIONS,
      32,
      'sha512'
    );

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    (decipher as any).setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('[Encryption] Failed to decrypt token:', error);
    throw new Error('Token decryption failed');
  }
}
