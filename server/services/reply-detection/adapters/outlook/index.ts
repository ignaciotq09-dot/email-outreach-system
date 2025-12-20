import type { EmailProviderAdapter, EmailProvider } from "../../types";
import { getOutlookClient, isTokenValid } from './tokens';
import { checkHealth, getUserEmail, fetchThread, searchMessages } from './operations';

export const outlookAdapter: EmailProviderAdapter = {
  provider: 'outlook' as EmailProvider,
  checkHealth: async (userId) => checkHealth(userId),
  getUserEmail: async (userId) => getUserEmail(userId),
  fetchThread: async (userId, conversationId) => fetchThread(userId, conversationId),
  searchMessages: async (userId, query, options) => searchMessages(userId, query, options),
  isTokenValid: async (userId) => isTokenValid(userId),
};

export { getOutlookClient };
export default outlookAdapter;
