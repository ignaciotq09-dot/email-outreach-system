import OpenAI from "openai";
import type { WebSearchResult } from "./types";
import type { Contact } from "@shared/schema";

function getOpenAI(): OpenAI {
  return new OpenAI();
}

export async function searchWeb(contact: Contact): Promise<WebSearchResult> {
  console.log('[DeepDive:WebSearch] Searching for:', contact.name);

  const searchQueries = buildSearchQueries(contact);
  const allResults: WebSearchResult['results'] = [];

  try {
    const searchPrompt = `You are a research assistant finding publicly available information about a person.

PERSON TO RESEARCH:
- Name: ${contact.name}
${contact.company ? `- Company: ${contact.company}` : ''}
${contact.position ? `- Position: ${contact.position}` : ''}
${contact.industry ? `- Industry: ${contact.industry}` : ''}

SEARCH FOR:
1. Recent news articles mentioning this person
2. Podcast appearances or interviews
3. Conference talks or presentations
4. Published articles or blog posts by them
5. Company announcements involving them
6. Awards or recognition

IMPORTANT:
- Only include information that would be publicly findable
- Include source URLs when possible
- Focus on professional/business context
- If you can't find specific information, say so honestly

Return a JSON object with this structure:
{
  "findings": [
    {
      "title": "Article/Event title",
      "snippet": "Brief description of what was found",
      "source": "Publication/Platform name",
      "type": "news|podcast|article|talk|award|announcement",
      "estimatedDate": "Approximate date if known"
    }
  ],
  "searchQuality": "high|medium|low",
  "notes": "Any caveats about the search results"
}`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a professional research assistant. Be honest about what you can and cannot find. Do not fabricate information.' },
        { role: 'user', content: searchPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { found: false, results: [], confidence: 0 };
    }

    const parsed = JSON.parse(content);
    
    for (const finding of parsed.findings || []) {
      allResults.push({
        title: finding.title,
        url: finding.url || '',
        snippet: finding.snippet,
        source: finding.source,
        date: finding.estimatedDate,
      });
    }

    const confidence = parsed.searchQuality === 'high' ? 0.8 : parsed.searchQuality === 'medium' ? 0.5 : 0.3;

    console.log('[DeepDive:WebSearch] Found', allResults.length, 'results');

    return {
      found: allResults.length > 0,
      results: allResults,
      confidence,
    };
  } catch (error) {
    console.error('[DeepDive:WebSearch] Error:', error);
    return { found: false, results: [], confidence: 0 };
  }
}

function buildSearchQueries(contact: Contact): string[] {
  const queries: string[] = [];
  const name = contact.name;
  
  queries.push(`"${name}"`);
  if (contact.company) {
    queries.push(`"${name}" "${contact.company}"`);
  }
  if (contact.position) {
    queries.push(`"${name}" ${contact.position}`);
  }
  if (contact.industry) {
    queries.push(`"${name}" ${contact.industry} interview OR podcast OR keynote`);
  }
  
  return queries;
}
