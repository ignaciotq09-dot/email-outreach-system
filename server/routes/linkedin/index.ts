import type { Express } from "express";
import { registerConnectionRoutes } from "./connection";
import { registerMessagingRoutes } from "./messaging";
import { registerAnalyticsRoutes } from "./analytics";
import { registerPhantombusterRoutes } from "./phantombuster";
import { registerJobQueueRoutes } from "./job-queue";
import { registerExtensionRoutes } from "./extension";

export function registerLinkedInRoutes(app: Express) {
  registerConnectionRoutes(app);
  registerMessagingRoutes(app);
  registerAnalyticsRoutes(app);
  registerPhantombusterRoutes(app);
  registerJobQueueRoutes(app);
  registerExtensionRoutes(app);
  console.log('[LinkedIn] LinkedIn routes registered');
}
