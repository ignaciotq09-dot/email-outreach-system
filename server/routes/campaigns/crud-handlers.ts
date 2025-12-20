import type { Request, Response } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../../db";
import { insertCampaignSchema, campaigns } from "@shared/schema";
import { TemplatePerformanceService } from "../../template-performance";
import { z } from "zod";
import { updateCampaignSchema } from "./types";

export async function createCampaign(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const validatedData = insertCampaignSchema.parse(req.body);
    const [campaign] = await db.insert(campaigns).values({ ...validatedData, userId }).returning();
    if (campaign.templateId) await TemplatePerformanceService.recordTemplateUsage(campaign.templateId);
    res.json(campaign);
  } catch (error) { console.error('Error creating campaign:', error); if (error instanceof z.ZodError) res.status(400).json({ error: 'Invalid campaign data', details: error.errors }); else res.status(500).json({ error: 'Failed to create campaign' }); }
}

export async function updateCampaign(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const campaignId = parseInt(req.params.id); if (isNaN(campaignId)) return res.status(400).json({ error: 'Invalid campaign ID' });
    const [existingCampaign] = await db.select().from(campaigns).where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));
    if (!existingCampaign) return res.status(404).json({ error: 'Campaign not found' });
    const validatedData = updateCampaignSchema.parse(req.body);
    const [updatedCampaign] = await db.update(campaigns).set(validatedData).where(eq(campaigns.id, campaignId)).returning();
    console.log(`[Campaigns] Updated campaign ${campaignId} for user ${userId}:`, Object.keys(validatedData));
    res.json(updatedCampaign);
  } catch (error) { console.error('Error updating campaign:', error); if (error instanceof z.ZodError) res.status(400).json({ error: 'Invalid campaign data', details: error.errors }); else res.status(500).json({ error: 'Failed to update campaign' }); }
}

export async function getRecentCampaign(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const [recentCampaign] = await db.select().from(campaigns).where(and(eq(campaigns.userId, userId), eq(campaigns.status, 'draft'))).orderBy(desc(campaigns.createdAt)).limit(1);
    if (!recentCampaign) return res.status(404).json({ error: 'No draft campaign found' });
    res.json(recentCampaign);
  } catch (error) { console.error('Error fetching recent campaign:', error); res.status(500).json({ error: 'Failed to fetch recent campaign' }); }
}

export async function getActiveDraft(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    let [activeDraft] = await db.select().from(campaigns).where(and(eq(campaigns.userId, userId), eq(campaigns.status, 'draft'))).orderBy(desc(campaigns.createdAt)).limit(1);
    if (!activeDraft) { console.log(`[Campaigns] No draft campaign found for user ${userId}, creating one...`); [activeDraft] = await db.insert(campaigns).values({ userId, subject: '', body: '', status: 'draft' }).returning(); console.log(`[Campaigns] Created draft campaign ${activeDraft.id} for user ${userId}`); }
    res.json(activeDraft);
  } catch (error) { console.error('Error fetching/creating active draft campaign:', error); res.status(500).json({ error: 'Failed to get active draft campaign' }); }
}

export async function getAllCampaigns(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const userCampaigns = await db.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(desc(campaigns.createdAt));
    res.json(userCampaigns);
  } catch (error) { console.error('Error fetching campaigns:', error); res.status(500).json({ error: 'Failed to fetch campaigns' }); }
}

export async function getCampaignById(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const campaignId = parseInt(req.params.id);
    const [campaign] = await db.select().from(campaigns).where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (error) { console.error('Error fetching campaign:', error); res.status(500).json({ error: 'Failed to fetch campaign' }); }
}

export async function updateCampaignFull(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const campaignId = parseInt(req.params.id);
    const [updated] = await db.update(campaigns).set(req.body).where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId))).returning();
    if (!updated) return res.status(404).json({ error: 'Campaign not found' });
    res.json(updated);
  } catch (error) { console.error('Error updating campaign:', error); res.status(500).json({ error: 'Failed to update campaign' }); }
}

export async function deleteCampaign(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const campaignId = parseInt(req.params.id);
    await db.delete(campaigns).where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));
    res.json({ success: true });
  } catch (error) { console.error('Error deleting campaign:', error); res.status(500).json({ error: 'Failed to delete campaign' }); }
}
