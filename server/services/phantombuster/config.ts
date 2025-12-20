import { db } from "../../db";
import { eq, sql } from "drizzle-orm";
import { linkedinSettings, linkedinJobQueue } from "@shared/schema";
import crypto from "crypto";
import type { PhantombusterConfig } from "./types";

export async function getConfig(userId: number): Promise<PhantombusterConfig | null> {
  try { const [settings] = await db.select({ apiKey: linkedinSettings.phantombusterApiKey, autoConnectAgentId: linkedinSettings.phantombusterAutoConnectAgentId, messageSenderAgentId: linkedinSettings.phantombusterMessageSenderAgentId, webhookSecret: linkedinSettings.phantombusterWebhookSecret }).from(linkedinSettings).where(eq(linkedinSettings.userId, userId)); if (!settings?.apiKey) return null; return { apiKey: settings.apiKey, autoConnectAgentId: settings.autoConnectAgentId, messageSenderAgentId: settings.messageSenderAgentId, webhookSecret: settings.webhookSecret }; } catch (error) { console.error('[Phantombuster] Error getting config:', error); return null; }
}

export function generateWebhookSecret(): string { return crypto.randomBytes(32).toString('hex'); }
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean { const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex'); return signature === expectedSignature; }

export async function saveConfig(userId: number, config: { apiKey?: string; autoConnectAgentId?: string; messageSenderAgentId?: string; }): Promise<{ success: boolean; error?: string }> {
  try { const webhookSecret = generateWebhookSecret(); await db.update(linkedinSettings).set({ phantombusterApiKey: config.apiKey, phantombusterAutoConnectAgentId: config.autoConnectAgentId, phantombusterMessageSenderAgentId: config.messageSenderAgentId, phantombusterWebhookSecret: webhookSecret, phantombusterConnected: true, phantombusterLastVerified: new Date(), updatedAt: new Date() }).where(eq(linkedinSettings.userId, userId)); return { success: true }; } catch (error: any) { console.error('[Phantombuster] Save config error:', error); return { success: false, error: error.message }; }
}

export async function disconnect(userId: number): Promise<{ success: boolean }> {
  try { await db.update(linkedinSettings).set({ phantombusterApiKey: null, phantombusterAutoConnectAgentId: null, phantombusterMessageSenderAgentId: null, phantombusterWebhookSecret: null, phantombusterConnected: false, phantombusterLastVerified: null, updatedAt: new Date() }).where(eq(linkedinSettings.userId, userId)); return { success: true }; } catch (error) { console.error('[Phantombuster] Disconnect error:', error); return { success: false }; }
}

export async function addAuditLog(jobId: number, event: string, details: any): Promise<void> {
  try { const timestamp = new Date().toISOString(); const logEntry = { timestamp, event, details }; await db.update(linkedinJobQueue).set({ auditLog: sql`${linkedinJobQueue.auditLog} || ${JSON.stringify([logEntry])}::jsonb`, updatedAt: new Date() }).where(eq(linkedinJobQueue.id, jobId)); } catch (error) { console.error('[Phantombuster] Audit log error:', error); }
}
