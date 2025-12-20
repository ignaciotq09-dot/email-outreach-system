import type { ProviderMessage } from "../../types";

export function extractEmailFromHeader(value: string): string { if (!value) return ''; const match = value.match(/<([^>]+)>/) || value.match(/([^\s]+@[^\s]+)/); return match ? match[1].toLowerCase().trim() : value.toLowerCase().trim(); }

export function isAutoReplyHeaders(headers: Map<string, string[]>): boolean { const autoSubmitted = headers.get('auto-submitted'); if (autoSubmitted && autoSubmitted[0] !== 'no') return true; const precedence = headers.get('precedence'); if (precedence && ['auto_reply', 'bulk', 'junk'].includes(precedence[0].toLowerCase())) return true; if (headers.has('x-auto-response-suppress') || headers.has('x-autoreply') || headers.has('x-autorespond')) return true; return false; }

export function convertImapMessage(msg: any, envelope: any, bodyText: string): ProviderMessage {
  const fromEmail = envelope.from?.[0]?.address || ''; const toEmail = envelope.to?.[0]?.address || '';
  return { id: msg.uid.toString(), threadId: envelope.messageId || msg.uid.toString(), subject: envelope.subject || '', snippet: bodyText.substring(0, 200), from: fromEmail, to: toEmail, date: envelope.date || new Date(), labelIds: [], rawHeaders: { 'message-id': envelope.messageId, 'in-reply-to': envelope.inReplyTo || undefined, references: envelope.references?.join(' ') || undefined }, bodyText, isRead: true };
}
