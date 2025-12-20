export const SENIORITY_LEVELS = ['Entry', 'Junior', 'Mid-Level', 'Senior', 'Manager', 'Director', 'VP', 'C-Level', 'Partner', 'Owner', 'Founder'];

export const REVENUE_RANGES = ['Under $1M', '$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M-$500M', '$500M-$1B', 'Over $1B'];

export const INTENT_TOPICS = ['Hiring', 'Expansion', 'Fundraising', 'M&A', 'Technology Investment', 'Digital Transformation', 'Cloud Migration', 'Cybersecurity'];

export function createEmptyFilters(): { jobTitles: string[]; locations: string[]; industries: string[]; companySizes: string[]; companies: string[]; seniorities: string[]; technologies: string[]; keywords: string[]; revenueRanges: string[]; intentTopics: string[] } {
  return { jobTitles: [], locations: [], industries: [], companySizes: [], companies: [], seniorities: [], technologies: [], keywords: [], revenueRanges: [], intentTopics: [] };
}
