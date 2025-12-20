import { Router } from 'express';
import { isGmailConnected, getGmailEmail, sendGmailEmail, getGmailInbox, checkForReplies } from '../services/replit-gmail';

const router = Router();

// Check Gmail connection status
router.get('/api/replit-gmail/status', async (req, res) => {
  try {
    const connected = await isGmailConnected();
    if (connected) {
      const email = await getGmailEmail();
      res.json({ connected: true, email });
    } else {
      res.json({ connected: false, email: null });
    }
  } catch (error) {
    console.error('[Replit Gmail] Status check error:', error);
    res.json({ connected: false, email: null, error: (error as Error).message });
  }
});

// Initiate Gmail connection through Replit
router.get('/api/replit-gmail/connect', async (req, res) => {
  // Redirect to Replit's integration page
  // The user needs to manually connect Gmail through Replit's UI
  res.json({ 
    message: 'Please connect Gmail through the Replit integrations panel',
    instructions: [
      '1. Open the Replit workspace',
      '2. Click on "Tools" in the left sidebar', 
      '3. Select "Integrations"',
      '4. Find "Gmail" and click "Connect"',
      '5. Follow the OAuth flow to authorize Gmail access',
      '6. Return to this app after connection is complete'
    ]
  });
});

// Send email
router.post('/api/replit-gmail/send', async (req, res) => {
  try {
    const { to, subject, body, threadId } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }
    
    const result = await sendGmailEmail({
      to,
      subject,
      body,
      threadId
    });
    
    res.json({ 
      success: true, 
      messageId: result.id, 
      threadId: result.threadId 
    });
  } catch (error) {
    console.error('[Replit Gmail] Send error:', error);
    res.status(500).json({ 
      error: 'Failed to send email', 
      details: (error as Error).message 
    });
  }
});

// Get inbox messages
router.get('/api/replit-gmail/inbox', async (req, res) => {
  try {
    const query = req.query.q as string;
    const maxResults = parseInt(req.query.maxResults as string) || 50;
    
    const messages = await getGmailInbox({ query, maxResults });
    res.json({ messages });
  } catch (error) {
    console.error('[Replit Gmail] Inbox error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch inbox', 
      details: (error as Error).message 
    });
  }
});

// Check for replies to a thread
router.get('/api/replit-gmail/replies/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const replies = await checkForReplies(threadId);
    res.json({ replies });
  } catch (error) {
    console.error('[Replit Gmail] Replies check error:', error);
    res.status(500).json({ 
      error: 'Failed to check replies', 
      details: (error as Error).message 
    });
  }
});

export default router;