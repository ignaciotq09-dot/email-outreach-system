import type { Express } from "express";
import { requireAuth } from "../../auth/middleware";
import { createContact, addContact, getAllContacts, getLeadFinderContacts, getContactById, updateContact, deleteContact, deleteLeadFinderContacts } from "./crud-handlers";
import { parseBulk, cleanup } from "./parse-handlers";
import { enrichContact, getEnrichmentStatus } from "./enrich-handlers";

export function registerContactRoutes(app: Express): void {
  app.post("/api/contacts", requireAuth, createContact);
  app.post("/api/contacts/add", requireAuth, addContact);
  app.get("/api/contacts/all", requireAuth, getAllContacts);
  app.get("/api/contacts/lead-finder", requireAuth, getLeadFinderContacts);
  app.post("/api/contacts/parse-bulk", requireAuth, parseBulk);
  app.post("/api/contacts/cleanup", requireAuth, cleanup);
  app.post("/api/contacts/:id/enrich", requireAuth, enrichContact);
  app.get("/api/contacts/:id/enrichment-status", requireAuth, getEnrichmentStatus);
  app.get("/api/contacts/:id", requireAuth, getContactById);
  app.put("/api/contacts/:id", requireAuth, updateContact);
  app.delete("/api/contacts/lead-finder/all", requireAuth, deleteLeadFinderContacts);
  app.delete("/api/contacts/:id", requireAuth, deleteContact);
}
