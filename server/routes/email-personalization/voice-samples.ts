import { Router } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { requireAuth } from "../../auth";
import { analyzeVoiceSample, aggregateVoicePatterns } from "../../ai/voice-analyzer";

export const router = Router();

router.get("/email-personalization/voice-samples", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const samples = await storage.getVoiceSamples(userId);
    res.json({ samples });
  } catch (error: any) {
    console.error("[VoiceSamples] Error fetching samples:", error);
    res.status(500).json({ error: "Failed to fetch voice samples" });
  }
});

router.post("/email-personalization/voice-samples", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const existing = await storage.getVoiceSamples(userId);
    if (existing.length >= 5) return res.status(400).json({ error: "Maximum voice samples reached", message: "You can have up to 5 voice samples. Please delete one before adding a new one." });
    const schema = z.object({ sampleText: z.string().min(50).max(5000), context: z.string().max(100).optional() });
    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) return res.status(400).json({ error: "Invalid voice sample", details: validationResult.error.flatten() });
    const sample = await storage.addVoiceSample(userId, { sampleText: validationResult.data.sampleText, context: validationResult.data.context || null, displayOrder: existing.length });
    res.json({ success: true, sample });
  } catch (error: any) {
    console.error("[VoiceSamples] Error adding sample:", error);
    res.status(500).json({ error: "Failed to add voice sample" });
  }
});

router.put("/email-personalization/voice-samples/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const sampleId = parseInt(req.params.id);
    if (isNaN(sampleId)) return res.status(400).json({ error: "Invalid sample ID" });
    const schema = z.object({ sampleText: z.string().min(50).max(5000).optional(), context: z.string().max(100).optional(), isActive: z.boolean().optional(), extractedCharacteristics: z.any().optional() });
    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) return res.status(400).json({ error: "Invalid update data", details: validationResult.error.flatten() });
    const sample = await storage.updateVoiceSample(userId, sampleId, validationResult.data);
    if (!sample) return res.status(404).json({ error: "Voice sample not found" });
    res.json({ success: true, sample });
  } catch (error: any) {
    console.error("[VoiceSamples] Error updating sample:", error);
    res.status(500).json({ error: "Failed to update voice sample" });
  }
});

router.delete("/email-personalization/voice-samples/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const sampleId = parseInt(req.params.id);
    if (isNaN(sampleId)) return res.status(400).json({ error: "Invalid sample ID" });
    await storage.deleteVoiceSample(userId, sampleId);
    res.json({ success: true });
  } catch (error: any) {
    console.error("[VoiceSamples] Error deleting sample:", error);
    res.status(500).json({ error: "Failed to delete voice sample" });
  }
});

router.post("/email-personalization/voice-samples/:id/analyze", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const sampleId = parseInt(req.params.id);
    if (isNaN(sampleId)) return res.status(400).json({ error: "Invalid sample ID" });
    const samples = await storage.getVoiceSamples(userId);
    const sample = samples.find(s => s.id === sampleId);
    if (!sample) return res.status(404).json({ error: "Voice sample not found" });
    const characteristics = await analyzeVoiceSample(sample.sampleText);
    await storage.updateVoiceSample(userId, sampleId, { extractedCharacteristics: characteristics });
    res.json({ success: true, characteristics });
  } catch (error: any) {
    console.error("[VoiceSamples] Error analyzing sample:", error);
    res.status(500).json({ error: "Failed to analyze voice sample" });
  }
});

router.post("/email-personalization/voice-samples/analyze-all", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const samples = await storage.getVoiceSamples(userId);
    const activeSamples = samples.filter(s => s.isActive);
    if (activeSamples.length === 0) return res.status(400).json({ error: "No active voice samples", message: "Add at least one voice sample to analyze your writing style." });
    const patterns = await aggregateVoicePatterns(activeSamples);
    res.json({ success: true, patterns, samplesAnalyzed: activeSamples.length });
  } catch (error: any) {
    console.error("[VoiceSamples] Error analyzing all samples:", error);
    res.status(500).json({ error: "Failed to analyze voice samples" });
  }
});

router.get("/email-personalization/voice-patterns", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const samples = await storage.getVoiceSamples(userId);
    const activeSamples = samples.filter(s => s.isActive);
    if (activeSamples.length === 0) return res.json({ hasPatterns: false, patterns: null });
    const patterns = await aggregateVoicePatterns(activeSamples);
    res.json({ hasPatterns: true, patterns, samplesCount: activeSamples.length });
  } catch (error: any) {
    console.error("[VoiceSamples] Error getting patterns:", error);
    res.status(500).json({ error: "Failed to get voice patterns" });
  }
});
