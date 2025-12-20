import type { Express } from "express";
import { requireAuth } from "../../auth/middleware";
import { createCampaign, updateCampaign, getRecentCampaign, getActiveDraft, getAllCampaigns, getCampaignById, updateCampaignFull, deleteCampaign } from "./crud-handlers";
import { getCampaignContacts, addContactToCampaign, removeAllContacts, removeContactById, removeContactByContactId } from "./contact-handlers";

export function registerCampaignRoutes(app: Express): void {
  app.post("/api/campaigns", requireAuth, createCampaign);
  app.patch("/api/campaigns/:id", requireAuth, updateCampaign);
  app.get("/api/campaigns/recent", requireAuth, getRecentCampaign);
  app.get("/api/campaigns/active-draft", requireAuth, getActiveDraft);
  app.get("/api/campaigns/:id/contacts", requireAuth, getCampaignContacts);
  app.post("/api/campaigns/:id/contacts", requireAuth, addContactToCampaign);
  app.delete("/api/campaigns/:id/contacts/all", requireAuth, removeAllContacts);
  app.delete("/api/campaigns/:campaignId/contacts/:campaignContactId", requireAuth, removeContactById);
  app.delete("/api/campaigns/:campaignId/contacts/by-contact/:contactId", requireAuth, removeContactByContactId);
  app.get("/api/campaigns", requireAuth, getAllCampaigns);
  app.get("/api/campaigns/:id", requireAuth, getCampaignById);
  app.put("/api/campaigns/:id", requireAuth, updateCampaignFull);
  app.delete("/api/campaigns/:id", requireAuth, deleteCampaign);
}
