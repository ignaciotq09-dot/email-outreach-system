export const SENIORITY_LEVELS = ['Entry', 'Junior', 'Mid-Level', 'Senior', 'Manager', 'Director', 'VP', 'C-Level', 'Partner', 'Owner', 'Founder'];

export const PROFESSION_EXPANSIONS: Record<string, string[]> = {
  'contractors': ['General Contractor', 'Contractor', 'Construction Manager', 'Project Manager', 'Owner', 'President'],
  'lawyers': ['Attorney', 'Lawyer', 'Partner', 'Associate', 'General Counsel'],
  'doctors': ['Doctor', 'Physician', 'MD', 'Medical Director', 'Owner'],
  'accountants': ['Accountant', 'CPA', 'Controller', 'CFO', 'Partner', 'Owner'],
  'realtors': ['Realtor', 'Real Estate Agent', 'Real Estate Broker', 'Broker', 'Owner'],
};

export const SENIORITY_MAPPINGS: Record<string, string[]> = {
  'senior': ['Senior', 'Manager', 'Director'], 'junior': ['Entry', 'Junior'],
  'executive': ['Director', 'VP', 'C-Level'], 'decision maker': ['Manager', 'Director', 'VP', 'C-Level', 'Owner'],
};
