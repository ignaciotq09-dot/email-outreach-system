import type { ImapFlow } from 'imapflow';
import type { ProviderMessage, LayerHealthStatus } from "../../types";
import { createImapClient } from './imap-client';
import { getYahooEmail, isTokenValid } from './tokens';
import { convertImapMessage } from './utils';

export async function checkHealth(userId: number): Promise<LayerHealthStatus> {
  const startTime = Date.now(); try { const valid = await isTokenValid(userId); if (!valid) return { layer: 'yahoo', healthy: false, lastCheckedAt: new Date(), errorMessage: 'No valid tokens', responseTimeMs: Date.now() - startTime }; return { layer: 'yahoo', healthy: true, lastCheckedAt: new Date(), responseTimeMs: Date.now() - startTime }; } catch (error: any) { return { layer: 'yahoo', healthy: false, lastCheckedAt: new Date(), errorMessage: error?.message || 'Unknown error', responseTimeMs: Date.now() - startTime }; }
}

export async function fetchThread(userId: number, messageId: string): Promise<{ messages: ProviderMessage[]; threadId: string } | null> {
  let client: ImapFlow | null = null; try { client = await createImapClient(userId); await client.mailboxOpen('INBOX'); const searchResults = await client.search({ or: [{ header: { 'message-id': messageId } }, { header: { 'references': messageId } }, { header: { 'in-reply-to': messageId } }] }); if (searchResults.length === 0) return null; const messages: ProviderMessage[] = [];
  for await (const message of client.fetch(searchResults, { envelope: true, bodyStructure: true, source: true, headers: ['from', 'to', 'cc', 'subject', 'date', 'auto-submitted', 'precedence', 'x-auto-response-suppress'] })) { let bodyText = ''; try { const bodyPart = await client.download(message.uid.toString(), '1'); if (bodyPart?.content) { const chunks: Buffer[] = []; for await (const chunk of bodyPart.content) chunks.push(chunk); bodyText = Buffer.concat(chunks).toString('utf-8'); } } catch {} messages.push(convertImapMessage(message, message.envelope, bodyText)); }
  await client.logout(); return { messages, threadId: messageId }; } catch (error) { console.error('[YahooAdapter] Error fetching thread:', error); if (client) try { await client.logout(); } catch {} return null; }
}

export async function searchMessages(userId: number, query: string, options?: { maxResults?: number; afterDate?: Date }): Promise<ProviderMessage[]> {
  let client: ImapFlow | null = null; try { client = await createImapClient(userId); await client.mailboxOpen('INBOX'); const searchCriteria: any = {}; const fromMatch = query.match(/from:([^\s]+)/i); if (fromMatch) searchCriteria.from = fromMatch[1]; if (options?.afterDate) searchCriteria.since = options.afterDate; const searchResults = await client.search(searchCriteria); if (searchResults.length === 0) { await client.logout(); return []; } const limitedResults = searchResults.slice(0, options?.maxResults || 50); const messages: ProviderMessage[] = [];
  for await (const message of client.fetch(limitedResults, { envelope: true, bodyStructure: true, headers: ['from', 'to', 'cc', 'subject', 'date', 'auto-submitted', 'precedence'] })) { let bodyText = ''; try { const bodyPart = await client.download(message.uid.toString(), '1'); if (bodyPart?.content) { const chunks: Buffer[] = []; for await (const chunk of bodyPart.content) chunks.push(chunk); bodyText = Buffer.concat(chunks).toString('utf-8'); } } catch {} messages.push(convertImapMessage(message, message.envelope, bodyText)); }
  await client.logout(); return messages; } catch (error) { console.error('[YahooAdapter] Error searching messages:', error); if (client) try { await client.logout(); } catch {} return []; }
}
