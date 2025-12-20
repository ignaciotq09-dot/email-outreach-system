import { Express } from "express";
import { registerSettingsRoutes } from "./settings";
import { registerSendRoutes } from "./send";
import { registerPersonalizeRoutes } from "./personalize";
import { registerSentRoutes } from "./sent";
import { registerWebhookRoutes } from "./webhooks";
import { registerOptimizeRoutes } from "./optimize";

export function registerSmsRoutes(app: Express) {
  registerSettingsRoutes(app);
  registerSendRoutes(app);
  registerPersonalizeRoutes(app);
  registerSentRoutes(app);
  registerWebhookRoutes(app);
  registerOptimizeRoutes(app);
  console.log("[SMS] SMS routes registered");
}

