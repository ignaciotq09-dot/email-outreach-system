/**
 * Provider Adapter Registry
 * 
 * Exports all provider adapters and provides a unified interface
 * to get the appropriate adapter for a given provider.
 */

import { gmailAdapter } from "./gmail-adapter";
import { outlookAdapter } from "./outlook-adapter";
import { yahooAdapter } from "./yahoo-adapter";
import type { EmailProviderAdapter, EmailProvider } from "../types";

// Export individual adapters
export { gmailAdapter } from "./gmail-adapter";
export { outlookAdapter } from "./outlook-adapter";
export { yahooAdapter } from "./yahoo-adapter";

// Registry of all adapters
const adapterRegistry: Record<EmailProvider, EmailProviderAdapter> = {
  gmail: gmailAdapter,
  outlook: outlookAdapter,
  yahoo: yahooAdapter,
};

/**
 * Get the appropriate adapter for a provider
 */
export function getAdapter(provider: EmailProvider): EmailProviderAdapter {
  const adapter = adapterRegistry[provider];
  
  if (!adapter) {
    throw new Error(`No adapter available for provider: ${provider}`);
  }
  
  return adapter;
}

/**
 * Get all available adapters
 */
export function getAllAdapters(): EmailProviderAdapter[] {
  return Object.values(adapterRegistry);
}

/**
 * Check if a provider is supported
 */
export function isProviderSupported(provider: string): provider is EmailProvider {
  return provider in adapterRegistry;
}
