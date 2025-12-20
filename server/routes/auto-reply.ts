import type { Express, Request, Response } from "express";
import { requireAuth } from "../auth/middleware";
import { 
  getAutoReplySettings, 
  updateAutoReplySettings, 
  getAutoReplyLogs,
  analyzeReplyIntentOnly 
} from "../services/auto-reply";
import { detectIntentBulletproof } from "../ai/bulletproof-intent-detection";

export function registerAutoReplyRoutes(app: Express) {
  app.get("/api/auto-reply/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const settings = await getAutoReplySettings(userId);
      res.json(settings);
    } catch (error: any) {
      console.error('[AutoReply] Error fetching settings:', error.message);
      res.status(500).json({ error: 'Failed to fetch auto-reply settings' });
    }
  });

  app.post("/api/auto-reply/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { enabled, bookingLink, customMessage } = req.body;

      if (enabled && !bookingLink) {
        return res.status(400).json({ 
          error: 'Booking link is required when enabling auto-reply' 
        });
      }

      await updateAutoReplySettings(userId, { enabled, bookingLink, customMessage });
      
      console.log(`[AutoReply] User ${userId}: Updated settings - enabled: ${enabled}, link: ${bookingLink ? 'set' : 'not set'}`);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('[AutoReply] Error updating settings:', error.message);
      res.status(500).json({ error: 'Failed to update auto-reply settings' });
    }
  });

  app.get("/api/auto-reply/logs", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await getAutoReplyLogs(userId, limit);
      
      res.json({ logs });
    } catch (error: any) {
      console.error('[AutoReply] Error fetching logs:', error.message);
      res.status(500).json({ error: 'Failed to fetch auto-reply logs' });
    }
  });

  app.post("/api/auto-reply/analyze", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { content } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Content is required' });
      }

      const intent = await analyzeReplyIntentOnly(content);
      
      res.json({ intent });
    } catch (error: any) {
      console.error('[AutoReply] Error analyzing intent:', error.message);
      res.status(500).json({ error: 'Failed to analyze reply intent' });
    }
  });

  app.post("/api/auto-reply/test-bulletproof", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { content } = req.body;
      
      if (content && typeof content === 'string') {
        console.log(`[AutoReplyTest] Testing single email for user ${userId}`);
        const result = await detectIntentBulletproof(content);
        return res.json({ 
          testType: 'single',
          input: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          result 
        });
      }

      const testCases = [
        { label: "Clear YES - Let's chat", content: "Yes, let's chat! I'm free next week." },
        { label: "Clear YES - Sounds good", content: "Sounds good, I'm interested in learning more. Let's schedule a call!" },
        { label: "Clear YES - Love to", content: "I would love to discuss this further. When are you available?" },
        { label: "Interested but question", content: "Interesting, but how much does this cost?" },
        { label: "Maybe later", content: "Not now, maybe later after Q1." },
        { label: "Clear NO", content: "Not interested, please remove me from your list." },
        { label: "Out of office", content: "I'm out of the office until Jan 5th. I'll get back to you then." },
        { label: "Polite but unsure", content: "Thanks for reaching out. I'll think about it and let you know." },
        { label: "Yes with constraint", content: "Yes, but I'm traveling until next month. Can we reconnect then?" },
        { label: "Question only", content: "What's the pricing? Can you send me more details?" },
      ];

      console.log(`[AutoReplyTest] Running comprehensive test suite for user ${userId}`);
      const results = [];

      for (const testCase of testCases) {
        try {
          const result = await detectIntentBulletproof(testCase.content);
          results.push({
            label: testCase.label,
            input: testCase.content,
            decision: result.finalVerdict.decision,
            shouldAutoReply: result.finalVerdict.shouldAutoReply,
            confidence: result.finalVerdict.confidence,
            pass1: { type: result.pass1.intentType, confidence: result.pass1.confidence },
            pass2: { type: result.pass2.intentType, confidence: result.pass2.confidence },
            patterns: result.patternValidation.patterns,
            reasoning: result.finalVerdict.reasoning
          });
        } catch (error: any) {
          results.push({
            label: testCase.label,
            input: testCase.content,
            error: error.message
          });
        }
      }

      const summary = {
        total: results.length,
        autoReply: results.filter(r => r.shouldAutoReply).length,
        flagged: results.filter(r => r.decision === 'flag_for_review').length,
        noAction: results.filter(r => r.decision === 'no_action').length,
        errors: results.filter(r => r.error).length
      };

      console.log(`[AutoReplyTest] Test complete:`, summary);

      res.json({ 
        testType: 'comprehensive',
        summary,
        results 
      });
    } catch (error: any) {
      console.error('[AutoReply] Error in test endpoint:', error.message);
      res.status(500).json({ error: 'Failed to run intent detection tests' });
    }
  });
}
