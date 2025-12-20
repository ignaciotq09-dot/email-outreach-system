import type { EmailProviderAdapter, EmailProvider } from "../../types";
import { getGmailClient, isTokenValid } from './tokens';
import { checkHealth, getUserEmail, fetchThread, searchMessages } from './operations';

export const gmailAdapter: EmailProviderAdapter = {
  provider: 'gmail' as EmailProvider,
  checkHealth: async (userId) => checkHealth(userId),
  getUserEmail: async (userId) => getUserEmail(userId),
  fetchThread: async (userId, threadId) => fetchThread(userId, threadId),
  searchMessages: async (userId, query, options) => searchMessages(userId, query, options),
  isTokenValid: async (userId) => isTokenValid(userId),
};

export { getGmailClient };
export default gmailAdapter;
