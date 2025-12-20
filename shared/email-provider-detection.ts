/**
 * Email Provider Detection Utility
 * Maps email domains to supported OAuth providers
 */

export type EmailProvider = 'gmail' | 'outlook' | 'yahoo' | null;

const GMAIL_DOMAINS = ['gmail.com', 'googlemail.com'];
const OUTLOOK_DOMAINS = ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'];
const YAHOO_DOMAINS = ['yahoo.com', 'ymail.com', 'rocketmail.com'];

/**
 * Detects the email provider from an email address
 * @param email - Full email address
 * @returns Provider name or null if not recognized
 */
export function detectEmailProvider(email: string): EmailProvider {
  if (!email || !email.includes('@')) {
    return null;
  }

  const domain = email.toLowerCase().split('@')[1];

  if (GMAIL_DOMAINS.includes(domain)) {
    return 'gmail';
  }

  if (OUTLOOK_DOMAINS.includes(domain)) {
    return 'outlook';
  }

  if (YAHOO_DOMAINS.includes(domain)) {
    return 'yahoo';
  }

  return null;
}

/**
 * Gets the OAuth redirect URL for a detected provider
 * @param provider - Detected email provider
 * @returns OAuth endpoint or null
 */
export function getOAuthRedirectUrl(provider: EmailProvider): string | null {
  switch (provider) {
    case 'gmail':
      return '/api/connect/gmail';
    case 'outlook':
      return '/api/connect/outlook';
    case 'yahoo':
      return '/api/connect/yahoo';
    default:
      return null;
  }
}

/**
 * Gets user-friendly provider name
 * @param provider - Email provider
 * @returns Display name
 */
export function getProviderDisplayName(provider: EmailProvider): string {
  switch (provider) {
    case 'gmail':
      return 'Gmail';
    case 'outlook':
      return 'Outlook';
    case 'yahoo':
      return 'Yahoo';
    default:
      return 'Email Provider';
  }
}
