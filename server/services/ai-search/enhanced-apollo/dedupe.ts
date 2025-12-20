import type { EnhancedApolloLead } from "./types";

export function deduplicateLeads(leads: EnhancedApolloLead[]): EnhancedApolloLead[] {
  const seen = new Map<string, EnhancedApolloLead>();
  for (const lead of leads) {
    const key = lead.email?.toLowerCase() || lead.id;
    if (!seen.has(key)) seen.set(key, lead);
  }
  return Array.from(seen.values());
}
