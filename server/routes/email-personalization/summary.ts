import { Router } from "express";
import { storage } from "../../storage";
import { requireAuth } from "../../auth";

export const router = Router();

router.get("/email-personalization/summary", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const [personalization, voiceSamples, personas, editHistory] = await Promise.all([
      storage.getEmailPersonalization(userId),
      storage.getVoiceSamples(userId),
      storage.getEmailPersonas(userId),
      storage.getEmailEditHistory(userId, 10),
    ]);
    const defaultPersona = personas.find(p => p.isDefault);
    res.json({
      hasPersonalization: !!personalization,
      isEnabled: personalization?.isEnabled ?? false,
      hasInstructions: !!(personalization?.personalInstructions),
      voiceSamplesCount: voiceSamples.length,
      personasCount: personas.length,
      defaultPersonaName: defaultPersona?.name || null,
      recentEditsCount: editHistory.length,
      toneProfile: personalization ? {
        formality: personalization.toneFormality,
        warmth: personalization.toneWarmth,
        directness: personalization.toneDirectness,
        humor: personalization.toneHumor,
        urgency: personalization.toneUrgency,
      } : null,
    });
  } catch (error: any) {
    console.error("[EmailPersonalization] Error fetching summary:", error);
    res.status(500).json({ error: "Failed to fetch personalization summary" });
  }
});
