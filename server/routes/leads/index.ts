import type { Express } from "express";
import { registerSearchRoutes } from "./search";
import { registerFilterRoutes } from "./filters";
import { registerQuotaRoutes } from "./quota";
import { registerImportRoutes } from "./import";
import { registerEnrichRoutes } from "./enrich";
import { registerAddToQueueRoutes } from "./add-to-queue";
import { registerSimilarLeadsRoutes } from "./similar";
import leadDeepDiveRoutes from "./deep-dive";

export function registerLeadRoutes(app: Express) {
  registerSearchRoutes(app);
  registerFilterRoutes(app);
  registerQuotaRoutes(app);
  registerImportRoutes(app);
  registerEnrichRoutes(app);
  registerAddToQueueRoutes(app);
  registerSimilarLeadsRoutes(app);
  app.use(leadDeepDiveRoutes);
}
