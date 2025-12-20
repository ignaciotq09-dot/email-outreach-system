import { Response } from "express";
import { z } from "zod";
import { recalculateIcpProfile, getIcpProfile } from "../../services/ai-search/icp-learning";
import { recordFeedback } from "../../services/ai-search/search-service";

export async function handleGetIcp(req: any, res: Response) {
  try { const userId = req.session.userId as number; if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' }); const profile = await getIcpProfile(userId); res.json({ success: true, data: profile }); } catch (error: any) { console.error("[AISearchRoutes] ICP error:", error); res.status(400).json({ success: false, error: error.message || "Failed to get ICP profile" }); }
}

export async function handleRecalculateIcp(req: any, res: Response) {
  try { const userId = req.session.userId as number; if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' }); const profile = await recalculateIcpProfile(userId); res.json({ success: true, data: profile }); } catch (error: any) { console.error("[AISearchRoutes] ICP recalculate error:", error); res.status(400).json({ success: false, error: error.message || "Failed to recalculate ICP" }); }
}

export async function handleFeedback(req: any, res: Response) {
  try { const userId = req.session.userId as number; if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const schema = z.object({ feedbackType: z.enum(["thumbs_up", "thumbs_down", "imported", "emailed", "opened", "replied", "converted", "unsubscribed"]), leadAttributes: z.object({ title: z.string().nullable().optional(), seniority: z.string().nullable().optional(), industry: z.string().nullable().optional(), companySize: z.string().nullable().optional(), location: z.string().nullable().optional(), technologies: z.array(z.string()).nullable().optional() }), contactId: z.number().int().positive().optional(), apolloLeadId: z.string().optional(), searchSessionId: z.number().int().positive().optional() });
  const { feedbackType, leadAttributes, contactId, apolloLeadId, searchSessionId } = schema.parse(req.body);
  await recordFeedback(userId, feedbackType, leadAttributes, { contactId, apolloLeadId, searchSessionId });
  res.json({ success: true }); } catch (error: any) { console.error("[AISearchRoutes] Feedback error:", error); res.status(400).json({ success: false, error: error.message || "Failed to record feedback" }); }
}
