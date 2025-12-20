import type { Express } from "express";
import { registerGenerateRoutes } from "./generate";
import { registerSendSelectedRoutes } from "./send-selected";
import { registerSendBulkRoutes } from "./send-bulk";
import { registerCrudRoutes } from "./crud";
import { registerFollowUpRoutes } from "./follow-up";

export function registerEmailRoutes(app: Express) {
  registerGenerateRoutes(app);
  registerSendSelectedRoutes(app);
  registerSendBulkRoutes(app);
  registerCrudRoutes(app);
  registerFollowUpRoutes(app);
}
