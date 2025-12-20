/**
 * Utility functions for reply detection
 */

import { gmail_v1 } from "googleapis";

/**
 * Extract email address from various formats like "Name <email@domain.com>"
 */
export function extractEmailFromString(str: string): string {
  const match = str.match(/<(.+?)>/) || str.match(/([^\s]+@[^\s]+)/);
  return match ? match[1].toLowerCase() : str.toLowerCase();
}

/**
 * Check if two emails match (handles plus-tag aliases)
 */
export function emailsMatchLoose(email1: string, email2: string): boolean {
  const e1 = extractEmailFromString(email1);
  const e2 = extractEmailFromString(email2);
  
  // Exact match
  if (e1 === e2) return true;
  
  // Check if one is a plus-tag alias of the other
  const e1Base = e1.split('+')[0];
  const e2Base = e2.split('+')[0];
  const e1Domain = e1.split('@')[1];
  const e2Domain = e2.split('@')[1];
  
  if (e1Domain === e2Domain && e1Base === e2Base) return true;
  
  return false;
}

/**
 * Decode base64url content from Gmail API
 */
export function decodeBase64Url(data: string): string {
  try {
    return Buffer.from(data, 'base64url').toString('utf-8');
  } catch {
    return Buffer.from(data, 'base64').toString('utf-8');
  }
}

/**
 * Extract readable message content from Gmail message payload
 */
export function extractMessageContent(payload: gmail_v1.Schema$MessagePart): string {
  let content = '';

  if (payload.body?.data) {
    content = decodeBase64Url(payload.body.data);
  }

  if (payload.parts && payload.parts.length > 0) {
    const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
    const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');

    if (textPart?.body?.data) {
      content = decodeBase64Url(textPart.body.data);
    } else if (htmlPart?.body?.data) {
      content = decodeBase64Url(htmlPart.body.data);
    } else {
      for (const part of payload.parts) {
        if (part.parts) {
          const nestedContent = extractMessageContent(part);
          if (nestedContent) {
            content = nestedContent;
            break;
          }
        }
      }
    }
  }

  return content;
}

/**
 * Check if a message is an auto-reply (out of office, vacation, etc.)
 */
export function isAutoReply(headers: gmail_v1.Schema$MessagePartHeader[]): boolean {
  for (const header of headers) {
    const name = header.name?.toLowerCase();
    const value = header.value?.toLowerCase();

    if (name === 'x-autoreply' && value === 'yes') return true;
    if (name === 'auto-submitted' && value !== 'no') return true;
    if (name === 'x-autorespond') return true;
    if (name === 'precedence' && (value === 'bulk' || value === 'list')) return true;

    if (name === 'subject') {
      const oooKeywords = ['out of office', 'automatic reply', 'auto-reply', 'away from office'];
      if (oooKeywords.some(keyword => value?.includes(keyword))) {
        return true;
      }
    }
  }

  return false;
}