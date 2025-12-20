// Email provider configuration for the application
import type { EmailProvider } from './services/email-service';

// Default provider is Gmail for backward compatibility
let currentProvider: EmailProvider = 'gmail';

// Get current email provider
export function getEmailProvider(): EmailProvider {
  return currentProvider;
}

// Set email provider
export function setEmailProvider(provider: EmailProvider): void {
  if (provider !== 'gmail' && provider !== 'outlook' && provider !== 'yahoo') {
    throw new Error(`Invalid email provider: ${provider}`);
  }
  currentProvider = provider;
  console.log(`[EmailConfig] Switched to provider: ${provider}`);
}

// Initialize provider from environment variable if set
const envProvider = process.env.EMAIL_PROVIDER as EmailProvider | undefined;
if (envProvider && (envProvider === 'gmail' || envProvider === 'outlook' || envProvider === 'yahoo')) {
  currentProvider = envProvider;
  console.log(`[EmailConfig] Using provider from environment: ${envProvider}`);
}
