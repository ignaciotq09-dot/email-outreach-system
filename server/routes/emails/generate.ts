import type { Request, Response, Express } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { generateEmailVariantsUltimate, regenerateEmailVariantsUltimate } from "../../ai";
import type { SimplePersonalization } from "../../ai";
import { generateEmailSchema, regenerateEmailSchema } from "../validation-schemas";
import { requireAuth } from "../../auth/middleware";

export function registerGenerateRoutes(app: Express) {
  app.post("/api/emails/generate", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const validatedData = generateEmailSchema.parse(req.body);
      const { baseMessage, writingStyle, variantDiversity } = validatedData;
      console.log('[Generate] User', userId, ': Starting variant generation');
      const preferences = await storage.getEmailPreferences(userId);
      const personalization = await storage.getEmailPersonalization(userId);
      let simplePersonalization: SimplePersonalization | null = null;
      if (personalization?.isEnabled) {
        simplePersonalization = { userInstructions: personalization.personalInstructions || null, favoriteEmailSamples: personalization.favoriteEmailSamples || null, toneFormality: personalization.toneFormality ?? 5, toneWarmth: personalization.toneWarmth ?? 5, toneDirectness: personalization.toneDirectness ?? 5 };
        console.log('[Generate] Simple personalization ACTIVE');
      }
      const result = await generateEmailVariantsUltimate(baseMessage, preferences, writingStyle, { useCache: true, simplePersonalization, variantDiversity: variantDiversity ?? 5 });
      console.log('[Generate] Returning', result.variants.length, 'ultimate variants');
      res.json({ variants: result.variants, scores: result.scores, meta: result.meta });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        console.error('[Generate] Validation error:', error.errors);
        return res.status(400).json({ error: 'Invalid input data', details: error.errors });
      }
      console.error('[Generate] Error generating email variants:', error);
      res.status(500).json({ error: error.message || 'Failed to generate email variants' });
    }
  });

  app.post("/api/emails/regenerate", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const validatedData = regenerateEmailSchema.parse(req.body);
      const { baseMessage, feedback, currentVariants, writingStyle, variantDiversity } = validatedData;
      console.log('[Regenerate] User', userId, ': Starting regeneration with feedback');
      const preferences = await storage.getEmailPreferences(userId);
      const personalization = await storage.getEmailPersonalization(userId);
      let simplePersonalization: SimplePersonalization | null = null;
      if (personalization?.isEnabled) {
        simplePersonalization = { userInstructions: personalization.personalInstructions || null, favoriteEmailSamples: personalization.favoriteEmailSamples || null, toneFormality: personalization.toneFormality ?? 5, toneWarmth: personalization.toneWarmth ?? 5, toneDirectness: personalization.toneDirectness ?? 5 };
        console.log('[Regenerate] Simple personalization ACTIVE');
      }
      const result = await regenerateEmailVariantsUltimate(baseMessage, feedback, currentVariants, preferences, writingStyle, { simplePersonalization, variantDiversity: variantDiversity ?? 5 });
      console.log('[Regenerate] Successfully regenerated', result.variants.length, 'variants');
      res.json({ variants: result.variants, scores: result.scores, meta: result.meta });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        console.error('[Regenerate] Validation error:', error.errors);
        return res.status(400).json({ error: 'Invalid input data', details: error.errors });
      }
      console.error('[Regenerate] Error regenerating email variants:', error);
      res.status(500).json({ error: error.message || 'Failed to regenerate email variants' });
    }
  });
}
