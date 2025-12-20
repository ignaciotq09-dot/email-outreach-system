import { Router } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { requireAuth } from "../../auth";
import { analyzeEditPatterns } from "../../ai/voice-analyzer";

export const router = Router();

router.get("/email-personalization/edit-patterns", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const edits = await storage.getEmailEditHistory(userId, 50);
    if (edits.length < 3) return res.json({ hasPatterns: false, message: "Need at least 3 edits to analyze patterns", editsCount: edits.length });
    const patterns = await analyzeEditPatterns(edits.map(e => ({ originalText: e.originalText, editedText: e.editedText })));
    res.json({ hasPatterns: true, patterns, editsAnalyzed: patterns.totalEditsAnalyzed });
  } catch (error: any) {
    console.error("[EmailEdits] Error analyzing patterns:", error);
    res.status(500).json({ error: "Failed to analyze edit patterns" });
  }
});

router.post("/email-edits", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const schema = z.object({ originalText: z.string().min(10), editedText: z.string().min(10), personaId: z.number().optional(), baseStyle: z.string().max(50).optional(), campaignId: z.number().optional(), contactId: z.number().optional() });
    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) return res.status(400).json({ error: "Invalid edit data", details: validationResult.error.flatten() });
    const original = validationResult.data.originalText;
    const edited = validationResult.data.editedText;
    const originalWords = original.split(/\s+/);
    const editedWords = edited.split(/\s+/);
    const originalSet = new Set(originalWords);
    const editedSet = new Set(editedWords);
    const wordsRemoved = originalWords.filter(w => !editedSet.has(w));
    const wordsAdded = editedWords.filter(w => !originalSet.has(w));
    const totalChanges = wordsAdded.length + wordsRemoved.length;
    const avgLength = (originalWords.length + editedWords.length) / 2;
    const editMagnitude = Math.min(1, totalChanges / avgLength);
    const editMetrics = {
      originalWordCount: originalWords.length, editedWordCount: editedWords.length, wordCountChange: editedWords.length - originalWords.length,
      wordsAdded: wordsAdded.slice(0, 20), wordsRemoved: wordsRemoved.slice(0, 20),
      phrasesAdded: [], phrasesRemoved: [], greetingChanged: false, closingChanged: false, structureChanged: false, editMagnitude,
    };
    const edit = await storage.trackEmailEdit(userId, {
      originalText: original, editedText: edited, personaId: validationResult.data.personaId || null,
      baseStyle: validationResult.data.baseStyle || null, editMetrics, campaignId: validationResult.data.campaignId || null, contactId: validationResult.data.contactId || null,
    });
    res.json({ success: true, edit });
  } catch (error: any) {
    console.error("[EmailEdits] Error tracking edit:", error);
    res.status(500).json({ error: "Failed to track email edit" });
  }
});

router.get("/email-edits", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const edits = await storage.getEmailEditHistory(userId, limit);
    res.json({ edits });
  } catch (error: any) {
    console.error("[EmailEdits] Error fetching history:", error);
    res.status(500).json({ error: "Failed to fetch edit history" });
  }
});
