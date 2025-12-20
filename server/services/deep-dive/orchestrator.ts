import { db } from "../../db";
import { contacts, contactDeepDive } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { enrichWithApollo } from "./apollo-enrichment";
import { enrichWithLinkedIn } from "./linkedin-enrichment";
import { searchWeb } from "./web-search";
import { enrichCompany } from "./company-enrichment";
import { synthesizeInsights } from "./ai-synthesis";
import type { DeepDiveProgress } from "./types";
import type { DeepDiveResult, WorkHistoryEntry, EducationEntry, SocialProfile } from "@shared/schemas/deep-dive-schema";

const activeJobs = new Map<string, DeepDiveProgress>();

export async function runDeepDive(userId: number, contactId: number): Promise<DeepDiveResult> {
  const jobKey = `${userId}-${contactId}`;
  
  const progress: DeepDiveProgress = {
    contactId,
    status: 'in_progress',
    currentStep: 'Fetching contact',
    steps: [
      { name: 'Apollo Enrichment', status: 'pending' },
      { name: 'LinkedIn Profile', status: 'pending' },
      { name: 'Company Intel', status: 'pending' },
      { name: 'Web Search', status: 'pending' },
      { name: 'AI Synthesis', status: 'pending' },
    ],
    startedAt: new Date().toISOString(),
  };
  activeJobs.set(jobKey, progress);

  console.log('[DeepDive] Starting for contact:', contactId);

  try {
    const [contact] = await db.select().from(contacts).where(and(eq(contacts.id, contactId), eq(contacts.userId, userId))).limit(1);
    if (!contact) throw new Error('Contact not found');

    progress.currentStep = 'Apollo Enrichment';
    progress.steps[0].status = 'running';
    const apolloResult = await enrichWithApollo(contact);
    progress.steps[0].status = apolloResult.found ? 'completed' : 'skipped';
    progress.steps[0].data = apolloResult;

    progress.currentStep = 'LinkedIn Profile';
    progress.steps[1].status = 'running';
    const linkedinResult = await enrichWithLinkedIn(contact, userId);
    progress.steps[1].status = linkedinResult.found ? 'completed' : 'skipped';
    progress.steps[1].data = linkedinResult;

    progress.currentStep = 'Company Intel';
    progress.steps[2].status = 'running';
    const companyResult = await enrichCompany(contact);
    progress.steps[2].status = companyResult.found ? 'completed' : 'skipped';
    progress.steps[2].data = companyResult;

    progress.currentStep = 'Web Search';
    progress.steps[3].status = 'running';
    const webResult = await searchWeb(contact);
    progress.steps[3].status = webResult.found ? 'completed' : 'skipped';
    progress.steps[3].data = webResult;

    progress.currentStep = 'AI Synthesis';
    progress.steps[4].status = 'running';
    const synthesis = await synthesizeInsights({
      contactName: contact.name,
      contactEmail: contact.email,
      contactCompany: contact.company || undefined,
      contactPosition: contact.position || undefined,
      apollo: apolloResult,
      linkedin: linkedinResult,
      company: companyResult,
      webSearch: webResult,
    });
    progress.steps[4].status = 'completed';
    progress.steps[4].data = synthesis;

    const workHistory: WorkHistoryEntry[] = apolloResult.data?.employmentHistory?.map(j => ({
      company: j.organizationName,
      title: j.title,
      startDate: j.startDate,
      endDate: j.endDate,
      isCurrent: j.current,
    })) || [];

    const education: EducationEntry[] = apolloResult.data?.education?.map(e => ({
      school: e.schoolName,
      degree: e.degree,
      field: e.field,
      startYear: e.startYear,
      endYear: e.endYear,
    })) || [];

    const socialProfiles: SocialProfile[] = [];
    if (contact.linkedinUrl) socialProfiles.push({ platform: 'LinkedIn', url: contact.linkedinUrl });
    if (apolloResult.data?.linkedinUrl && !contact.linkedinUrl) socialProfiles.push({ platform: 'LinkedIn', url: apolloResult.data.linkedinUrl });

    const skills = [...new Set([...(apolloResult.data?.skills || []), ...(linkedinResult.data?.skills || [])])];

    const result: DeepDiveResult = {
      contact: { id: contact.id, name: contact.name, email: contact.email, company: contact.company || undefined, position: contact.position || undefined },
      profile: {
        photoUrl: apolloResult.data?.photoUrl,
        headline: apolloResult.data?.headline || linkedinResult.data?.headline,
        summary: linkedinResult.data?.summary,
        location: apolloResult.data?.location || contact.location || undefined,
      },
      workHistory,
      education,
      skills,
      socialProfiles,
      companyIntel: {
        name: companyResult.data?.name || contact.company || undefined,
        industry: companyResult.data?.industry || contact.industry || undefined,
        size: companyResult.data?.size || contact.companySize || undefined,
        funding: companyResult.data?.funding,
        techStack: companyResult.data?.techStack,
        recentNews: companyResult.data?.recentNews,
        competitors: companyResult.data?.competitors,
      },
      triggerEvents: synthesis.triggerEvents,
      recentActivity: linkedinResult.data?.recentPosts?.map(p => ({ platform: 'LinkedIn', content: p.content, date: p.date, engagement: p.likes ? `${p.likes} likes` : undefined })) || [],
      insights: synthesis.insights,
      confidenceScores: {
        overall: Math.round((apolloResult.confidence + linkedinResult.confidence + companyResult.confidence + webResult.confidence) / 4 * 100) / 100,
        apollo: apolloResult.confidence,
        linkedin: linkedinResult.confidence,
        twitter: 0,
        webSearch: webResult.confidence,
      },
      enrichedAt: new Date().toISOString(),
    };

    await db.insert(contactDeepDive).values({
      userId,
      contactId,
      apolloData: apolloResult.data || null,
      linkedinData: linkedinResult.data || null,
      companyData: companyResult.data || null,
      webSearchData: webResult.results,
      aiInsights: synthesis,
      workHistory,
      education,
      skills,
      triggerEvents: synthesis.triggerEvents,
      socialProfiles,
      recentActivity: result.recentActivity,
      confidenceScores: result.confidenceScores,
      enrichmentStatus: 'completed',
    }).onConflictDoUpdate({
      target: [contactDeepDive.contactId],
      set: {
        apolloData: apolloResult.data || null,
        linkedinData: linkedinResult.data || null,
        companyData: companyResult.data || null,
        webSearchData: webResult.results,
        aiInsights: synthesis,
        workHistory,
        education,
        skills,
        triggerEvents: synthesis.triggerEvents,
        socialProfiles,
        recentActivity: result.recentActivity,
        confidenceScores: result.confidenceScores,
        enrichmentStatus: 'completed',
        lastEnriched: new Date(),
        updatedAt: new Date(),
      },
    });

    progress.status = 'completed';
    progress.completedAt = new Date().toISOString();
    console.log('[DeepDive] Completed for contact:', contactId);

    return result;
  } catch (error: any) {
    console.error('[DeepDive] Error:', error);
    progress.status = 'failed';
    activeJobs.set(jobKey, progress);
    throw error;
  }
}

export function getDeepDiveStatus(userId: number, contactId: number): DeepDiveProgress | null {
  return activeJobs.get(`${userId}-${contactId}`) || null;
}

export async function getCachedDeepDive(userId: number, contactId: number): Promise<DeepDiveResult | null> {
  const [cached] = await db.select().from(contactDeepDive).where(and(eq(contactDeepDive.contactId, contactId), eq(contactDeepDive.userId, userId))).limit(1);
  
  if (!cached || cached.enrichmentStatus !== 'completed') return null;

  const [contact] = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
  if (!contact) return null;

  const apolloData = cached.apolloData as any;

  return {
    contact: { id: contact.id, name: contact.name, email: contact.email, company: contact.company || undefined, position: contact.position || undefined },
    profile: {
      photoUrl: apolloData?.photoUrl,
      headline: apolloData?.headline,
      summary: (cached.linkedinData as any)?.summary,
      location: apolloData?.location || contact.location || undefined,
    },
    workHistory: (cached.workHistory as any[]) || [],
    education: (cached.education as any[]) || [],
    skills: (cached.skills as string[]) || [],
    socialProfiles: (cached.socialProfiles as any[]) || [],
    companyIntel: {
      name: (cached.companyData as any)?.name || contact.company || undefined,
      industry: (cached.companyData as any)?.industry,
      size: (cached.companyData as any)?.size,
      funding: (cached.companyData as any)?.funding,
      techStack: (cached.companyData as any)?.techStack,
      recentNews: (cached.companyData as any)?.recentNews,
    },
    triggerEvents: (cached.triggerEvents as any[]) || [],
    recentActivity: (cached.recentActivity as any[]) || [],
    insights: (cached.aiInsights as any)?.insights || [],
    confidenceScores: (cached.confidenceScores as any) || { overall: 0, apollo: 0, linkedin: 0, twitter: 0, webSearch: 0 },
    enrichedAt: cached.lastEnriched?.toISOString() || cached.createdAt?.toISOString() || new Date().toISOString(),
  };
}
