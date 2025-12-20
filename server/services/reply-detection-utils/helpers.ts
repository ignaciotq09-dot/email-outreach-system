import type { gmail_v1 } from 'googleapis';

export function isAutoReplyMessage(headers: gmail_v1.Schema$MessagePartHeader[]): boolean { const autoReplyHeaders = ['X-Autoreply', 'Auto-Submitted', 'X-Autorespond', 'Precedence']; for (const header of headers) { const name = header.name?.toLowerCase(); const value = header.value?.toLowerCase(); if (name === 'x-autoreply' && value === 'yes') return true; if (name === 'auto-submitted' && value !== 'no') return true; if (name === 'x-autorespond') return true; if (name === 'precedence' && (value === 'bulk' || value === 'list')) return true; if (name === 'subject') { const oooKeywords = ['out of office', 'automatic reply', 'auto-reply', 'away from office']; if (oooKeywords.some(keyword => value?.includes(keyword))) return true; } } return false; }

export function extractSenderEmail(fromHeader: string): string { const match = fromHeader.match(/<(.+?)>/) || fromHeader.match(/([^\s<>]+@[^\s<>]+)/); return match ? match[1].toLowerCase().trim() : fromHeader.toLowerCase().trim(); }

export function emailsMatch(email1: string, email2: string): boolean { return email1.toLowerCase().trim() === email2.toLowerCase().trim(); }

export function decodeBase64Url(data: string): string { try { const base64 = data.replace(/-/g, '+').replace(/_/g, '/'); return Buffer.from(base64, 'base64').toString('utf-8'); } catch (error) { console.error('[ReplyDetection] Error decoding base64url:', error); return ''; } }

export function extractMessageContent(payload: gmail_v1.Schema$MessagePart): string { let content = ''; if (payload.body?.data) content = decodeBase64Url(payload.body.data); if (payload.parts && payload.parts.length > 0) { const textPart = payload.parts.find(p => p.mimeType === 'text/plain'); const htmlPart = payload.parts.find(p => p.mimeType === 'text/html'); if (textPart?.body?.data) content = decodeBase64Url(textPart.body.data); else if (htmlPart?.body?.data) content = decodeBase64Url(htmlPart.body.data); else { for (const part of payload.parts) { if (part.parts) { const nestedContent = extractMessageContent(part); if (nestedContent) { content = nestedContent; break; } } } } } return content.trim(); }

export function stripQuotedContent(content: string): string { const lines = content.split('\n'); const cleanLines: string[] = []; for (const line of lines) { const isQuoted = line.startsWith('>') || line.match(/^On .+wrote:/) || line.match(/^-+Original Message-+/) || line.match(/^From:.*@/); if (!isQuoted) cleanLines.push(line); else break; } return cleanLines.join('\n').trim(); }
