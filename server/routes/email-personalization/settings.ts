import { Router } from "express";
import { storage } from "../../storage";
import { requireAuth } from "../../auth";
import { insertUserEmailPersonalizationSchema, updateUserEmailPersonalizationSchema } from "@shared/schema";

export const router = Router();

router.get("/email-personalization", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const personalization = await storage.getEmailPersonalization(userId);
    if (!personalization) {
      return res.json({
        exists: false,
        personalization: {
          personalInstructions: null, favoriteEmailSamples: null, signatureBlock: null,
          avoidWords: [], preferredWords: [], maxEmailLength: 150, minEmailLength: 50,
          toneFormality: 5, toneWarmth: 5, toneDirectness: 5, toneHumor: 3, toneUrgency: 3,
          variantDiversity: 5, preferredGreetings: [], avoidGreetings: [], preferredClosings: [],
          avoidClosings: [], preferBulletPoints: false, preferNumberedLists: false,
          preferQuestions: true, preferSingleCTA: true, isEnabled: true, defaultBaseStyle: "balanced",
        },
      });
    }
    res.json({ exists: true, personalization });
  } catch (error: any) {
    console.error("[EmailPersonalization] Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch personalization settings" });
  }
});

router.put("/email-personalization", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const validationResult = insertUserEmailPersonalizationSchema.safeParse({ ...req.body, userId });
    if (!validationResult.success) return res.status(400).json({ error: "Invalid personalization data", details: validationResult.error.flatten() });
    const personalization = await storage.upsertEmailPersonalization(userId, validationResult.data);
    res.json({ success: true, personalization });
  } catch (error: any) {
    console.error("[EmailPersonalization] Error saving settings:", error);
    res.status(500).json({ error: "Failed to save personalization settings" });
  }
});

router.patch("/email-personalization", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const validationResult = updateUserEmailPersonalizationSchema.safeParse(req.body);
    if (!validationResult.success) return res.status(400).json({ error: "Invalid personalization data", details: validationResult.error.flatten() });
    const existing = await storage.getEmailPersonalization(userId);
    if (!existing) {
      const personalization = await storage.upsertEmailPersonalization(userId, { userId, ...validationResult.data });
      return res.json({ success: true, personalization });
    }
    const personalization = await storage.updateEmailPersonalization(userId, validationResult.data);
    res.json({ success: true, personalization });
  } catch (error: any) {
    console.error("[EmailPersonalization] Error updating settings:", error);
    res.status(500).json({ error: "Failed to update personalization settings" });
  }
});
