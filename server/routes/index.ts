import type { Express } from "express";
import { registerContactRoutes } from "./contacts";
import { registerCampaignRoutes } from "./campaigns";
import { registerCampaignExecutionRoutes } from "./campaign-execution";
import { registerEmailRoutes } from "./emails/index";
import { registerTemplateRoutes } from "./templates";
import { registerSequenceRoutes } from "./sequences";
import { registerAnalyticsRoutes } from "./analytics";
import { registerMonitoringRoutes } from "./monitoring";
import { registerInboxRoutes } from "./inbox";
import { registerMiscRoutes } from "./misc";
import { registerDeliverabilityRoutes } from "./deliverability";
import { registerUnsubscribeRoutes } from "./unsubscribe";
import { registerBulkEmailRoutes } from "./bulk-email";
import { registerConnectorRoutes } from "./connectors";
import { registerCustomGmailOAuthRoutes } from "./custom-gmail-oauth";
import { registerLeadRoutes } from "./leads";
import { registerOAuthRoutes } from "./oauth";
import followUpEngineRoutes from "./follow-up-engine";
import followUpRecommendationsRoutes from "./follow-up-recommendations";
import replyDetectionEngineRoutes from "./reply-detection-engine/index";
import aiSearchRoutes from "./ai-search-routes";
import emailPersonalizationRoutes from "./email-personalization/index";
import { registerSmsRoutes } from "./sms/index";
import { registerAutoReplyRoutes } from "./auto-reply";
import bookingRoutes from "./booking";
import spintaxRoutes from "./spintax";
import { registerLinkedInRoutes } from "./linkedin";
import { registerWorkflowRoutes } from "./workflow";
import deepDiveRoutes from "./deep-dive";
import { healthRouter } from "./health";
import { registerMeetingsRoutes } from "./meetings-crud";

export function registerAllRoutes(app: Express) {
  // Health check routes (no auth required) - register FIRST
  app.use('/api/health', healthRouter);

  // OAuth routes (dev login, logout, etc)
  registerOAuthRoutes(app);

  // Auth and connector routes (CSRF token, etc)
  registerConnectorRoutes(app);

  // Custom Gmail OAuth with full scopes (gmail.readonly, gmail.send, gmail.modify)
  registerCustomGmailOAuthRoutes(app);

  // Feature routes
  registerContactRoutes(app);
  registerCampaignRoutes(app);
  registerCampaignExecutionRoutes(app);
  registerEmailRoutes(app);
  registerTemplateRoutes(app);
  registerSequenceRoutes(app);
  registerAnalyticsRoutes(app);
  registerMonitoringRoutes(app);
  registerInboxRoutes(app);
  registerMiscRoutes(app);
  registerDeliverabilityRoutes(app);
  registerUnsubscribeRoutes(app);
  registerBulkEmailRoutes(app);
  registerLeadRoutes(app);
  app.use(followUpEngineRoutes);
  app.use(followUpRecommendationsRoutes);
  app.use(replyDetectionEngineRoutes);

  // AI-powered search
  app.use('/api/ai-search', aiSearchRoutes);

  // Email personalization
  app.use('/api/user', emailPersonalizationRoutes);

  // SMS routes
  registerSmsRoutes(app);

  // Auto-reply routes
  registerAutoReplyRoutes(app);

  // Booking system routes
  app.use('/api/booking', bookingRoutes);

  // Spintax and send time optimization routes
  app.use('/api/spintax', spintaxRoutes);

  // LinkedIn integration routes
  registerLinkedInRoutes(app);

  // Workflow automation routes
  registerWorkflowRoutes(app);

  // Contact deep dive enrichment
  app.use(deepDiveRoutes);

  // Meetings CRUD routes
  registerMeetingsRoutes(app);
}
