import { openai } from "../../../ai/openai-client";
import { DOMAIN_DICTIONARY } from "./dictionary";

const domainCache = new Map<string, { domain: string | null; timestamp: number }>();
const DOMAIN_CACHE_TTL = 1000 * 60 * 60 * 24;

export async function resolveDomain(companyName: string): Promise<string | null> {
  const normalized = companyName.toLowerCase().trim();
  if (DOMAIN_DICTIONARY[normalized]) { console.log(`[DomainResolver] Dictionary hit for "${companyName}": ${DOMAIN_DICTIONARY[normalized]}`); return DOMAIN_DICTIONARY[normalized]; }
  const cached = domainCache.get(normalized);
  if (cached && Date.now() - cached.timestamp < DOMAIN_CACHE_TTL) { console.log(`[DomainResolver] Cache hit for "${companyName}": ${cached.domain}`); return cached.domain; }
  console.log(`[DomainResolver] Using AI to infer domain for "${companyName}"`);
  const startTime = Date.now();
  try {
    const response = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "system", content: `You are a domain resolver. Given a company name, return their primary website domain. Return ONLY the domain (e.g., "stanford.edu", "google.com") with no protocol. If unsure, return "UNKNOWN".` }, { role: "user", content: companyName }], max_tokens: 50, temperature: 0 });
    const result = response.choices[0]?.message?.content?.trim().toLowerCase();
    console.log(`[DomainResolver] AI inferred domain for "${companyName}": ${result} (${Date.now() - startTime}ms)`);
    if (result && result !== 'unknown' && /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(result)) { domainCache.set(normalized, { domain: result, timestamp: Date.now() }); return result; }
    domainCache.set(normalized, { domain: null, timestamp: Date.now() }); return null;
  } catch (error) { console.error(`[DomainResolver] AI inference failed for "${companyName}":`, error); return null; }
}

export async function resolveDomains(companyNames: string[]): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();
  await Promise.all(companyNames.map(async (name) => { results.set(name, await resolveDomain(name)); }));
  return results;
}

export function isInDictionary(companyName: string): boolean { return DOMAIN_DICTIONARY[companyName.toLowerCase().trim()] !== undefined; }
export function getDictionarySize(): number { return Object.keys(DOMAIN_DICTIONARY).length; }
