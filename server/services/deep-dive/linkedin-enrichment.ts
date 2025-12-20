import type { LinkedInEnrichmentResult } from "./types";
import type { Contact } from "@shared/schema";

export async function enrichWithLinkedIn(contact: Contact, userId: number): Promise<LinkedInEnrichmentResult> {
  if (!contact.linkedinUrl) {
    console.log('[DeepDive:LinkedIn] No LinkedIn URL for contact');
    return { found: false, confidence: 0 };
  }

  console.log('[DeepDive:LinkedIn] Enriching from LinkedIn:', contact.linkedinUrl);

  try {
    const { getConfig } = await import("../phantombuster/config");
    const config = await getConfig(userId);
    
    if (!config?.apiKey) {
      console.log('[DeepDive:LinkedIn] Phantombuster not configured');
      return { found: false, confidence: 0 };
    }

    const PHANTOMBUSTER_API_BASE = 'https://api.phantombuster.com/api/v2';
    
    if (!config.profileScraperAgentId) {
      console.log('[DeepDive:LinkedIn] Profile Scraper agent not configured - returning limited data');
      return {
        found: true,
        data: {
          headline: contact.position || undefined,
          summary: contact.notes || undefined,
        },
        confidence: 0.3,
      };
    }

    const argument = { sessionCookie: config.sessionCookie, profileUrls: [contact.linkedinUrl] };
    
    const launchResponse = await fetch(`${PHANTOMBUSTER_API_BASE}/agents/launch`, {
      method: 'POST',
      headers: { 'X-Phantombuster-Key-1': config.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: config.profileScraperAgentId, argument })
    });

    if (!launchResponse.ok) {
      console.error('[DeepDive:LinkedIn] Launch failed:', launchResponse.status);
      return { found: false, confidence: 0 };
    }

    const launchData = await launchResponse.json();
    const containerId = launchData.containerId;

    await new Promise(resolve => setTimeout(resolve, 15000));

    const outputResponse = await fetch(`${PHANTOMBUSTER_API_BASE}/containers/fetch-output?id=${containerId}`, {
      method: 'GET',
      headers: { 'X-Phantombuster-Key-1': config.apiKey }
    });

    if (!outputResponse.ok) {
      console.error('[DeepDive:LinkedIn] Output fetch failed');
      return { found: false, confidence: 0 };
    }

    const outputData = await outputResponse.json();
    const profile = outputData.output?.[0];

    if (!profile) {
      return { found: false, confidence: 0 };
    }

    return {
      found: true,
      data: {
        headline: profile.headline,
        summary: profile.summary || profile.about,
        connections: profile.connectionCount,
        recentPosts: profile.posts?.slice(0, 5).map((p: any) => ({
          content: p.text || p.content,
          date: p.date,
          likes: p.likeCount,
          comments: p.commentCount,
        })) || [],
        skills: profile.skills || [],
        recommendations: profile.recommendations?.slice(0, 3).map((r: any) => ({
          text: r.text,
          author: r.author?.name,
        })) || [],
      },
      confidence: 0.85,
    };
  } catch (error) {
    console.error('[DeepDive:LinkedIn] Error:', error);
    return { found: false, confidence: 0 };
  }
}
