export const APOLLO_API_BASE = 'https://api.apollo.io/api/v1';

export const COMPANY_SIZE_RANGES: Record<string, string> = { '1-10': '1,10', '11-50': '11,50', '51-200': '51,200', '201-500': '201,500', '501-1000': '501,1000', '1001-5000': '1001,5000', '5001-10000': '5001,10000', '10001+': '10001,1000000' };

export function getAvailableIndustries(): string[] { return ['Technology', 'Software', 'SaaS', 'Information Technology', 'Healthcare', 'Financial Services', 'Banking', 'Insurance', 'E-commerce', 'Retail', 'Manufacturing', 'Real Estate', 'Marketing', 'Advertising', 'Consulting', 'Education', 'Legal Services', 'Media', 'Telecommunications', 'Hospitality', 'Transportation', 'Energy', 'Construction', 'Automotive', 'Pharmaceuticals']; }

export function getCompanySizeOptions(): { value: string; label: string }[] { return [{ value: '1-10', label: '1-10 employees' }, { value: '11-50', label: '11-50 employees' }, { value: '51-200', label: '51-200 employees' }, { value: '201-500', label: '201-500 employees' }, { value: '501-1000', label: '501-1,000 employees' }, { value: '1001-5000', label: '1,001-5,000 employees' }, { value: '5001-10000', label: '5,001-10,000 employees' }, { value: '10001+', label: '10,001+ employees' }]; }
