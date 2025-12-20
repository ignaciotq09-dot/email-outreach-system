export interface ApolloSearchFilters {
  jobTitles?: string[];
  locations?: string[];
  companySizes?: string[];
  industries?: string[];
  companies?: string[];
  emailStatuses?: ("verified" | "unverified")[];
  page?: number;
  perPage?: number;
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
