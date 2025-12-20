import type { Express } from "express";
import { getAvailableIndustries, getCompanySizeOptions } from "../../services/apollo-service";
import { requireAuth } from "../../auth/middleware";

export function registerFilterRoutes(app: Express) {
  app.get("/api/leads/filters", requireAuth, async (req: any, res) => {
    try {
      res.json({ industries: getAvailableIndustries(), companySizes: getCompanySizeOptions() });
    } catch (error) {
      console.error('[Leads] Error getting filters:', error);
      res.status(500).json({ error: 'Failed to get filter options' });
    }
  });

  app.get("/api/leads/status", requireAuth, async (req: any, res) => {
    try {
      const hasApiKey = !!process.env.APOLLO_API_KEY;
      res.json({ configured: hasApiKey, message: hasApiKey ? 'Apollo API is configured and ready' : 'Apollo API key not found. Please add APOLLO_API_KEY to your secrets.' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check status' });
    }
  });
}
