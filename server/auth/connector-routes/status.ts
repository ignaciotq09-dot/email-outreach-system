import { Router, Response } from 'express';
import { storage } from '../../storage';
import { requireAuth, getUserFromRequest } from './utils';

const router = Router();

router.get('/gmail/status', requireAuth, async (req: any, res: Response) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.json({ connected: false, email: null });
    }
    const tokens = await storage.getOAuthTokens(user.id, 'gmail');
    res.json({ connected: !!tokens, email: tokens?.email || null });
  } catch (error) {
    console.error('[Connector] Gmail status check error:', error);
    res.status(500).json({ error: 'Failed to check Gmail status' });
  }
});

router.get('/outlook/status', requireAuth, async (req: any, res: Response) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.json({ connected: false, email: null });
    }
    const tokens = await storage.getOAuthTokens(user.id, 'outlook');
    res.json({ connected: !!tokens, email: tokens?.email || null });
  } catch (error) {
    console.error('[Connector] Outlook status check error:', error);
    res.status(500).json({ error: 'Failed to check Outlook status' });
  }
});

router.get('/yahoo/status', requireAuth, async (req: any, res: Response) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.json({ connected: false, email: null });
    }
    const tokens = await storage.getOAuthTokens(user.id, 'yahoo');
    res.json({ connected: !!tokens, email: tokens?.email || null });
  } catch (error) {
    console.error('[Connector] Yahoo status check error:', error);
    res.status(500).json({ error: 'Failed to check Yahoo status' });
  }
});

router.post('/disconnect/:provider', requireAuth, async (req: any, res: Response) => {
  try {
    const { provider } = req.params;
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (provider !== 'gmail' && provider !== 'outlook' && provider !== 'yahoo') {
      return res.status(400).json({ error: 'Invalid provider' });
    }
    
    console.log('[Connector] Disconnecting provider:', provider, 'for user:', user.id);
    await storage.deleteOAuthTokens(user.id, provider);
    console.log('[Connector] Provider disconnected successfully');
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Connector] Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect provider' });
  }
});

export default router;
