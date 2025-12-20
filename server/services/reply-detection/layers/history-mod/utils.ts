export function extractEmailFromHeader(value: string): string { const match = value.match(/<([^>]+)>/) || value.match(/([^\s]+@[^\s]+)/); return match ? match[1].toLowerCase().trim() : value.toLowerCase().trim(); }

export function isMessageFromContact(headers: Array<{ name: string; value: string }>, contactEmail: string, userEmail: string): boolean { const fromHeader = headers.find(h => h.name.toLowerCase() === "from"); const toHeader = headers.find(h => h.name.toLowerCase() === "to"); if (!fromHeader || !toHeader) return false; const fromEmail = extractEmailFromHeader(fromHeader.value); const toEmail = extractEmailFromHeader(toHeader.value); return fromEmail === contactEmail.toLowerCase() && toEmail === userEmail.toLowerCase(); }

export function decodeBase64Url(data: string): string { try { const base64 = data.replace(/-/g, '+').replace(/_/g, '/'); return Buffer.from(base64, 'base64').toString('utf-8'); } catch { return ''; } }

export function extractTextFromParts(parts: any[]): string { let text = ''; for (const part of parts) { if (part.mimeType === 'text/plain' && part.body?.data) { text += decodeBase64Url(part.body.data); } else if (part.parts) { text += extractTextFromParts(part.parts); } } return text; }
