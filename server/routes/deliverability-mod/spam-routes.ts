import type { Request, Response } from 'express';
import { checkSpamScore } from '../../deliverability/spam-checker';

export async function handleSpamCheck(req: Request, res: Response) {
  try { const { subject, body, hasAttachments, linkCount } = req.body; if (!subject || !body) return res.status(400).json({ error: 'Subject and body are required' }); const result = checkSpamScore({ subject, body, hasAttachments, linkCount }); console.log(`[Deliverability] Spam check: score=${result.score}, risk=${result.risk}, issues=${result.issues.length}`); res.json(result); } catch (error) { console.error('[Deliverability] Spam check error:', error); res.status(500).json({ error: 'Failed to check spam score' }); }
}
