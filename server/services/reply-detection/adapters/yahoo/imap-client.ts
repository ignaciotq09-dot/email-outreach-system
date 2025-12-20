import { ImapFlow } from 'imapflow';
import { getAccessToken, getYahooEmail } from './tokens';

export async function createImapClient(userId: number): Promise<ImapFlow> {
  const accessToken = await getAccessToken(userId); const email = await getYahooEmail(userId); if (!email) throw new Error('Could not determine Yahoo email address');
  const client = new ImapFlow({ host: 'imap.mail.yahoo.com', port: 993, secure: true, auth: { user: email, accessToken: accessToken }, logger: false }); await client.connect(); return client;
}
