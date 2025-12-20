/**
 * Query Preprocessor
 * Cleans, normalizes, and enhances raw user queries before AI parsing
 */

const COMMON_MISSPELLINGS: Record<string, string> = {
  'marketting': 'marketing',
  'managment': 'management',
  'developper': 'developer',
  'developpers': 'developers',
  'engineeer': 'engineer',
  'engeneer': 'engineer',
  'enginer': 'engineer',
  'directore': 'director',
  'presidant': 'president',
  'excecutive': 'executive',
  'exectuive': 'executive',
  'assistent': 'assistant',
  'asistant': 'assistant',
  'accountent': 'accountant',
  'acountant': 'accountant',
  'analust': 'analyst',
  'analist': 'analyst',
  'architech': 'architect',
  'architecht': 'architect',
  'consulant': 'consultant',
  'consultent': 'consultant',
  'cordinator': 'coordinator',
  'coodinator': 'coordinator',
  'realestate': 'real estate',
  'realstate': 'real estate',
  'sofware': 'software',
  'softwar': 'software',
  'tecnology': 'technology',
  'techonology': 'technology',
  'finace': 'finance',
  'finanace': 'finance',
  'insurence': 'insurance',
  'insuranse': 'insurance',
  'resturant': 'restaurant',
  'restraunt': 'restaurant',
  'restarant': 'restaurant',
  'heathcare': 'healthcare',
  'healthcar': 'healthcare',
  'helthcare': 'healthcare',
  'constraction': 'construction',
  'contruction': 'construction',
  'plumer': 'plumber',
  'plummer': 'plumber',
  'electrian': 'electrician',
  'electrican': 'electrician',
  'attorny': 'attorney',
  'attourney': 'attorney',
  'laywer': 'lawyer',
  'lawer': 'lawyer',
  'vetrinarian': 'veterinarian',
  'veternarian': 'veterinarian',
  'pharmasist': 'pharmacist',
  'farmacist': 'pharmacist',
  'terapist': 'therapist',
  'therapiest': 'therapist',
  'recuiter': 'recruiter',
  'recruter': 'recruiter',
  'entrpreneur': 'entrepreneur',
  'entreprenur': 'entrepreneur',
  'enterpreneur': 'entrepreneur',
  'ventur': 'venture',
  'ventrue': 'venture',
  'startp': 'startup',
  'start up': 'startup',
  'start-up': 'startup',
  'saas': 'SaaS',
  'b2b': 'B2B',
  'b 2 b': 'B2B',
  'b-2-b': 'B2B',
};

const ABBREVIATION_EXPANSIONS: Record<string, string> = {
  'vp': 'VP',
  'ceo': 'CEO',
  'cto': 'CTO',
  'cfo': 'CFO',
  'cmo': 'CMO',
  'coo': 'COO',
  'cro': 'CRO',
  'cpo': 'CPO',
  'cio': 'CIO',
  'hr': 'HR',
  'it': 'IT',
  'pr': 'PR',
  'nyc': 'New York City',
  'sf': 'San Francisco',
  'la': 'Los Angeles',
  'dc': 'Washington DC',
  'chi': 'Chicago',
  'atl': 'Atlanta',
  'bos': 'Boston',
  'phx': 'Phoenix',
  'philly': 'Philadelphia',
  'dallas': 'Dallas',
  'htx': 'Houston',
  'dfw': 'Dallas',
  'sfo': 'San Francisco',
  'lax': 'Los Angeles',
  'bay area': 'San Francisco Bay Area',
  'silicon valley': 'San Francisco Bay Area',
  'socal': 'Southern California',
  'norcal': 'Northern California',
  'tristate': 'New York metropolitan area',
  'dmv': 'Washington DC metropolitan area',
  'uk': 'United Kingdom',
  'usa': 'United States',
  'us': 'United States',
};

const NOISE_PHRASES = [
  'find me',
  'search for',
  'looking for',
  'i need',
  'i want',
  'can you find',
  'please find',
  'help me find',
  'show me',
  'get me',
  'i\'m looking for',
  'im looking for',
  'we need',
  'we want',
  'find',
  'search',
  'look for',
  'locate',
];

const REGION_EXPANSIONS: Record<string, string[]> = {
  'midwest': ['Illinois', 'Ohio', 'Michigan', 'Indiana', 'Wisconsin', 'Minnesota', 'Iowa', 'Missouri', 'Kansas', 'Nebraska', 'North Dakota', 'South Dakota'],
  'northeast': ['New York', 'Massachusetts', 'Pennsylvania', 'New Jersey', 'Connecticut', 'Rhode Island', 'Vermont', 'New Hampshire', 'Maine'],
  'southeast': ['Florida', 'Georgia', 'North Carolina', 'South Carolina', 'Virginia', 'Tennessee', 'Alabama', 'Mississippi', 'Louisiana', 'Kentucky'],
  'southwest': ['Texas', 'Arizona', 'New Mexico', 'Oklahoma', 'Nevada'],
  'west coast': ['California', 'Oregon', 'Washington'],
  'pacific northwest': ['Oregon', 'Washington', 'Idaho'],
  'new england': ['Massachusetts', 'Connecticut', 'Rhode Island', 'Vermont', 'New Hampshire', 'Maine'],
  'great lakes': ['Michigan', 'Ohio', 'Indiana', 'Illinois', 'Wisconsin', 'Minnesota'],
  'mountain west': ['Colorado', 'Utah', 'Montana', 'Wyoming', 'Idaho'],
  'south': ['Texas', 'Florida', 'Georgia', 'North Carolina', 'South Carolina', 'Virginia', 'Tennessee', 'Alabama', 'Mississippi', 'Louisiana', 'Kentucky', 'Arkansas', 'Oklahoma'],
};

export interface PreprocessResult {
  cleanedQuery: string;
  originalQuery: string;
  corrections: string[];
  expansions: string[];
  noiseRemoved: string[];
  regionExpanded?: { region: string; states: string[] };
}

export function preprocessQuery(query: string): PreprocessResult {
  const originalQuery = query;
  const corrections: string[] = [];
  const expansions: string[] = [];
  const noiseRemoved: string[] = [];
  let cleanedQuery = query.trim();
  
  for (const noise of NOISE_PHRASES) {
    const regex = new RegExp(`^${noise}\\s+`, 'i');
    if (regex.test(cleanedQuery)) {
      noiseRemoved.push(noise);
      cleanedQuery = cleanedQuery.replace(regex, '');
    }
  }
  
  const words = cleanedQuery.split(/\s+/);
  const correctedWords = words.map(word => {
    const lowerWord = word.toLowerCase();
    if (COMMON_MISSPELLINGS[lowerWord]) {
      corrections.push(`${word} → ${COMMON_MISSPELLINGS[lowerWord]}`);
      return COMMON_MISSPELLINGS[lowerWord];
    }
    return word;
  });
  cleanedQuery = correctedWords.join(' ');
  
  let regionExpanded: { region: string; states: string[] } | undefined;
  for (const [region, states] of Object.entries(REGION_EXPANSIONS)) {
    const regex = new RegExp(`\\b${region}\\b`, 'i');
    if (regex.test(cleanedQuery)) {
      regionExpanded = { region, states };
      break;
    }
  }
  
  const abbreviatedWords = cleanedQuery.split(/\s+/);
  const expandedWords = abbreviatedWords.map(word => {
    const lowerWord = word.toLowerCase().replace(/[.,!?]/g, '');
    if (ABBREVIATION_EXPANSIONS[lowerWord]) {
      if (!['vp', 'ceo', 'cto', 'cfo', 'cmo', 'coo', 'cro', 'cpo', 'cio', 'hr', 'it', 'pr'].includes(lowerWord)) {
        expansions.push(`${word} → ${ABBREVIATION_EXPANSIONS[lowerWord]}`);
        return ABBREVIATION_EXPANSIONS[lowerWord];
      }
    }
    return word;
  });
  cleanedQuery = expandedWords.join(' ');
  
  cleanedQuery = cleanedQuery.replace(/\s+/g, ' ').trim();
  
  return {
    cleanedQuery,
    originalQuery,
    corrections,
    expansions,
    noiseRemoved,
    regionExpanded
  };
}

export function normalizeQueryWhitespace(query: string): string {
  return query.replace(/\s+/g, ' ').trim();
}

export function extractEntities(query: string): {
  possibleCompanies: string[];
  possibleLocations: string[];
  possibleTitles: string[];
} {
  const possibleCompanies: string[] = [];
  const possibleLocations: string[] = [];
  const possibleTitles: string[] = [];
  
  const companyPatterns = [
    /\bat\s+([A-Z][a-zA-Z0-9\s]+(?:Inc|LLC|Corp|Company|Co|Ltd)?)/g,
    /\bfrom\s+([A-Z][a-zA-Z0-9\s]+)/g,
    /\bwho works? at\s+([A-Z][a-zA-Z0-9\s]+)/g,
  ];
  
  for (const pattern of companyPatterns) {
    const matches = query.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        possibleCompanies.push(match[1].trim());
      }
    }
  }
  
  const locationPatterns = [
    /\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:,\s*[A-Z]{2})?)/g,
    /\bfrom\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
  ];
  
  const knownCities = ['Miami', 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Boston', 'Nashville', 'Atlanta', 'Portland', 'Las Vegas', 'Detroit', 'Memphis', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Kansas City', 'Long Beach', 'Mesa', 'Virginia Beach', 'Oakland', 'Minneapolis', 'Tampa', 'Arlington', 'Tulsa', 'Miami', 'Cleveland', 'Pittsburgh', 'Philadelphia'];
  
  for (const city of knownCities) {
    if (query.toLowerCase().includes(city.toLowerCase())) {
      possibleLocations.push(city);
    }
  }
  
  const titleKeywords = ['ceo', 'cto', 'cfo', 'cmo', 'vp', 'director', 'manager', 'engineer', 'developer', 'founder', 'owner', 'president', 'partner', 'analyst', 'consultant', 'architect', 'designer', 'lead', 'head'];
  
  for (const keyword of titleKeywords) {
    if (query.toLowerCase().includes(keyword)) {
      possibleTitles.push(keyword);
    }
  }
  
  return { possibleCompanies, possibleLocations, possibleTitles };
}

export function detectNegations(query: string): { hasNegation: boolean; negatedTerms: string[] } {
  const negatedTerms: string[] = [];
  
  const negationPatterns = [
    /\bnot\s+(?:at\s+)?(\w+(?:\s+\w+)?)/gi,
    /\bexcluding?\s+(\w+(?:\s+\w+)?)/gi,
    /\bexcept\s+(\w+(?:\s+\w+)?)/gi,
    /\bno\s+(\w+(?:\s+\w+)?)/gi,
    /\bwithout\s+(\w+(?:\s+\w+)?)/gi,
  ];
  
  for (const pattern of negationPatterns) {
    const matches = query.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        negatedTerms.push(match[1].trim());
      }
    }
  }
  
  return {
    hasNegation: negatedTerms.length > 0,
    negatedTerms
  };
}

export function detectBooleanOperators(query: string): { 
  hasOr: boolean; 
  hasAnd: boolean;
  orTerms: string[][];
  andTerms: string[];
} {
  const orTerms: string[][] = [];
  const andTerms: string[] = [];
  
  const orPattern = /(\w+(?:\s+\w+)?)\s+(?:or|OR)\s+(\w+(?:\s+\w+)?)/g;
  const orMatches = query.matchAll(orPattern);
  for (const match of orMatches) {
    if (match[1] && match[2]) {
      orTerms.push([match[1].trim(), match[2].trim()]);
    }
  }
  
  const andPattern = /(\w+(?:\s+\w+)?)\s+(?:and|AND|&)\s+(\w+(?:\s+\w+)?)/g;
  const andMatches = query.matchAll(andPattern);
  for (const match of andMatches) {
    if (match[1] && match[2]) {
      andTerms.push(match[1].trim(), match[2].trim());
    }
  }
  
  return {
    hasOr: orTerms.length > 0,
    hasAnd: andTerms.length > 0,
    orTerms,
    andTerms: [...new Set(andTerms)]
  };
}
