/**
 * Email Composer - Technical Email Enhancements
 * Creates RFC-compliant multipart emails with proper headers
 */

export interface EmailOptions {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  replyTo?: string;
  unsubscribeUrl?: string;
  customHeaders?: Record<string, string>;
}

/**
 * Convert plain text to simple HTML
 */
function textToHtml(text: string): string {
  return text
    .split('\n\n')
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

/**
 * Create a multipart email with both plain text and HTML versions
 * Follows RFC 2046 (MIME) and RFC 2822 (Internet Message Format)
 */
export function composeMultipartEmail(options: EmailOptions): string {
  const { to, subject, textBody, htmlBody, replyTo, unsubscribeUrl, customHeaders } = options;
  
  // Generate boundary for multipart message
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // Build headers
  const headers: string[] = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  
  // Add Reply-To header if provided
  if (replyTo) {
    headers.push(`Reply-To: ${replyTo}`);
  }
  
  // Add List-Unsubscribe header if unsubscribe URL provided
  // For Gmail one-click: URL should include email as query param
  if (unsubscribeUrl) {
    // Ensure the URL includes the recipient's email for one-click
    const separator = unsubscribeUrl.includes('?') ? '&' : '?';
    const fullUnsubscribeUrl = `${unsubscribeUrl}${separator}email=${encodeURIComponent(to)}`;
    headers.push(`List-Unsubscribe: <${fullUnsubscribeUrl}>`);
    headers.push(`List-Unsubscribe-Post: List-Unsubscribe=One-Click`);
  }
  
  // Add custom headers
  if (customHeaders) {
    Object.entries(customHeaders).forEach(([key, value]) => {
      headers.push(`${key}: ${value}`);
    });
  }
  
  // Build message parts
  const parts: string[] = [];
  
  // Plain text part
  parts.push(
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    '',
    textBody
  );
  
  // HTML part (use provided HTML or auto-convert from text)
  const finalHtmlBody = htmlBody || textToHtml(textBody);
  parts.push(
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    '',
    finalHtmlBody
  );
  
  // Closing boundary
  parts.push(`--${boundary}--`);
  
  // Combine headers and body
  return [...headers, '', ...parts].join('\n');
}

/**
 * Create a simple plain text email (for compatibility)
 */
export function composePlainEmail(
  to: string, 
  subject: string, 
  body: string,
  replyTo?: string
): string {
  const headers: string[] = [
    `To: ${to}`,
    `Subject: ${subject}`,
  ];
  
  if (replyTo) {
    headers.push(`Reply-To: ${replyTo}`);
  }
  
  return [...headers, '', body].join('\n');
}

/**
 * Create an email for reply in thread
 */
export function composeReplyEmail(options: {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  threadId: string;
  messageId?: string;
  replyTo?: string;
}): string {
  const { to, subject, textBody, htmlBody, threadId, messageId, replyTo } = options;
  
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  const headers: string[] = [
    `To: ${to}`,
    `Subject: Re: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    `In-Reply-To: ${messageId || threadId}`,
    `References: ${messageId || threadId}`,
  ];
  
  if (replyTo) {
    headers.push(`Reply-To: ${replyTo}`);
  }
  
  const parts: string[] = [];
  
  // Plain text part
  parts.push(
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    '',
    textBody
  );
  
  // HTML part
  const finalHtmlBody = htmlBody || textToHtml(textBody);
  parts.push(
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    '',
    finalHtmlBody
  );
  
  parts.push(`--${boundary}--`);
  
  return [...headers, '', ...parts].join('\n');
}
