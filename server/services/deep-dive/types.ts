export interface DeepDiveProgress {
  contactId: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  currentStep: string;
  steps: { name: string; status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'; data?: any; error?: string; }[];
  startedAt: string;
  completedAt?: string;
}

export interface ApolloEnrichmentResult {
  found: boolean;
  data?: {
    firstName: string; lastName: string; name: string; email?: string; phone?: string;
    title?: string; headline?: string; linkedinUrl?: string; photoUrl?: string;
    city?: string; state?: string; country?: string; location?: string;
    employmentHistory?: { organizationName: string; title: string; startDate?: string; endDate?: string; current?: boolean; }[];
    education?: { schoolName: string; degree?: string; field?: string; startYear?: number; endYear?: number; }[];
    skills?: string[];
    organizationName?: string; organizationIndustry?: string; organizationSize?: string; organizationFunding?: string;
  };
  confidence: number;
}

export interface LinkedInEnrichmentResult {
  found: boolean;
  data?: {
    headline?: string; summary?: string; connections?: number;
    recentPosts?: { content: string; date?: string; likes?: number; comments?: number; }[];
    skills?: string[];
    recommendations?: { text: string; author?: string; }[];
  };
  confidence: number;
}

export interface TwitterEnrichmentResult {
  found: boolean;
  data?: {
    username?: string; bio?: string; followers?: number; following?: number;
    recentTweets?: { content: string; date?: string; likes?: number; retweets?: number; }[];
  };
  confidence: number;
}

export interface CompanyEnrichmentResult {
  found: boolean;
  data?: {
    name?: string; domain?: string; industry?: string; size?: string;
    funding?: string; techStack?: string[]; recentNews?: string[];
    competitors?: string[]; description?: string;
  };
  confidence: number;
}

export interface WebSearchResult {
  found: boolean;
  results: { title: string; url: string; snippet: string; source: string; date?: string; }[];
  confidence: number;
}
