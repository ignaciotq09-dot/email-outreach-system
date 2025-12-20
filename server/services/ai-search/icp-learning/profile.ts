import { db } from "../../../db";
import { eq } from "drizzle-orm";
import { sentEmails, contacts, tenantIcpProfiles, leadFeedbackEvents } from "@shared/schema";
import type { IcpProfile, PreferenceWeight } from "./types";
import { calculatePreferenceWeights, calculateEngagementScore, incorporateFeedback, calculateIcpConfidence } from "./helpers";

export async function getIcpProfile(userId: number): Promise<IcpProfile | null> {
  const [profile] = await db.select().from(tenantIcpProfiles).where(eq(tenantIcpProfiles.userId, userId)).limit(1);
  if (!profile) return null;
  return { userId: profile.userId, titlePreferences: (profile.titlePreferences as PreferenceWeight[]) || [], industryPreferences: (profile.industryPreferences as PreferenceWeight[]) || [], companySizePreferences: (profile.companySizePreferences as PreferenceWeight[]) || [], locationPreferences: (profile.locationPreferences as PreferenceWeight[]) || [], seniorityPreferences: (profile.seniorityPreferences as PreferenceWeight[]) || [], technologyPreferences: (profile.technologyPreferences as PreferenceWeight[]) || [], icpConfidence: profile.icpConfidence || 0, totalDataPoints: profile.totalDataPoints || 0, bestPerformingAttributes: (profile.bestPerformingAttributes as any) || { topTitles: [], topIndustries: [], topCompanySizes: [], topLocations: [], averageReplyRate: 0 } };
}

export async function recalculateIcpProfile(userId: number): Promise<IcpProfile> {
  console.log(`[ICP] Recalculating profile for user ${userId}...`);
  const engagementData = await db.select({ contactId: contacts.id, title: contacts.position, industry: contacts.industry, companySize: contacts.companySize, location: contacts.location, wasOpened: sentEmails.opened, wasReplied: sentEmails.replyReceived }).from(sentEmails).innerJoin(contacts, eq(sentEmails.contactId, contacts.id)).where(eq(sentEmails.userId, userId));
  const feedbackEvents = await db.select().from(leadFeedbackEvents).where(eq(leadFeedbackEvents.userId, userId));
  const scoreCalc = (item: any) => calculateEngagementScore(item.wasOpened, item.wasReplied, false);
  const titlePrefs = calculatePreferenceWeights(engagementData, (d) => d.title, scoreCalc);
  const industryPrefs = calculatePreferenceWeights(engagementData, (d) => d.industry, scoreCalc);
  const sizePrefs = calculatePreferenceWeights(engagementData, (d) => d.companySize, scoreCalc);
  const locPrefs = calculatePreferenceWeights(engagementData, (d) => d.location, scoreCalc);
  incorporateFeedback(titlePrefs, feedbackEvents, 'title');
  incorporateFeedback(industryPrefs, feedbackEvents, 'industry');
  incorporateFeedback(sizePrefs, feedbackEvents, 'companySize');
  incorporateFeedback(locPrefs, feedbackEvents, 'location');
  const totalDataPoints = engagementData.length + feedbackEvents.length;
  const replied = engagementData.filter(d => d.wasReplied).length;
  const avgReplyRate = engagementData.length > 0 ? replied / engagementData.length : 0;
  const bestAttrs = { topTitles: titlePrefs.filter(p => p.weight > 0).slice(0, 5).map(p => p.value), topIndustries: industryPrefs.filter(p => p.weight > 0).slice(0, 5).map(p => p.value), topCompanySizes: sizePrefs.filter(p => p.weight > 0).slice(0, 3).map(p => p.value), topLocations: locPrefs.filter(p => p.weight > 0).slice(0, 5).map(p => p.value), averageReplyRate: avgReplyRate };
  const profile: IcpProfile = { userId, titlePreferences: titlePrefs, industryPreferences: industryPrefs, companySizePreferences: sizePrefs, locationPreferences: locPrefs, seniorityPreferences: [], technologyPreferences: [], icpConfidence: calculateIcpConfidence(totalDataPoints), totalDataPoints, bestPerformingAttributes: bestAttrs };
  const [existing] = await db.select().from(tenantIcpProfiles).where(eq(tenantIcpProfiles.userId, userId)).limit(1);
  const now = new Date();
  if (existing) { await db.update(tenantIcpProfiles).set({ titlePreferences: titlePrefs, industryPreferences: industryPrefs, companySizePreferences: sizePrefs, locationPreferences: locPrefs, icpConfidence: profile.icpConfidence, totalDataPoints, bestPerformingAttributes: bestAttrs, lastCalculatedAt: now, updatedAt: now }).where(eq(tenantIcpProfiles.userId, userId)); }
  else { await db.insert(tenantIcpProfiles).values({ userId, titlePreferences: titlePrefs, industryPreferences: industryPrefs, companySizePreferences: sizePrefs, locationPreferences: locPrefs, seniorityPreferences: [], technologyPreferences: [], icpConfidence: profile.icpConfidence, totalDataPoints, bestPerformingAttributes: bestAttrs, lastCalculatedAt: now, createdAt: now, updatedAt: now }); }
  console.log(`[ICP] Profile recalculated: ${totalDataPoints} data points, ${(profile.icpConfidence * 100).toFixed(0)}% confidence`);
  return profile;
}
