import { ImapFlow } from 'imapflow';
import { getAccessToken, getYahooUserEmail } from './tokens';

async function createIMAPClient(userId: number): Promise<ImapFlow> {
  const accessToken = await getAccessToken(userId); const fromEmail = await getYahooUserEmail(userId); if (!fromEmail) throw new Error('Could not determine Yahoo email address');
  const client = new ImapFlow({ host: 'imap.mail.yahoo.com', port: 993, secure: true, auth: { user: fromEmail, accessToken: accessToken }, logger: false }); await client.connect(); return client;
}

export async function listMessages(userId: number, maxResults: number = 50) {
  const client = await createIMAPClient(userId); try { await client.mailboxOpen('INBOX'); const messages = []; for await (let message of client.fetch('1:*', { envelope: true, uid: true }, { uid: true })) { messages.push({ id: message.uid.toString(), subject: message.envelope.subject, from: message.envelope.from?.[0]?.address || '', date: message.envelope.date }); if (messages.length >= maxResults) break; } return messages.reverse(); } finally { await client.logout(); }
}

export async function getMessage(userId: number, messageId: string) {
  const client = await createIMAPClient(userId); try { await client.mailboxOpen('INBOX'); const message = await client.fetchOne(messageId, { envelope: true, bodyStructure: true, source: true }, { uid: true }); return { id: messageId, subject: message.envelope.subject, from: message.envelope.from?.[0]?.address || '', date: message.envelope.date, body: message.source?.toString() || '' }; } finally { await client.logout(); }
}

export async function checkInboxForContactEmails(userId: number, contactEmail: string, afterDate?: Date, originalSubject?: string): Promise<any[]> {
  const client = await createIMAPClient(userId); try { await client.mailboxOpen('INBOX'); const searchCriteria: any = { from: contactEmail }; if (afterDate) searchCriteria.since = afterDate; const uids = await client.search(searchCriteria, { uid: true }); const replies = [];
  for (let uid of uids) { const message = await client.fetchOne(uid.toString(), { envelope: true, bodyStructure: true, uid: true }, { uid: true }); replies.push({ id: message.uid.toString(), from: message.envelope.from?.[0]?.address || '', subject: message.envelope.subject || '', date: message.envelope.date, messageId: message.envelope.messageId || '', inReplyTo: message.envelope.inReplyTo || '' }); } return replies; } catch (error) { console.error('Error checking for replies in Yahoo:', error); return []; } finally { await client.logout(); }
}

export async function checkThreadForReplies(userId: number, threadId: string, originalMessageId: string) {
  const client = await createIMAPClient(userId); try { await client.mailboxOpen('INBOX'); const uids = await client.search({ or: [{ header: ['message-id', threadId] }, { header: ['in-reply-to', threadId] }, { header: ['references', threadId] }] }, { uid: true }); const messages = [];
  for (let uid of uids) { const message = await client.fetchOne(uid.toString(), { envelope: true, uid: true }, { uid: true }); messages.push({ id: message.uid.toString(), from: message.envelope.from?.[0]?.address || '', subject: message.envelope.subject || '', date: message.envelope.date, messageId: message.envelope.messageId || '' }); } return messages; } catch (error) { console.error('Error getting thread messages from Yahoo:', error); return []; } finally { await client.logout(); }
}
