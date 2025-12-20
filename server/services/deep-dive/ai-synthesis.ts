import OpenAI from "openai";
import type { ApolloEnrichmentResult, LinkedInEnrichmentResult, CompanyEnrichmentResult, WebSearchResult } from "./types";
import type { AIInsight, TriggerEvent } from "@shared/schemas/deep-dive-schema";

function getOpenAI(): OpenAI {
  return new OpenAI();
}

interface SynthesisInput {
  contactName: string;
  contactEmail?: string;
  contactCompany?: string;
  contactPosition?: string;
  apollo: ApolloEnrichmentResult;
  linkedin: LinkedInEnrichmentResult;
  company: CompanyEnrichmentResult;
  webSearch: WebSearchResult;
}

interface SynthesisResult {
  insights: AIInsight[];
  triggerEvents: TriggerEvent[];
  summary: string;
  outreachAngles: string[];
}

export async function synthesizeInsights(input: SynthesisInput): Promise<SynthesisResult> {
  console.log('[DeepDive:Synthesis] Synthesizing insights for:', input.contactName);

  const contextParts: string[] = [];

  contextParts.push(`Name: ${input.contactName}`);
  if (input.contactEmail) contextParts.push(`Email: ${input.contactEmail}`);
  if (input.contactCompany) contextParts.push(`Company: ${input.contactCompany}`);
  if (input.contactPosition) contextParts.push(`Position: ${input.contactPosition}`);

  if (input.apollo.found && input.apollo.data) {
    const a = input.apollo.data;
    if (a.headline) contextParts.push(`Headline: ${a.headline}`);
    if (a.location) contextParts.push(`Location: ${a.location}`);
    if (a.employmentHistory?.length) {
      contextParts.push(`Work History: ${a.employmentHistory.slice(0, 3).map(j => `${j.title} at ${j.organizationName}`).join('; ')}`);
    }
    if (a.education?.length) {
      contextParts.push(`Education: ${a.education.map(e => `${e.degree || 'Studied'} at ${e.schoolName}`).join('; ')}`);
    }
    if (a.organizationIndustry) contextParts.push(`Industry: ${a.organizationIndustry}`);
    if (a.organizationSize) contextParts.push(`Company Size: ${a.organizationSize} employees`);
    if (a.organizationFunding) contextParts.push(`Funding Stage: ${a.organizationFunding}`);
  }

  if (input.linkedin.found && input.linkedin.data) {
    const l = input.linkedin.data;
    if (l.summary) contextParts.push(`LinkedIn Summary: ${l.summary.substring(0, 200)}...`);
    if (l.recentPosts?.length) {
      contextParts.push(`Recent Posts: ${l.recentPosts.slice(0, 2).map(p => p.content?.substring(0, 100)).join(' | ')}`);
    }
  }

  if (input.company.found && input.company.data) {
    const c = input.company.data;
    if (c.description) contextParts.push(`Company Description: ${c.description.substring(0, 150)}`);
    if (c.techStack?.length) contextParts.push(`Tech Stack: ${c.techStack.slice(0, 5).join(', ')}`);
  }

  if (input.webSearch.found && input.webSearch.results.length) {
    contextParts.push(`Web Mentions: ${input.webSearch.results.slice(0, 3).map(r => r.snippet).join(' | ')}`);
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a sales intelligence analyst. Analyze the provided information about a person and generate actionable insights for sales outreach.

Be specific and actionable. Focus on:
1. Trigger events (job changes, company news, recent activity)
2. Pain points you can infer from their role/industry
3. Common ground or conversation starters
4. Best angles for outreach

CRITICAL: Only use the information provided. Do NOT fabricate details, news, or events.`
        },
        {
          role: 'user',
          content: `Analyze this person and provide sales intelligence:

${contextParts.join('\n')}

Return JSON with this structure:
{
  "insights": [
    {
      "category": "pain_point|opportunity|common_ground|timing",
      "insight": "Specific actionable insight",
      "confidence": 0.0-1.0,
      "actionable": true/false,
      "source": "apollo|linkedin|company|web|inferred"
    }
  ],
  "triggerEvents": [
    {
      "type": "job_change|funding|promotion|company_news|activity",
      "description": "What happened",
      "relevance": "Why this matters for outreach",
      "source": "Where this came from"
    }
  ],
  "summary": "2-3 sentence summary of this person for sales context",
  "outreachAngles": ["Angle 1", "Angle 2", "Angle 3"]
}`
        }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return defaultSynthesis(input);
    }

    const parsed = JSON.parse(content);
    console.log('[DeepDive:Synthesis] Generated', parsed.insights?.length || 0, 'insights');

    return {
      insights: parsed.insights || [],
      triggerEvents: parsed.triggerEvents || [],
      summary: parsed.summary || '',
      outreachAngles: parsed.outreachAngles || [],
    };
  } catch (error) {
    console.error('[DeepDive:Synthesis] Error:', error);
    return defaultSynthesis(input);
  }
}

function defaultSynthesis(input: SynthesisInput): SynthesisResult {
  const insights: AIInsight[] = [];
  
  if (input.apollo.found && input.apollo.data?.title) {
    insights.push({
      category: 'common_ground',
      insight: `${input.contactName} works as ${input.apollo.data.title} - tailor your message to this role`,
      confidence: 0.8,
      actionable: true,
      source: 'apollo'
    });
  }

  if (input.company.found && input.company.data?.funding) {
    insights.push({
      category: 'timing',
      insight: `Company is at ${input.company.data.funding} stage - may have budget for new solutions`,
      confidence: 0.7,
      actionable: true,
      source: 'company'
    });
  }

  return {
    insights,
    triggerEvents: [],
    summary: `${input.contactName}${input.contactPosition ? `, ${input.contactPosition}` : ''}${input.contactCompany ? ` at ${input.contactCompany}` : ''}.`,
    outreachAngles: ['Reference their role and responsibilities', 'Connect on industry trends', 'Offer value specific to their company size'],
  };
}
