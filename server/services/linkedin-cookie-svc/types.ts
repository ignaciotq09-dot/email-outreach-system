export interface LinkedInCookies {
  li_at?: { value: string; expirationDate?: number };
  JSESSIONID?: { value: string; expirationDate?: number };
  [key: string]: { value: string; domain?: string; path?: string; secure?: boolean; httpOnly?: boolean; expirationDate?: number } | undefined;
}

export interface LinkedInApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const LINKEDIN_API_BASE = "https://www.linkedin.com";
export const VOYAGER_API_BASE = "https://www.linkedin.com/voyager/api";
