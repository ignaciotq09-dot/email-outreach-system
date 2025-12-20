/**
 * Runtime Synonym Generation
 * Uses AI to generate related job titles for unknown queries
 */

import { callOpenAIFast } from "../../../ai/openai-client";
import { JOB_TITLE_SYNONYMS } from "./synonyms";

const synonymCache = new Map<string, string[]>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CacheEntry {
  synonyms: string[];
  cachedAt: number;
}

const aiSynonymCache = new Map<string, CacheEntry>();

const SYNONYM_GENERATION_PROMPT = `Generate related B2B job titles for Apollo.io contact search.

Given a job title, return 5-8 related titles that would be used in the same professional context.

RULES:
1. Include seniority variations (Manager, Director, VP, Head of)
2. Include common abbreviations and full forms
3. Include Owner/Founder for business-related titles
4. Stay within the same functional area
5. Be specific to B2B/professional contexts

OUTPUT JSON:
{
  "originalTitle": "input title",
  "relatedTitles": ["Title 1", "Title 2", ...]
}`;

export async function generateRuntimeSynonyms(title: string): Promise<string[]> {
  const normalizedTitle = title.toLowerCase().trim();
  
  for (const [key, synonyms] of Object.entries(JOB_TITLE_SYNONYMS)) {
    if (normalizedTitle === key || normalizedTitle.includes(key) || key.includes(normalizedTitle)) {
      return synonyms;
    }
  }
  
  const cached = aiSynonymCache.get(normalizedTitle);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    console.log(`[RuntimeSynonyms] Cache hit for "${title}"`);
    return cached.synonyms;
  }
  
  try {
    console.log(`[RuntimeSynonyms] Generating synonyms for "${title}"`);
    
    const response = await callOpenAIFast(
      [
        { role: "system", content: SYNONYM_GENERATION_PROMPT },
        { role: "user", content: title }
      ],
      { responseFormat: { type: "json_object" }, maxTokens: 300 }
    );
    
    const parsed = JSON.parse(response);
    const synonyms = [title, ...(parsed.relatedTitles || [])];
    
    aiSynonymCache.set(normalizedTitle, {
      synonyms,
      cachedAt: Date.now()
    });
    
    console.log(`[RuntimeSynonyms] Generated ${synonyms.length} synonyms for "${title}"`);
    return synonyms;
    
  } catch (error) {
    console.error('[RuntimeSynonyms] Failed to generate synonyms:', error);
    return [title];
  }
}

export async function expandTitlesWithAI(titles: string[]): Promise<string[]> {
  const allTitles = new Set<string>();
  
  for (const title of titles) {
    allTitles.add(title);
    
    const normalizedTitle = title.toLowerCase().trim();
    let foundInStatic = false;
    
    for (const [key, synonyms] of Object.entries(JOB_TITLE_SYNONYMS)) {
      if (normalizedTitle === key || normalizedTitle.includes(key) || key.includes(normalizedTitle)) {
        synonyms.forEach(s => allTitles.add(s));
        foundInStatic = true;
        break;
      }
    }
    
    if (!foundInStatic) {
      const generatedSynonyms = await generateRuntimeSynonyms(title);
      generatedSynonyms.forEach(s => allTitles.add(s));
    }
  }
  
  return [...allTitles];
}

export function getIndustryContextualSynonyms(
  title: string,
  industry: string
): string[] {
  const titleLower = title.toLowerCase();
  const industryLower = industry.toLowerCase();
  
  const industrySpecificMappings: Record<string, Record<string, string[]>> = {
    'healthcare': {
      'manager': ['Practice Manager', 'Office Manager', 'Clinical Manager', 'Healthcare Administrator'],
      'director': ['Medical Director', 'Clinical Director', 'Director of Nursing', 'Healthcare Director'],
      'executive': ['Hospital Administrator', 'Healthcare Executive', 'Chief Medical Officer', 'Chief Nursing Officer']
    },
    'technology': {
      'manager': ['Engineering Manager', 'Product Manager', 'Technical Manager', 'IT Manager'],
      'director': ['Director of Engineering', 'Technical Director', 'Director of Product', 'IT Director'],
      'executive': ['CTO', 'VP of Engineering', 'Chief Technology Officer', 'VP of Product']
    },
    'finance': {
      'manager': ['Finance Manager', 'Accounting Manager', 'Controller', 'Treasury Manager'],
      'director': ['Finance Director', 'Director of Accounting', 'Director of FP&A', 'Treasury Director'],
      'executive': ['CFO', 'Chief Financial Officer', 'VP of Finance', 'Treasurer']
    },
    'real estate': {
      'agent': ['Real Estate Agent', 'Realtor', 'Broker Associate', 'Listing Agent', 'Buyer\'s Agent'],
      'broker': ['Real Estate Broker', 'Managing Broker', 'Principal Broker', 'Designated Broker'],
      'manager': ['Property Manager', 'Asset Manager', 'Portfolio Manager', 'Regional Manager']
    },
    'construction': {
      'manager': ['Construction Manager', 'Project Manager', 'Site Manager', 'Superintendent'],
      'owner': ['General Contractor', 'Construction Owner', 'Builder', 'Contractor'],
      'executive': ['Construction Executive', 'President', 'Owner', 'VP of Construction']
    }
  };
  
  for (const [ind, mappings] of Object.entries(industrySpecificMappings)) {
    if (industryLower.includes(ind)) {
      for (const [keyword, synonyms] of Object.entries(mappings)) {
        if (titleLower.includes(keyword)) {
          return synonyms;
        }
      }
    }
  }
  
  return [title];
}

export function getSeniorityVariations(title: string): string[] {
  const titleLower = title.toLowerCase();
  const variations: string[] = [title];
  
  const baseTitle = titleLower
    .replace(/^(senior|sr\.?|junior|jr\.?|lead|principal|staff|chief|head of|director of|vp of|vice president of)\s+/i, '')
    .replace(/\s+(manager|director|lead|head|chief|vp|vice president)$/i, '');
  
  const capitalizedBase = baseTitle.charAt(0).toUpperCase() + baseTitle.slice(1);
  
  if (!titleLower.includes('manager')) {
    variations.push(`${capitalizedBase} Manager`);
  }
  if (!titleLower.includes('director')) {
    variations.push(`Director of ${capitalizedBase}`);
    variations.push(`${capitalizedBase} Director`);
  }
  if (!titleLower.includes('vp') && !titleLower.includes('vice president')) {
    variations.push(`VP of ${capitalizedBase}`);
  }
  if (!titleLower.includes('head')) {
    variations.push(`Head of ${capitalizedBase}`);
  }
  if (!titleLower.includes('senior') && !titleLower.includes('sr')) {
    variations.push(`Senior ${capitalizedBase}`);
  }
  
  return variations;
}
