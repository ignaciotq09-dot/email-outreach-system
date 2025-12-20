import type { gmail_v1 } from 'googleapis';
import type { MessageAnalysis } from './types';
import { AUTO_REPLY_HEADERS, BOUNCE_INDICATORS } from './types';

export function extractEmail(value: string): string {
  if (!value) return '';
  const match = value.match(/<([^>]+)>/) || value.match(/([^\s]+@[^\s]+)/);
  return match ? match[1].toLowerCase().trim() : value.toLowerCase().trim();
}

export function analyzeMessage(message: gmail_v1.Schema$Message): MessageAnalysis {
  const headers = message.payload?.headers || [];
  const headersMap: Record<string, string> = {};
  for (const h of headers) { if (h.name && h.value) headersMap[h.name.toLowerCase()] = h.value; }
  
  let isAutoReply = false;
  for (const header of AUTO_REPLY_HEADERS) {
    const value = headersMap[header]?.toLowerCase() || '';
    if (header === 'auto-submitted' && value !== 'no' && value) { isAutoReply = true; break; }
    if (header === 'precedence' && ['auto_reply', 'bulk', 'junk'].includes(value)) { isAutoReply = true; break; }
    if (value && header !== 'auto-submitted' && header !== 'precedence') { isAutoReply = true; break; }
  }
  
  const from = extractEmail(headersMap['from'] || '');
  const subject = headersMap['subject'] || '';
  let isBounce = BOUNCE_INDICATORS.some(ind => from.includes(ind) || subject.toLowerCase().includes(ind));
  
  const inReplyTo = headersMap['in-reply-to']?.trim();
  const referencesRaw = headersMap['references'] || '';
  const references = referencesRaw.split(/\s+/).filter(r => r.includes('@'));
  const isReply = !!(inReplyTo || references.length > 0);
  const messageId = headersMap['message-id']?.trim();
  
  let content = '';
  function extractContent(part: gmail_v1.Schema$MessagePart): void {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      content = Buffer.from(part.body.data, 'base64').toString('utf8');
    } else if (part.parts) { for (const p of part.parts) extractContent(p); }
  }
  if (message.payload) extractContent(message.payload);
  if (!content && message.snippet) content = message.snippet;
  
  const receivedAt = headersMap['date'] ? new Date(headersMap['date']) : message.internalDate ? new Date(parseInt(message.internalDate)) : new Date();
  return { isAutoReply, isBounce, isReply, inReplyTo, references, messageId, from, subject, content: content.trim(), receivedAt };
}
