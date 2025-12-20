import { Response } from "express";
import { z } from "zod";
import { aiSearch, refineSearch, undoRefinement, parseQuery } from "../../services/ai-search/search-service";

export async function handleSearch(req: any, res: Response) {
  try { const userId = req.session.userId as number; if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const schema = z.object({ query: z.string().min(1).max(500), page: z.number().int().positive().optional().default(1), perPage: z.number().int().min(1).max(100).optional().default(25), useIcpScoring: z.boolean().optional().default(true) });
  const { query, page, perPage, useIcpScoring } = schema.parse(req.body);
  console.log(`[AISearchRoutes] User ${userId} searching: "${query}"`);
  const result = await aiSearch(userId, query, { page, perPage, useIcpScoring });
  res.json({ success: true, data: result }); } catch (error: any) { console.error("[AISearchRoutes] Search error:", error); res.status(400).json({ success: false, error: error.message || "Search failed" }); }
}

export async function handleRefine(req: any, res: Response) {
  try { const userId = req.session.userId as number; if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const schema = z.object({ sessionId: z.number().int().positive(), command: z.string().min(1).max(500), page: z.number().int().positive().optional().default(1), perPage: z.number().int().min(1).max(100).optional().default(25) });
  const { sessionId, command, page, perPage } = schema.parse(req.body);
  console.log(`[AISearchRoutes] User ${userId} refining session ${sessionId}: "${command}"`);
  const result = await refineSearch(userId, sessionId, command, { page, perPage });
  res.json({ success: true, data: result }); } catch (error: any) { console.error("[AISearchRoutes] Refine error:", error); res.status(400).json({ success: false, error: error.message || "Refinement failed" }); }
}

export async function handleUndo(req: any, res: Response) {
  try { const userId = req.session.userId as number; if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const schema = z.object({ sessionId: z.number().int().positive(), page: z.number().int().positive().optional().default(1), perPage: z.number().int().min(1).max(100).optional().default(25) });
  const { sessionId, page, perPage } = schema.parse(req.body);
  const result = await undoRefinement(userId, sessionId, { page, perPage });
  res.json({ success: true, data: result }); } catch (error: any) { console.error("[AISearchRoutes] Undo error:", error); res.status(400).json({ success: false, error: error.message || "Undo failed" }); }
}

export async function handleParse(req: any, res: Response) {
  try { const userId = req.session.userId as number; if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const schema = z.object({ query: z.string().min(1).max(500) });
  const { query } = schema.parse(req.body);
  const result = await parseQuery(query);
  res.json({ success: true, data: result }); } catch (error: any) { console.error("[AISearchRoutes] Parse error:", error); res.status(400).json({ success: false, error: error.message || "Parse failed" }); }
}
