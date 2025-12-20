# Authentication System Security

## Overview
This authentication system implements commercial-grade security measures for email/password + OAuth authentication.

## Token Encryption Architecture

### OAuth Access Tokens - Encrypted at Rest
**Why:** OAuth access tokens provide full API access to user accounts (Gmail, Google Calendar, GitHub, etc.). If compromised, attackers could read emails, access calendars, or modify repositories.

**Implementation:**
- **Algorithm:** AES-256-GCM (authenticated encryption)
- **Key Management:** Uses dedicated `TOKEN_ENCRYPTION_KEY` environment variable in production
- **Fallback:** In development, derives key from `SESSION_SECRET` using PBKDF2
- **Format:** Stored as `iv:authTag:encrypted` hex string

**Access Pattern:**
```typescript
// Encrypting before storage
const encryptedToken = encryptToken(plainAccessToken);
await storage.linkAuthProvider({ accessToken: encryptedToken, ... });

// Decrypting for use
const plainToken = await authService.getDecryptedOAuthToken(userId, 'google');
// Use plainToken to call Gmail API
```

### OAuth Refresh Tokens - Hashed
**Why:** Refresh tokens are long-lived and can generate new access tokens. We only need to verify them, not retrieve them.

**Implementation:**
- **Algorithm:** PBKDF2-SHA512 with 100,000 iterations
- **Format:** Stored as `salt:hash` hex string
- **One-way:** Cannot be reversed - verification only

**Verification Pattern:**
```typescript
// Hashing before storage
const hashedToken = hashRefreshToken(plainRefreshToken);
await storage.linkAuthProvider({ refreshToken: hashedToken, ... });

// Verifying (not retrieving)
const isValid = verifyRefreshToken(providedToken, storedHash);
```

### Password Hashing
**Algorithm:** bcrypt with cost factor 12
**Rationale:** Industry standard, resistant to rainbow tables and brute force

## Production Deployment Checklist

### 1. Generate Encryption Key
```bash
# Run once to generate a secure encryption key
node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(32).toString('hex'));"
```

### 2. Set Environment Variables
**Required:**
```env
SESSION_SECRET=<random-64-char-hex-string>
TOKEN_ENCRYPTION_KEY=<output-from-step-1>
DATABASE_URL=<your-postgres-connection-string>
```

**Optional (for OAuth):**
```env
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<your-google-oauth-client-secret>
GITHUB_CLIENT_ID=<your-github-oauth-client-id>
GITHUB_CLIENT_SECRET=<your-github-oauth-client-secret>
```

### 3. Security Hardening Recommendations

**Key Management (Advanced):**
- Consider using AWS KMS, Google Cloud KMS, or Azure Key Vault for encryption key management
- Implement key rotation strategy (rotate every 90 days)
- Store backup keys securely offline

**Token Refresh Strategy:**
- Implement automatic OAuth token refresh before expiry
- Add token revocation on logout/account deletion
- Monitor for suspicious token usage patterns

**Database Security:**
- Enable PostgreSQL SSL connections in production
- Use read-only database replicas for non-sensitive queries
- Implement database audit logging
- Regular encrypted backups

**Session Security:**
- Already configured: httpOnly cookies, sameSite: 'lax', 30-day expiry
- Consider: Implement session fingerprinting (User-Agent + IP hash)
- Consider: Add concurrent session limits per user

**Rate Limiting:**
- Already implemented: Login (5/15min), Registration (3/hour), Password Reset (3/hour)
- Consider: Add IP-based rate limiting at reverse proxy level (Nginx/Cloudflare)

**Monitoring & Alerts:**
- Log all authentication events (success/failure)
- Alert on: Mass password reset requests, failed login spikes, encryption errors
- Track: Token usage patterns, session durations, OAuth provider errors

## Compliance Notes

**GDPR Compliance:**
- ✅ Passwords are hashed (not stored in plaintext)
- ✅ OAuth tokens are encrypted at rest
- ✅ Users can delete their account (implement token revocation)
- ⚠️ Implement data export functionality
- ⚠️ Add consent tracking for OAuth scopes

**SOC 2 / ISO 27001:**
- ✅ Encryption at rest (OAuth tokens)
- ✅ Encryption in transit (HTTPS required)
- ✅ Password complexity enforcement (min 8 chars)
- ✅ Rate limiting on authentication endpoints
- ⚠️ Add MFA/2FA support for high-value accounts
- ⚠️ Implement audit logging for all access

## Migration from Plaintext Tokens

If you have existing plaintext tokens in the database, run this migration:

```sql
-- WARNING: This will invalidate all existing OAuth sessions
-- Users will need to re-authenticate with Google/GitHub

DELETE FROM auth_providers;

-- Or, if you want to preserve provider linkages but force re-auth:
UPDATE auth_providers SET access_token = NULL, refresh_token = NULL;
```

Then notify users to reconnect their OAuth accounts.

## Security Incident Response

**If DATABASE_URL is compromised:**
1. Immediately rotate `TOKEN_ENCRYPTION_KEY` - renders old tokens unusable
2. Force logout all sessions: `DELETE FROM sessions;`
3. Invalidate all OAuth tokens: Run migration above
4. Notify users to change passwords and reconnect OAuth
5. Review database access logs for unauthorized queries

**If TOKEN_ENCRYPTION_KEY is compromised:**
1. Generate new key and update environment variable
2. Re-encrypt all tokens using new key (implement migration script)
3. Or: Delete all OAuth tokens and force re-authentication
4. Investigate how key was exposed and fix root cause

## Architecture Decisions

**Why encrypt access tokens but hash refresh tokens?**
- Access tokens: Need to retrieve plaintext for API calls to Gmail/Calendar/GitHub
- Refresh tokens: Only need to verify, never retrieve - hashing is more secure

**Why not use database-level encryption?**
- Database encryption protects against disk theft, not application-level breaches
- Application-level encryption provides defense-in-depth
- Enables column-level encryption (only sensitive fields encrypted)

**Why PBKDF2 instead of Argon2 for refresh tokens?**
- PBKDF2 is built into Node.js crypto module (no dependencies)
- 100,000 iterations provides sufficient security for 256-bit tokens
- Argon2 is better for passwords (implemented via bcrypt)

## Testing

```bash
# Test encryption/decryption
npm run test:auth-encryption

# Test OAuth flow without real providers
npm run test:auth-oauth-mock

# Security audit
npm audit
```

## References
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
