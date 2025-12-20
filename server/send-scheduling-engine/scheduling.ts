import { db } from "../db";
import { eq, and, isNull } from "drizzle-orm";
import { campaigns, campaignContacts, contacts } from "@shared/schema";
import { TimezoneService } from "../timezone-service";
import { JobScheduler } from "../scheduler";
import type { SendOptions } from "./types";

export async function scheduleCampaign(campaignId: number, options: SendOptions): Promise<void> {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);
  if (campaign.status !== "draft") throw new Error(`Campaign ${campaignId} is not in draft status`);

  const campaignContactsList = await db.select({ id: campaignContacts.id, contactId: campaignContacts.contactId, contact: contacts })
    .from(campaignContacts).innerJoin(contacts, eq(campaignContacts.contactId, contacts.id))
    .where(and(eq(campaignContacts.campaignId, campaignId), isNull(campaignContacts.sentEmailId)));

  if (campaignContactsList.length === 0) throw new Error(`No contacts found for campaign ${campaignId}`);

  console.log(`[SendEngine] Scheduling campaign ${campaignId} with ${campaignContactsList.length} recipients`);

  await TimezoneService.bulkDetectTimezones(campaignContactsList.map(cc => cc.contactId));

  const batchSize = options.batchSize || 30;
  await db.update(campaigns).set({ status: "scheduled", sendTimePolicy: options.mode, scheduledFor: options.scheduledTime, batchSize }).where(eq(campaigns.id, campaignId));

  if (options.mode === "immediate") {
    await scheduleImmediateSend(campaignId, campaignContactsList, batchSize);
  } else if (options.mode === "optimal") {
    await scheduleOptimalSend(campaignId, campaignContactsList, batchSize);
  } else if (options.mode === "scheduled" && options.scheduledTime) {
    await scheduleTimedSend(campaignId, campaignContactsList, options.scheduledTime, batchSize);
  }

  console.log(`[SendEngine] Campaign ${campaignId} scheduled successfully`);
}

async function scheduleImmediateSend(campaignId: number, contactsList: any[], batchSize: number): Promise<void> {
  const now = new Date();
  const msPerHour = 60 * 60 * 1000;
  const delayPerBatch = msPerHour / Math.ceil(contactsList.length / batchSize);

  for (let i = 0; i < contactsList.length; i += batchSize) {
    const batch = contactsList.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize);
    const sendTime = new Date(now.getTime() + (batchNumber * delayPerBatch));

    await JobScheduler.scheduleJob({
      jobType: "send_campaign_batch", entityType: "campaign", entityId: campaignId, scheduledFor: sendTime,
      metadata: { batchNumber, contactIds: batch.map(c => c.contactId), campaignContactIds: batch.map(c => c.id) },
    });
  }

  console.log(`[SendEngine] Scheduled ${contactsList.length} emails in ${Math.ceil(contactsList.length / batchSize)} batches`);
}

async function scheduleOptimalSend(campaignId: number, contactsList: any[], batchSize: number): Promise<void> {
  const sendTimeGroups = new Map<number, any[]>();

  for (const cc of contactsList) {
    const contact = cc.contact;
    const optimalTime = TimezoneService.calculateOptimalSendTime(contact.timezone, contact.optimalSendTime);
    const roundedTime = new Date(optimalTime);
    roundedTime.setMinutes(0, 0, 0);
    const timeKey = roundedTime.getTime();

    if (!sendTimeGroups.has(timeKey)) sendTimeGroups.set(timeKey, []);
    sendTimeGroups.get(timeKey)!.push(cc);
  }

  console.log(`[SendEngine] Grouped ${contactsList.length} contacts into ${sendTimeGroups.size} time slots`);

  for (const [timeKey, group] of Array.from(sendTimeGroups.entries())) {
    const sendTime = new Date(timeKey);
    for (let i = 0; i < group.length; i += batchSize) {
      const batch = group.slice(i, i + batchSize);
      const batchDelay = Math.floor(i / batchSize) * 2 * 60 * 1000;
      const batchSendTime = new Date(sendTime.getTime() + batchDelay);

      await JobScheduler.scheduleJob({
        jobType: "send_campaign_batch", entityType: "campaign", entityId: campaignId, scheduledFor: batchSendTime,
        metadata: { contactIds: batch.map((c: any) => c.contactId), campaignContactIds: batch.map((c: any) => c.id) },
      });
    }
  }
}

async function scheduleTimedSend(campaignId: number, contactsList: any[], scheduledTime: Date, batchSize: number): Promise<void> {
  for (let i = 0; i < contactsList.length; i += batchSize) {
    const batch = contactsList.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize);
    const batchDelay = batchNumber * 2 * 60 * 1000;
    const sendTime = new Date(scheduledTime.getTime() + batchDelay);

    await JobScheduler.scheduleJob({
      jobType: "send_campaign_batch", entityType: "campaign", entityId: campaignId, scheduledFor: sendTime,
      metadata: { batchNumber, contactIds: batch.map(c => c.contactId), campaignContactIds: batch.map(c => c.id) },
    });
  }

  console.log(`[SendEngine] Scheduled ${contactsList.length} emails starting at ${scheduledTime}`);
}
