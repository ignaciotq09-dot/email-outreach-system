import { Response } from "express";
import { z } from "zod";
import { getSearchSuggestions, saveSearch, getSavedSearches, deleteSavedSearch } from "../../services/ai-search/search-service";

export async function handleGetSuggestions(req: any, res: Response) {
  try { const userId = req.session.userId as number; if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' }); const suggestions = await getSearchSuggestions(userId); res.json({ success: true, data: suggestions }); } catch (error: any) { console.error("[AISearchRoutes] Suggestions error:", error); res.status(400).json({ success: false, error: error.message || "Failed to get suggestions" }); }
}

export async function handleGetSaved(req: any, res: Response) {
  try { const userId = req.session.userId as number; if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' }); const saved = await getSavedSearches(userId); res.json({ success: true, data: saved }); } catch (error: any) { console.error("[AISearchRoutes] Saved searches error:", error); res.status(400).json({ success: false, error: error.message || "Failed to get saved searches" }); }
}

export async function handleSaveSearch(req: any, res: Response) {
  try { const userId = req.session.userId as number; if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const schema = z.object({ sessionId: z.number().int().positive(), name: z.string().min(1).max(100) });
  const { sessionId, name } = schema.parse(req.body);
  const result = await saveSearch(userId, sessionId, name);
  res.json({ success: true, data: result }); } catch (error: any) { console.error("[AISearchRoutes] Save search error:", error); res.status(400).json({ success: false, error: error.message || "Failed to save search" }); }
}

export async function handleDeleteSaved(req: any, res: Response) {
  try { const userId = req.session.userId as number; if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' }); const patternId = parseInt(req.params.patternId, 10); if (isNaN(patternId)) return res.status(400).json({ success: false, error: "Invalid pattern ID" }); await deleteSavedSearch(userId, patternId); res.json({ success: true }); } catch (error: any) { console.error("[AISearchRoutes] Delete saved search error:", error); res.status(400).json({ success: false, error: error.message || "Failed to delete saved search" }); }
}
