import { db } from "../../../db";
import { eq } from "drizzle-orm";
import { tenantIcpProfiles } from "@shared/schema";
import type { IcpProfile, PreferenceWeight } from './types';

export async function fetchIcpProfile(userId: number): Promise<IcpProfile | null> { const [profile] = await db.select().from(tenantIcpProfiles).where(eq(tenantIcpProfiles.userId, userId)).limit(1); if (!profile) return null; return { userId: profile.userId, titlePreferences: (profile.titlePreferences as PreferenceWeight[]) || [], industryPreferences: (profile.industryPreferences as PreferenceWeight[]) || [], companySizePreferences: (profile.companySizePreferences as PreferenceWeight[]) || [], locationPreferences: (profile.locationPreferences as PreferenceWeight[]) || [], seniorityPreferences: (profile.seniorityPreferences as PreferenceWeight[]) || [], technologyPreferences: (profile.technologyPreferences as PreferenceWeight[]) || [], icpConfidence: profile.icpConfidence || 0, totalDataPoints: profile.totalDataPoints || 0, bestPerformingAttributes: (profile.bestPerformingAttributes as any) || { topTitles: [], topIndustries: [], topCompanySizes: [], topLocations: [], averageReplyRate: 0 } }; }
