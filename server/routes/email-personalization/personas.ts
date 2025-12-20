import { Router } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { requireAuth } from "../../auth";
import { updateUserEmailPersonaSchema, DEFAULT_PERSONAS } from "@shared/schema";

export const router = Router();

router.get("/email-personas", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const personas = await storage.getEmailPersonas(userId);
    res.json({ personas });
  } catch (error: any) {
    console.error("[EmailPersonas] Error fetching personas:", error);
    res.status(500).json({ error: "Failed to fetch email personas" });
  }
});

router.get("/email-personas/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const personaId = parseInt(req.params.id);
    if (isNaN(personaId)) return res.status(400).json({ error: "Invalid persona ID" });
    const persona = await storage.getEmailPersonaById(userId, personaId);
    if (!persona) return res.status(404).json({ error: "Persona not found" });
    res.json({ persona });
  } catch (error: any) {
    console.error("[EmailPersonas] Error fetching persona:", error);
    res.status(500).json({ error: "Failed to fetch email persona" });
  }
});

router.post("/email-personas", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const existing = await storage.getEmailPersonas(userId);
    if (existing.length >= 10) return res.status(400).json({ error: "Maximum personas reached", message: "You can have up to 10 personas. Please delete one before adding a new one." });
    const schema = z.object({ name: z.string().min(1).max(100), description: z.string().max(500).optional(), instructions: z.string().max(2000).optional(), toneFormality: z.number().min(1).max(10).optional(), toneWarmth: z.number().min(1).max(10).optional(), toneDirectness: z.number().min(1).max(10).optional(), toneHumor: z.number().min(1).max(10).optional(), toneUrgency: z.number().min(1).max(10).optional(), maxEmailLength: z.number().min(30).max(500).optional(), minEmailLength: z.number().min(20).max(300).optional(), baseStyle: z.string().max(50).optional(), icon: z.string().max(50).optional(), color: z.string().max(20).optional(), isDefault: z.boolean().optional() });
    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) return res.status(400).json({ error: "Invalid persona data", details: validationResult.error.flatten() });
    const shouldBeDefault = validationResult.data.isDefault || existing.length === 0;
    const persona = await storage.createEmailPersona(userId, { ...validationResult.data, isDefault: shouldBeDefault, displayOrder: existing.length });
    res.json({ success: true, persona });
  } catch (error: any) {
    console.error("[EmailPersonas] Error creating persona:", error);
    if (error.code === "23505") return res.status(400).json({ error: "A persona with this name already exists" });
    res.status(500).json({ error: "Failed to create email persona" });
  }
});

router.post("/email-personas/create-defaults", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const existing = await storage.getEmailPersonas(userId);
    if (existing.length > 0) return res.status(400).json({ error: "Personas already exist", message: "Default personas can only be created for users without existing personas." });
    const createdPersonas = [];
    for (let i = 0; i < DEFAULT_PERSONAS.length; i++) {
      const dp = DEFAULT_PERSONAS[i];
      const persona = await storage.createEmailPersona(userId, { name: dp.name, description: dp.description, instructions: dp.instructions, icon: dp.icon, color: dp.color, isDefault: i === 0, displayOrder: i });
      createdPersonas.push(persona);
    }
    res.json({ success: true, personas: createdPersonas });
  } catch (error: any) {
    console.error("[EmailPersonas] Error creating defaults:", error);
    res.status(500).json({ error: "Failed to create default personas" });
  }
});

router.put("/email-personas/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const personaId = parseInt(req.params.id);
    if (isNaN(personaId)) return res.status(400).json({ error: "Invalid persona ID" });
    const validationResult = updateUserEmailPersonaSchema.safeParse(req.body);
    if (!validationResult.success) return res.status(400).json({ error: "Invalid update data", details: validationResult.error.flatten() });
    const persona = await storage.updateEmailPersona(userId, personaId, validationResult.data);
    if (!persona) return res.status(404).json({ error: "Persona not found" });
    res.json({ success: true, persona });
  } catch (error: any) {
    console.error("[EmailPersonas] Error updating persona:", error);
    res.status(500).json({ error: "Failed to update email persona" });
  }
});

router.delete("/email-personas/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const personaId = parseInt(req.params.id);
    if (isNaN(personaId)) return res.status(400).json({ error: "Invalid persona ID" });
    const persona = await storage.getEmailPersonaById(userId, personaId);
    if (persona?.isDefault) return res.status(400).json({ error: "Cannot delete default persona", message: "Set another persona as default before deleting this one." });
    await storage.deleteEmailPersona(userId, personaId);
    res.json({ success: true });
  } catch (error: any) {
    console.error("[EmailPersonas] Error deleting persona:", error);
    res.status(500).json({ error: "Failed to delete email persona" });
  }
});

router.post("/email-personas/:id/set-default", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const personaId = parseInt(req.params.id);
    if (isNaN(personaId)) return res.status(400).json({ error: "Invalid persona ID" });
    const persona = await storage.getEmailPersonaById(userId, personaId);
    if (!persona) return res.status(404).json({ error: "Persona not found" });
    await storage.setDefaultPersona(userId, personaId);
    res.json({ success: true });
  } catch (error: any) {
    console.error("[EmailPersonas] Error setting default:", error);
    res.status(500).json({ error: "Failed to set default persona" });
  }
});
