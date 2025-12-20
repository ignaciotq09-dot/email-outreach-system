import { Express } from "express";
import { z } from "zod";
import { getSmsSettings, updateSmsSettings, isTwilioConfigured } from "../../services/twilio-sms";
import { requireAuth, smsSettingsSchema } from "./schemas";

export function registerSettingsRoutes(app: Express) {
  app.get("/api/sms/configured", requireAuth, async (req: any, res) => {
    try {
      const configured = isTwilioConfigured();
      const userId = req.session.userId;
      const settings = await getSmsSettings(userId);
      res.json({ configured, userPhoneNumber: settings?.twilioPhoneNumber || null });
    } catch (error) {
      console.error("[SMS] Error checking configuration:", error);
      res.status(500).json({ error: "Failed to check SMS configuration" });
    }
  });

  app.get("/api/sms/settings", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const settings = await getSmsSettings(userId);
      res.json(settings || { twilioPhoneNumber: null, enabled: true });
    } catch (error) {
      console.error("[SMS] Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch SMS settings" });
    }
  });

  app.post("/api/sms/settings", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { twilioPhoneNumber } = smsSettingsSchema.parse(req.body);
      const settings = await updateSmsSettings(userId, twilioPhoneNumber);
      console.log(`[SMS] Updated settings for user ${userId}`);
      res.json(settings);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid settings data", details: error.errors });
      console.error("[SMS] Error updating settings:", error);
      res.status(500).json({ error: "Failed to update SMS settings" });
    }
  });
}
