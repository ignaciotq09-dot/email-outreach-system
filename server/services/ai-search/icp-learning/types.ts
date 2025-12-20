export interface PreferenceWeight {
  value: string;
  weight: number;
  sampleSize: number;
  lastUpdated: string;
}

export interface IcpProfile {
  userId: number;
  titlePreferences: PreferenceWeight[];
  industryPreferences: PreferenceWeight[];
  companySizePreferences: PreferenceWeight[];
  locationPreferences: PreferenceWeight[];
  seniorityPreferences: PreferenceWeight[];
  technologyPreferences: PreferenceWeight[];
  icpConfidence: number;
  totalDataPoints: number;
  bestPerformingAttributes: { topTitles: string[]; topIndustries: string[]; topCompanySizes: string[]; topLocations: string[]; averageReplyRate: number };
}

export interface EngagementData {
  contactId: number;
  title: string | null;
  industry: string | null;
  companySize: string | null;
  location: string | null;
  wasOpened: boolean;
  wasReplied: boolean;
  wasConverted: boolean;
}
