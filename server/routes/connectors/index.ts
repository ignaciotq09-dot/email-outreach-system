import type { Express } from "express";
import { registerAuthRoutes } from "./auth";
import { registerUserInfoRoutes } from "./user-info";
import { registerStatusRoutes } from "./status";
import { registerOnboardingRoutes } from "./onboarding";
import { registerSessionRoutes } from "./session";

export function registerConnectorRoutes(app: Express) {
  registerAuthRoutes(app);
  registerUserInfoRoutes(app);
  registerStatusRoutes(app);
  registerOnboardingRoutes(app);
  registerSessionRoutes(app);
}
