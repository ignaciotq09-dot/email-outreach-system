import type { Express } from "express";
import { requireAuth } from "../../auth/middleware";
import { getSequences, getSequenceById } from './list';
import { createSequence, updateSequence, deleteSequence } from './crud';
import { addStep, updateStep, deleteStep } from './steps';

export function registerSequenceRoutes(app: Express) {
  app.get("/api/sequences", requireAuth, getSequences);
  app.get("/api/sequences/:id", requireAuth, getSequenceById);
  app.post("/api/sequences", requireAuth, createSequence);
  app.put("/api/sequences/:id", requireAuth, updateSequence);
  app.delete("/api/sequences/:id", requireAuth, deleteSequence);
  app.post("/api/sequences/:id/steps", requireAuth, addStep);
  app.put("/api/sequences/:sequenceId/steps/:stepId", requireAuth, updateStep);
  app.delete("/api/sequences/:sequenceId/steps/:stepId", requireAuth, deleteStep);
}
