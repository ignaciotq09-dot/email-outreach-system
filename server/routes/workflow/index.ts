import type { Router } from "express";
import { registerCrudRoutes } from "./crud";
import { registerAiRoutes } from "./ai";
import { registerExecutionRoutes } from "./execution";
import { registerTemplateRoutes } from "./templates";
import { registerAnalyticsRoutes } from "./analytics";

export function registerWorkflowRoutes(app: Router): void {
  registerCrudRoutes(app);
  registerAiRoutes(app);
  registerExecutionRoutes(app);
  registerTemplateRoutes(app);
  registerAnalyticsRoutes(app);
  console.log("[Workflows] Workflow routes registered");
}
