import type { Express } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { monitoringSettings } from "@shared/schema";
import { insertMonitoringSettingsSchema } from "./validation-schemas";
import { monitoringService } from "../monitoring-service";

export function registerMonitoringRoutes(app: Express) {
  // GET /api/monitoring/settings - Get current monitoring settings
  app.get("/api/monitoring/settings", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.json({
          enabled: true,
          smsPhoneNumber: null,
          lastScanTime: null,
          scanIntervalMinutes: 30,
        });
      }
      
      console.log('[MonitoringSettings] Fetching monitoring settings for user:', userId);
      
      const [settings] = await db
        .select()
        .from(monitoringSettings)
        .where(eq(monitoringSettings.userId, userId))
        .limit(1);

      if (!settings) {
        console.log('[MonitoringSettings] No settings found, returning defaults');
        return res.json({
          enabled: true,
          smsPhoneNumber: null,
          lastScanTime: null,
          scanIntervalMinutes: 30,
        });
      }

      console.log('[MonitoringSettings] Settings retrieved successfully');
      res.json(settings);
    } catch (error) {
      console.error('[MonitoringSettings] Error fetching monitoring settings:', error);
      res.status(500).json({ error: 'Failed to fetch monitoring settings' });
    }
  });

  // POST /api/monitoring/settings - Update monitoring settings
  app.post("/api/monitoring/settings", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      console.log('[MonitoringSettings] Updating monitoring settings for user:', userId);
      
      const validatedData = insertMonitoringSettingsSchema.parse({
        userId: userId,
        enabled: req.body.enabled,
        smsPhoneNumber: req.body.smsPhoneNumber,
        scanIntervalMinutes: req.body.scanIntervalMinutes || 30,
      });

      const [existingSettings] = await db
        .select()
        .from(monitoringSettings)
        .where(eq(monitoringSettings.userId, userId))
        .limit(1);

      let updatedSettings;
      if (existingSettings) {
        [updatedSettings] = await db
          .update(monitoringSettings)
          .set({
            enabled: validatedData.enabled,
            smsPhoneNumber: validatedData.smsPhoneNumber,
            scanIntervalMinutes: validatedData.scanIntervalMinutes,
            updatedAt: new Date(),
          })
          .where(eq(monitoringSettings.userId, userId))
          .returning();
      } else {
        [updatedSettings] = await db
          .insert(monitoringSettings)
          .values(validatedData)
          .returning();
      }

      console.log('[MonitoringSettings] Settings updated successfully');
      res.json(updatedSettings);
    } catch (error: any) {
      console.error('[MonitoringSettings] Error updating monitoring settings:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid settings data', 
          details: error.errors 
        });
      }
      res.status(500).json({ error: 'Failed to update monitoring settings' });
    }
  });

  // POST /api/monitoring/scan - Manually trigger a scan for replies
  app.post("/api/monitoring/scan", async (req, res) => {
    try {
      const userId = req.session?.userId;
      console.log('[MonitoringScan] Manual scan triggered by user:', userId);
      
      const result = await monitoringService.scanForReplies();
      
      if (userId) {
        await db
          .update(monitoringSettings)
          .set({ lastScanTime: new Date() })
          .where(eq(monitoringSettings.userId, userId));
      }

      console.log('[MonitoringScan] Scan completed:', {
        newReplies: result.newReplies,
        smsNotificationsSent: result.smsNotificationsSent,
        appointmentsDetected: result.appointmentsDetected,
        errors: result.errors.length,
      });

      res.json({
        success: true,
        newReplies: result.newReplies,
        smsNotificationsSent: result.smsNotificationsSent,
        appointmentsDetected: result.appointmentsDetected,
        errors: result.errors,
      });
    } catch (error) {
      console.error('[MonitoringScan] Error during manual scan:', error);
      res.status(500).json({ 
        error: 'Failed to scan for replies',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
