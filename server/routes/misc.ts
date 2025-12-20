import type { Express } from "express";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { storage } from "../storage";
import { appointmentRequests } from "@shared/schema";
import { senderInfoSchema, updatePreferencesSchema } from "./validation-schemas";
import { AnalyticsService } from "../analytics";
import { getUncachableGmailClient } from "../gmail";
import { checkEmailAuthentication, detectBounces } from "../deliverability/email-diagnostics";
import { EmailTrackingService } from "../services/email-tracking";
import { requireAuth } from "../auth/middleware";

export function registerMiscRoutes(app: Express) {
  // GET /api/meetings - Get all appointments for the authenticated user (Multi-tenant: userId filter)
  app.get("/api/meetings", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      console.log(`[Meetings] Fetching meetings for user ${userId}`);
      
      const appointments = await db.query.appointmentRequests.findMany({
        where: eq(appointmentRequests.userId, userId),
        with: {
          contact: true,
          reply: true,
        },
        orderBy: [desc(appointmentRequests.detectedAt)],
      });

      console.log(`[Meetings] Retrieved ${appointments.length} meetings for user ${userId}`);
      res.json(appointments);
    } catch (error) {
      console.error('[Meetings] Error fetching meetings:', error);
      res.status(500).json({ error: 'Failed to fetch meetings' });
    }
  });

  // GET /api/settings/preferences - Get email preferences (Multi-tenant: userId filter)
  app.get("/api/settings/preferences", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const preferences = await storage.getEmailPreferences(userId);
      if (!preferences) {
        return res.json({
          tonePreference: '',
          lengthPreference: '',
          styleNotes: '',
          defaultSignature: '',
        });
      }
      res.json(preferences);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  });

  // PATCH /api/settings/preferences - Update email preferences (Multi-tenant: userId filter)
  app.patch("/api/settings/preferences", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const validatedData = updatePreferencesSchema.parse(req.body);
      
      const preferences = await storage.saveEmailPreferences(userId, validatedData);
      
      res.json(preferences);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid preferences data', 
          details: error.errors 
        });
      }
      console.error('Error updating preferences:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  });

  // GET /api/preferences - Get email preferences (Multi-tenant: userId filter)
  app.get("/api/preferences", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const preferences = await storage.getEmailPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  });

  // POST /api/preferences/sender-info - Update sender name and phone (Multi-tenant: userId filter)
  app.post("/api/preferences/sender-info", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const validatedData = senderInfoSchema.parse(req.body);
      const { senderName, senderPhone } = validatedData;

      console.log(`[SenderInfo] Updating sender information for user ${userId}`);

      const existingPrefs = await storage.getEmailPreferences(userId);
      
      const updatedPrefs = {
        tonePreference: existingPrefs?.tonePreference || "professional",
        lengthPreference: existingPrefs?.lengthPreference || "medium",
        styleNotes: existingPrefs?.styleNotes || null,
        senderName,
        senderPhone,
      };

      const preferences = await storage.saveEmailPreferences(userId, updatedPrefs);
      console.log(`[SenderInfo] Successfully updated sender information for user ${userId}`);
      res.json(preferences);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        console.error('[SenderInfo] Validation error:', error.errors);
        return res.status(400).json({ 
          error: 'Invalid input data', 
          details: error.errors 
        });
      }
      console.error('[SenderInfo] Error updating sender info:', error);
      res.status(500).json({ error: error.message || 'Failed to update sender information' });
    }
  });

  // GET /api/track/open/:sentEmailId - Track email opens
  app.get("/api/track/open/:sentEmailId", async (req, res) => {
    try {
      const sentEmailId = parseInt(req.params.sentEmailId);

      await AnalyticsService.recordEmailOpen(sentEmailId, req.headers['user-agent'] || 'unknown');

      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        'base64'
      );
      
      res.set({
        'Content-Type': 'image/png',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
      
      res.send(pixel);
    } catch (error: any) {
      console.error('Error recording email open:', error);
      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        'base64'
      );
      res.set('Content-Type', 'image/png');
      res.send(pixel);
    }
  });

  // GET /api/track/click/:linkId - Track link clicks
  app.get("/api/track/click/:linkId", async (req, res) => {
    try {
      const linkId = parseInt(req.params.linkId);
      const targetUrl = req.query.url as string;

      if (!targetUrl) {
        return res.status(400).json({ error: 'Missing target URL' });
      }

      await AnalyticsService.recordLinkClick(linkId, req.headers['user-agent'] || 'unknown', targetUrl);

      res.redirect(targetUrl);
    } catch (error: any) {
      console.error('Error recording link click:', error);
      const targetUrl = req.query.url as string;
      if (targetUrl) {
        res.redirect(targetUrl);
      } else {
        res.status(500).json({ error: 'Failed to track click' });
      }
    }
  });

  // GET /api/gmail/status - Check Gmail connection status
  app.get("/api/gmail/status", async (req, res) => {
    try {
      await getUncachableGmailClient();
      res.json({ connected: true, email: "Connected (Gmail)" });
    } catch (error) {
      console.error('Error checking Gmail status:', error);
      res.json({ connected: false, email: null });
    }
  });

  // GET /api/openai/status - Check OpenAI integration status
  app.get("/api/openai/status", async (req, res) => {
    try {
      const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
      const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
      
      if (baseUrl && apiKey) {
        res.json({ connected: true, model: "GPT-5" });
      } else {
        res.json({ connected: false, model: null });
      }
    } catch (error) {
      console.error('Error checking OpenAI status:', error);
      res.json({ connected: false, model: null });
    }
  });

  // GET /api/settings/diagnostics - Check email deliverability
  app.get("/api/settings/diagnostics", async (req, res) => {
    try {
      console.log('[Diagnostics] Checking email authentication...');
      const authStatus = await checkEmailAuthentication();
      
      console.log('[Diagnostics] Detecting recent bounces...');
      const recentBounces = await detectBounces(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      );

      res.json({
        authentication: authStatus,
        bounces: {
          total: recentBounces.length,
          hard: recentBounces.filter(b => b.classification.bounceType === 'hard').length,
          soft: recentBounces.filter(b => b.classification.bounceType === 'soft').length,
          details: recentBounces.slice(0, 10), // Return up to 10 most recent
        },
      });
    } catch (error) {
      console.error('[Diagnostics] Error:', error);
      res.status(500).json({ error: 'Failed to run diagnostics' });
    }
  });

  // GET /api/tracking/health - Check tracking configuration status
  app.get("/api/tracking/health", async (req: any, res) => {
    try {
      const config = EmailTrackingService.validateTrackingConfiguration();
      
      // If authenticated, also get user-specific stats
      let userStats = null;
      if (req.session?.userId) {
        userStats = await EmailTrackingService.getTrackingStats(req.session.userId);
      }
      
      res.json({
        ...config,
        userStats,
        status: config.configured ? 'healthy' : 'degraded',
        message: config.configured 
          ? 'Email tracking is fully operational' 
          : 'Email tracking is running but URLs may not be accessible externally',
      });
    } catch (error) {
      console.error('[TrackingHealth] Error:', error);
      res.status(500).json({ 
        status: 'error',
        error: 'Failed to check tracking health',
        configured: false,
        issues: ['Internal server error while checking tracking configuration'],
      });
    }
  });
}
