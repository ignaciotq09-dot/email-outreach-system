import { google } from 'googleapis';
import type { gmail_v1 } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('Replit authentication token not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected. Please connect Gmail through Replit integrations.');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getGmailClient(): Promise<gmail_v1.Gmail> {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Check if Gmail is connected
export async function isGmailConnected(): Promise<boolean> {
  try {
    await getAccessToken();
    return true;
  } catch (error) {
    return false;
  }
}

// Get connected Gmail email address
export async function getGmailEmail(): Promise<string | null> {
  try {
    const gmail = await getGmailClient();
    const profile = await gmail.users.getProfile({ userId: 'me' });
    return profile.data.emailAddress || null;
  } catch (error) {
    console.error('[Replit Gmail] Error getting email:', error);
    return null;
  }
}

// Send an email using Replit's Gmail integration
export async function sendGmailEmail(params: {
  to: string;
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
  threadId?: string;
}): Promise<{ id: string; threadId: string }> {
  const gmail = await getGmailClient();
  
  // Get sender email if not provided
  const fromEmail = params.from || await getGmailEmail();
  if (!fromEmail) {
    throw new Error('Could not determine sender email address');
  }
  
  // Create email message
  const messageParts = [
    `From: ${fromEmail}`,
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
  ];
  
  if (params.replyTo) {
    messageParts.push(`Reply-To: ${params.replyTo}`);
  }
  
  if (params.threadId) {
    messageParts.push(`In-Reply-To: ${params.threadId}`);
    messageParts.push(`References: ${params.threadId}`);
  }
  
  messageParts.push('Content-Type: text/plain; charset=utf-8');
  messageParts.push('');
  messageParts.push(params.body);
  
  const message = messageParts.join('\r\n');
  const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
      threadId: params.threadId
    }
  });
  
  return {
    id: result.data.id!,
    threadId: result.data.threadId!
  };
}

// Get Gmail inbox messages
export async function getGmailInbox(params?: {
  query?: string;
  maxResults?: number;
}): Promise<gmail_v1.Schema$Message[]> {
  const gmail = await getGmailClient();
  
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: params?.query || 'in:inbox',
    maxResults: params?.maxResults || 50
  });
  
  if (!response.data.messages) {
    return [];
  }
  
  // Fetch full message details
  const messages = await Promise.all(
    response.data.messages.map(async (msg) => {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!
      });
      return fullMessage.data;
    })
  );
  
  return messages;
}

// Check for replies to a sent email
export async function checkForReplies(threadId: string): Promise<gmail_v1.Schema$Message[]> {
  const gmail = await getGmailClient();
  
  const thread = await gmail.users.threads.get({
    userId: 'me',
    id: threadId
  });
  
  if (!thread.data.messages) {
    return [];
  }
  
  // Return all messages except the first one (which is usually the sent message)
  return thread.data.messages.slice(1);
}