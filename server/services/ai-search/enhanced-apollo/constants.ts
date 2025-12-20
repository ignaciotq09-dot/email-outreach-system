export const APOLLO_API_BASE = 'https://api.apollo.io/api/v1';

export const SENIORITY_MAP: Record<string, string[]> = {
  'Entry': ['entry'], 'Junior': ['entry', 'associate'], 'Mid-Level': ['associate', 'senior'], 'Senior': ['senior'],
  'Manager': ['manager'], 'Director': ['director'], 'VP': ['vp'], 'C-Level': ['c_suite', 'executive'],
  'Partner': ['partner'], 'Owner': ['owner', 'founder'], 'Founder': ['founder'],
};

export const REVENUE_MAP: Record<string, string> = {
  'Under $1M': '0,1000000', '$1M-$10M': '1000000,10000000', '$10M-$50M': '10000000,50000000',
  '$50M-$100M': '50000000,100000000', '$100M-$500M': '100000000,500000000', '$500M-$1B': '500000000,1000000000', 'Over $1B': '1000000000,100000000000',
};

export const COMPANY_SIZE_MAP: Record<string, string> = {
  '1-10': '1,10', '11-50': '11,50', '51-200': '51,200', '201-500': '201,500',
  '501-1000': '501,1000', '1001-5000': '1001,5000', '5001-10000': '5001,10000', '10001+': '10001,1000000',
};

export function formatRevenueRange(revenue: number): string {
  if (revenue < 1000000) return 'Under $1M'; if (revenue < 10000000) return '$1M-$10M';
  if (revenue < 50000000) return '$10M-$50M'; if (revenue < 100000000) return '$50M-$100M';
  if (revenue < 500000000) return '$100M-$500M'; if (revenue < 1000000000) return '$500M-$1B'; return 'Over $1B';
}
