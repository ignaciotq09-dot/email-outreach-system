import type { Express } from "express";
import { requireAuth } from "../../auth/middleware";
import { getOrCreateQuota } from "../../services/apollo-quota-service";

export function registerQuotaRoutes(app: Express) {
  app.get("/api/leads/quota", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const quota = await getOrCreateQuota(userId);
      
      res.json({
        success: true,
        quota: {
          limit: quota.monthlyLimit,
          used: quota.used,
          remaining: quota.remaining,
          resetDate: quota.resetDate,
          canEnrich: quota.canEnrich,
        },
      });
    } catch (error) {
      console.error('[Leads] Error getting quota:', error);
      res.status(500).json({ error: 'Failed to get quota status' });
    }
  });
}
