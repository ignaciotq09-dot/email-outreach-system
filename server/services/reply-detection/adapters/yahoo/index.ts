import type { EmailProviderAdapter, EmailProvider } from "../../types";
import { getYahooEmail, isTokenValid } from './tokens';
import { checkHealth, fetchThread, searchMessages } from './operations';

export const yahooAdapter: EmailProviderAdapter = {
  provider: 'yahoo' as EmailProvider,
  checkHealth: async (userId) => checkHealth(userId),
  getUserEmail: async (userId) => getYahooEmail(userId),
  fetchThread: async (userId, messageId) => fetchThread(userId, messageId),
  searchMessages: async (userId, query, options) => searchMessages(userId, query, options),
  isTokenValid: async (userId) => isTokenValid(userId),
};

export default yahooAdapter;
