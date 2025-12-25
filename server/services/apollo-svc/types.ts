export interface ApolloSearchFilters {
  jobTitles?: string[];
  locations?: string[];
  companySizes?: string[];
  industries?: string[];
  companies?: string[];
  emailStatuses?: ("verified" | "unverified")[];
  page?: number;
  perPage?: number;
  // P0: Missing filters that Apollo API supports
  seniorities?: string[];           // VP, Director, Manager, etc.
  keywords?: string[];              // Full-text search keywords
  technologies?: string[];          // Tech stack to filter by
  // P1: Additional high-value filters
  requireEmail?: boolean;           // Only return contacts with emails
  revenueMin?: number;              // Min company revenue
  revenueMax?: number;              // Max company revenue
  // P2: Negative filters (exclusions)
  excludeJobTitles?: string[];      // Titles to exclude
  excludeIndustries?: string[];     // Industries to exclude
  excludeCompanies?: string[];      // Companies to exclude
}

// Email verification status - simplified two-tier system
// Maps Apollo's various statuses to our simple verified/unverified
export type EmailStatus = "verified" | "unverified";

export interface ApolloLead {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  industry: string | null;
  companySize: string | null;
  linkedinUrl: string | null;
  photoUrl: string | null;
  emailStatus: EmailStatus; // "verified" or "unverified"
}

export interface ApolloSearchResponse {
  leads: ApolloLead[];
  pagination: { page: number; perPage: number; totalPages: number; totalResults: number };
}
