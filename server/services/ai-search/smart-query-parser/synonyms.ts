export const JOB_TITLE_SYNONYMS: Record<string, string[]> = {
  "real estate developer": ["Real Estate Developer", "Property Developer", "Land Developer", "Development Manager", "VP of Development", "Development Director", "Real Estate Development Manager"],
  "real estate agent": ["Real Estate Agent", "Realtor", "Real Estate Broker", "Broker Associate", "Licensed Realtor", "Listing Agent", "Buyer's Agent"],
  "real estate investor": ["Real Estate Investor", "Property Investor", "Real Estate Investment Manager", "Portfolio Manager", "Investment Director"],
  "contractor": ["General Contractor", "Contractor", "Construction Manager", "Project Manager", "Site Manager", "Superintendent", "Owner", "President"],
  "plumber": ["Plumber", "Master Plumber", "Plumbing Contractor", "Journeyman Plumber", "Plumbing Supervisor", "Owner"],
  "electrician": ["Electrician", "Master Electrician", "Electrical Contractor", "Journeyman Electrician", "Electrical Supervisor", "Owner"],
  "hvac": ["HVAC Technician", "HVAC Contractor", "HVAC Installer", "HVAC Service Manager", "HVAC Owner", "Mechanical Contractor"],
  "roofer": ["Roofer", "Roofing Contractor", "Roofing Foreman", "Roofing Estimator", "Roofing Owner"],
  "landscaper": ["Landscaper", "Landscape Contractor", "Landscape Designer", "Grounds Manager", "Landscape Owner"],
  "lawyer": ["Attorney", "Lawyer", "Partner", "Associate", "Of Counsel", "General Counsel", "Legal Counsel", "Managing Partner"],
  "attorney": ["Attorney", "Lawyer", "Partner", "Associate", "Of Counsel", "General Counsel", "Legal Counsel"],
  "doctor": ["Doctor", "Physician", "MD", "Medical Director", "Chief Medical Officer", "Practice Owner", "Attending Physician"],
  "nurse": ["Nurse", "Registered Nurse", "RN", "Nurse Practitioner", "NP", "Charge Nurse", "Nurse Manager", "Director of Nursing"],
  "dentist": ["Dentist", "DDS", "DMD", "Dental Director", "Practice Owner", "Associate Dentist"],
  "accountant": ["Accountant", "CPA", "Controller", "CFO", "Finance Manager", "Tax Manager", "Partner", "Staff Accountant"],
  "financial advisor": ["Financial Advisor", "Financial Planner", "Wealth Manager", "Investment Advisor", "Financial Consultant"],
  "insurance agent": ["Insurance Agent", "Insurance Broker", "Insurance Producer", "Account Executive", "Sales Agent"],
  "mortgage broker": ["Mortgage Broker", "Loan Officer", "Mortgage Loan Originator", "Mortgage Consultant", "Lending Manager"],
  "investor": ["Investor", "Angel Investor", "Venture Capitalist", "VC", "Private Equity", "Managing Partner", "Investment Manager"],
  "tech investor": ["Venture Capitalist", "VC", "Angel Investor", "Investment Partner", "Managing Director", "Principal", "Tech Investor"],
  "founder": ["Founder", "Co-Founder", "CEO", "Owner", "Entrepreneur", "President"],
  "startup founder": ["Founder", "Co-Founder", "CEO", "Startup CEO", "Entrepreneur"],
  "ceo": ["CEO", "Chief Executive Officer", "President", "Managing Director", "Owner"],
  "cto": ["CTO", "Chief Technology Officer", "VP Engineering", "Head of Engineering", "Technical Director"],
  "cfo": ["CFO", "Chief Financial Officer", "VP Finance", "Finance Director", "Controller"],
  "cmo": ["CMO", "Chief Marketing Officer", "VP Marketing", "Head of Marketing", "Marketing Director"],
  "sales manager": ["Sales Manager", "Sales Director", "VP Sales", "Head of Sales", "Business Development Manager", "Account Executive"],
  "marketing manager": ["Marketing Manager", "Marketing Director", "VP Marketing", "Head of Marketing", "Brand Manager", "Growth Manager"],
  "hr manager": ["HR Manager", "Human Resources Manager", "HR Director", "VP HR", "Head of HR", "People Operations Manager"],
  "software engineer": ["Software Engineer", "Software Developer", "Developer", "Programmer", "Full Stack Developer", "Backend Developer", "Frontend Developer"],
  "software developer": ["Software Developer", "Software Engineer", "Developer", "Programmer", "Full Stack Developer"],
  "product manager": ["Product Manager", "Product Director", "VP Product", "Head of Product", "Senior Product Manager"],
  "project manager": ["Project Manager", "Program Manager", "Delivery Manager", "PMO", "Project Director"],
  "operations manager": ["Operations Manager", "Operations Director", "VP Operations", "COO", "Head of Operations"],
  "office manager": ["Office Manager", "Office Administrator", "Administrative Manager", "Facilities Manager"],
  "restaurant owner": ["Restaurant Owner", "Restaurateur", "Owner", "General Manager", "Managing Partner"],
  "hotel manager": ["Hotel Manager", "General Manager", "Hotel Director", "Hospitality Manager", "GM"],
  "gym owner": ["Gym Owner", "Fitness Center Owner", "Owner", "General Manager", "Fitness Director"],
  "chiropractor": ["Chiropractor", "DC", "Chiropractic Physician", "Practice Owner"],
  "veterinarian": ["Veterinarian", "DVM", "Vet", "Veterinary Director", "Practice Owner"],
  "pharmacist": ["Pharmacist", "PharmD", "Pharmacy Manager", "Clinical Pharmacist", "Pharmacy Director"],
  "therapist": ["Therapist", "Licensed Therapist", "Counselor", "Psychologist", "LCSW", "LPC"],
  "consultant": ["Consultant", "Senior Consultant", "Managing Consultant", "Principal", "Partner", "Director"],
  "architect": ["Architect", "Principal Architect", "Design Director", "Partner", "Owner", "Senior Architect"],
  "interior designer": ["Interior Designer", "Design Director", "Principal Designer", "Owner", "Senior Designer"],
  "photographer": ["Photographer", "Studio Owner", "Creative Director", "Owner", "Lead Photographer"],
  "videographer": ["Videographer", "Video Producer", "Creative Director", "Owner", "Lead Videographer"],
  "writer": ["Writer", "Content Writer", "Copywriter", "Author", "Editor", "Content Director"],
  "recruiter": ["Recruiter", "Talent Acquisition", "Headhunter", "Executive Recruiter", "Recruiting Manager"],
  "property manager": ["Property Manager", "Community Manager", "Asset Manager", "Regional Manager", "Portfolio Manager"],
  "builder": ["Builder", "Home Builder", "Custom Home Builder", "Construction Manager", "Owner", "President"],
  "home builder": ["Home Builder", "Custom Home Builder", "Residential Builder", "Builder", "Construction Manager", "Owner"],
  "lumber": ["Lumber Yard Manager", "Building Materials Manager", "Lumber Sales", "Yard Manager", "Building Supply Manager", "Owner"],
  "construction": ["Construction Manager", "General Contractor", "Project Manager", "Superintendent", "Owner", "President", "Construction Executive"],
};

export const INDUSTRY_MAPPINGS: Record<string, string[]> = {
  "real estate": ["Real Estate", "Commercial Real Estate", "Residential Real Estate"],
  "construction": ["Construction", "Building Materials", "Civil Engineering"],
  "legal": ["Law Practice", "Legal Services"],
  "law": ["Law Practice", "Legal Services"],
  "healthcare": ["Hospital & Health Care", "Medical Practice", "Health, Wellness and Fitness"],
  "medical": ["Hospital & Health Care", "Medical Practice"],
  "technology": ["Information Technology and Services", "Computer Software", "Internet"],
  "tech": ["Information Technology and Services", "Computer Software", "Internet"],
  "software": ["Computer Software", "Information Technology and Services"],
  "finance": ["Financial Services", "Banking", "Investment Banking", "Investment Management"],
  "banking": ["Banking", "Financial Services"],
  "insurance": ["Insurance"],
  "restaurant": ["Restaurants", "Food & Beverages", "Hospitality"],
  "hospitality": ["Hospitality", "Hotels", "Restaurants"],
  "retail": ["Retail", "Consumer Goods"],
  "manufacturing": ["Manufacturing", "Industrial Automation"],
  "automotive": ["Automotive", "Motor Vehicle Manufacturing"],
  "education": ["Education Management", "Higher Education", "Primary/Secondary Education"],
  "nonprofit": ["Non-Profit Organization Management", "Civic & Social Organization"],
  "government": ["Government Administration", "Government Relations"],
  "marketing": ["Marketing and Advertising", "Public Relations and Communications"],
  "advertising": ["Marketing and Advertising"],
  "consulting": ["Management Consulting", "Business Consulting", "Strategy Consulting"],
  "accounting": ["Accounting", "Financial Services"],
  "architecture": ["Architecture & Planning"],
  "design": ["Design", "Graphic Design", "Interior Design"],
  "media": ["Media Production", "Broadcast Media", "Online Media"],
  "entertainment": ["Entertainment", "Media Production"],
  "sports": ["Sports", "Health, Wellness and Fitness"],
  "fitness": ["Health, Wellness and Fitness", "Sports"],
  "beauty": ["Cosmetics", "Health, Wellness and Fitness"],
  "salon": ["Cosmetics", "Health, Wellness and Fitness", "Consumer Services"],
  "spa": ["Health, Wellness and Fitness", "Hospitality"],
  "transportation": ["Transportation/Trucking/Railroad", "Logistics and Supply Chain"],
  "logistics": ["Logistics and Supply Chain", "Transportation/Trucking/Railroad"],
  "agriculture": ["Farming", "Agriculture"],
  "farming": ["Farming", "Agriculture"],
  "energy": ["Oil & Energy", "Renewables & Environment", "Utilities"],
  "oil": ["Oil & Energy"],
  "renewables": ["Renewables & Environment"],
  "telecommunications": ["Telecommunications"],
  "telecom": ["Telecommunications"],
  "pharmaceutical": ["Pharmaceuticals"],
  "biotech": ["Biotechnology"],
  "venture capital": ["Venture Capital & Private Equity"],
  "private equity": ["Venture Capital & Private Equity"],
  "investment": ["Investment Management", "Investment Banking", "Venture Capital & Private Equity"],
};

export const SENIORITY_INDICATORS: Record<string, string[]> = {
  "entry": ["Entry", "Junior"],
  "junior": ["Entry", "Junior"],
  "mid": ["Senior"],
  "senior": ["Senior", "Manager"],
  "manager": ["Manager"],
  "director": ["Director"],
  "vp": ["VP", "Director"],
  "executive": ["VP", "C-Level"],
  "c-level": ["C-Level"],
  "owner": ["Owner", "Founder"],
  "founder": ["Founder", "Owner"],
  "partner": ["Partner", "Owner"],
  "decision maker": ["Manager", "Director", "VP", "C-Level", "Owner", "Founder"],
  "leadership": ["Manager", "Director", "VP", "C-Level", "Owner"],
};

export const COMPANY_SIZE_MAPPINGS: Record<string, string[]> = {
  "startup": ["1-10", "11-50"],
  "small": ["1-10", "11-50", "51-200"],
  "small business": ["1-10", "11-50"],
  "smb": ["11-50", "51-200", "201-500"],
  "mid-size": ["201-500", "501-1000"],
  "medium": ["201-500", "501-1000"],
  "large": ["1001-5000", "5001-10000"],
  "enterprise": ["1001-5000", "5001-10000", "10001+"],
  "fortune 500": ["5001-10000", "10001+"],
};

export function expandJobTitle(title: string): string[] {
  const normalizedTitle = title.toLowerCase().trim();
  
  for (const [key, expansions] of Object.entries(JOB_TITLE_SYNONYMS)) {
    if (normalizedTitle === key || normalizedTitle.includes(key) || key.includes(normalizedTitle)) {
      return expansions;
    }
  }
  
  for (const [key, expansions] of Object.entries(JOB_TITLE_SYNONYMS)) {
    const keyWords = key.split(' ');
    const titleWords = normalizedTitle.split(' ');
    const overlap = keyWords.filter(w => titleWords.includes(w)).length;
    if (overlap >= Math.min(2, keyWords.length)) {
      return expansions;
    }
  }
  
  return [title];
}

export function mapToApolloIndustries(industry: string): string[] {
  const normalizedIndustry = industry.toLowerCase().trim();
  
  for (const [key, apolloIndustries] of Object.entries(INDUSTRY_MAPPINGS)) {
    if (normalizedIndustry === key || normalizedIndustry.includes(key)) {
      return apolloIndustries;
    }
  }
  
  return [industry];
}

export function expandSeniority(seniority: string): string[] {
  const normalizedSeniority = seniority.toLowerCase().trim();
  
  for (const [key, levels] of Object.entries(SENIORITY_INDICATORS)) {
    if (normalizedSeniority.includes(key)) {
      return levels;
    }
  }
  
  return [];
}

export function expandCompanySize(size: string): string[] {
  const normalizedSize = size.toLowerCase().trim();
  
  for (const [key, ranges] of Object.entries(COMPANY_SIZE_MAPPINGS)) {
    if (normalizedSize.includes(key)) {
      return ranges;
    }
  }
  
  return [size];
}
