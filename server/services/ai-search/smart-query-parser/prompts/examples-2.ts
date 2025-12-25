// AI Parser Few-Shot Examples (Part 2)

export const FEW_SHOT_EXAMPLES_2 = `
EXAMPLE 9:
Query: "HR directors at enterprise companies"
Thinking: User wants senior HR professionals at large companies (1000+ employees).
{
  "filters": {
    "jobTitles": ["HR Director", "Director of Human Resources", "VP of HR", "Chief People Officer", "Head of HR", "VP Human Resources"],
    "locations": [],
    "industries": [],
    "companySizes": ["1001-5000", "5001-10000", "10001+"],
    "seniorities": ["Director", "VP", "C-Level"],
    "keywords": []
  },
  "confidence": 0.93,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for HR directors at large enterprise companies"
}

EXAMPLE 10:
Query: "restaurant owners in Miami"
Thinking: User wants people who own restaurants in Miami.
{
  "filters": {
    "jobTitles": ["Owner", "Restaurant Owner", "Restaurateur", "General Manager", "Managing Partner", "Proprietor"],
    "locations": ["Miami, Florida, United States"],
    "industries": ["Restaurants", "Food & Beverages", "Hospitality"],
    "companySizes": [],
    "seniorities": ["Owner", "Founder"],
    "keywords": ["restaurant"]
  },
  "confidence": 0.88,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for restaurant owners and operators in Miami"
}

EXAMPLE 11:
Query: "sales leaders at B2B software companies"
Thinking: User wants senior sales people (VP/Director level) at business-to-business software companies.
{
  "filters": {
    "jobTitles": ["VP of Sales", "Sales Director", "Head of Sales", "Chief Revenue Officer", "CRO", "Sales Manager", "Director of Sales"],
    "locations": [],
    "industries": ["Computer Software", "Information Technology and Services", "Internet"],
    "companySizes": [],
    "seniorities": ["VP", "Director", "C-Level", "Manager"],
    "keywords": ["B2B", "enterprise sales"]
  },
  "confidence": 0.9,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for VP/Director-level sales leaders at B2B software companies"
}

EXAMPLE 12:
Query: "dentists"
Thinking: User wants dental professionals. Likely practice owners or decision makers.
{
  "filters": {
    "jobTitles": ["Dentist", "DDS", "DMD", "Dental Director", "Practice Owner", "Associate Dentist", "Orthodontist"],
    "locations": [],
    "industries": ["Medical Practice", "Hospital & Health Care"],
    "companySizes": [],
    "seniorities": ["Owner"],
    "keywords": ["dental"]
  },
  "confidence": 0.85,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for dentists and dental practice owners nationwide"
}

EXAMPLE 13:
Query: "tech leads at FAANG"
Thinking: User wants technical leaders at Facebook/Meta, Apple, Amazon, Netflix, Google.
{
  "filters": {
    "jobTitles": ["Tech Lead", "Technical Lead", "Engineering Manager", "Staff Engineer", "Senior Software Engineer", "Principal Engineer"],
    "locations": [],
    "industries": ["Computer Software", "Internet", "Information Technology and Services"],
    "companySizes": ["10001+"],
    "seniorities": ["Senior", "Manager"],
    "keywords": ["FAANG", "Meta", "Apple", "Amazon", "Netflix", "Google"]
  },
  "confidence": 0.8,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for tech leads at large tech companies (FAANG-level)"
}

EXAMPLE 14:
Query: "decision makers at manufacturing companies in the midwest"
Thinking: User wants senior leaders (C-level, VP, Directors) at manufacturing companies in midwest US states.
{
  "filters": {
    "jobTitles": ["CEO", "President", "Owner", "VP", "Director", "General Manager", "COO", "CFO", "Plant Manager"],
    "locations": ["Illinois, United States", "Ohio, United States", "Michigan, United States", "Indiana, United States", "Wisconsin, United States", "Minnesota, United States", "Iowa, United States", "Missouri, United States"],
    "industries": ["Manufacturing", "Industrial Automation", "Machinery"],
    "companySizes": [],
    "seniorities": ["C-Level", "VP", "Director", "Owner"],
    "keywords": []
  },
  "confidence": 0.85,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for decision makers at manufacturing companies in Midwest US"
}

EXAMPLE 15:
Query: "lawyers specializing in real estate in Boston"
Thinking: User wants attorneys who work in real estate law in Boston, MA.
{
  "filters": {
    "jobTitles": ["Attorney", "Lawyer", "Partner", "Associate", "Real Estate Attorney", "Of Counsel", "General Counsel"],
    "locations": ["Boston, Massachusetts, United States"],
    "industries": ["Law Practice", "Legal Services"],
    "companySizes": [],
    "seniorities": ["Partner", "Senior"],
    "keywords": ["real estate law", "real estate"]
  },
  "confidence": 0.9,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for real estate attorneys in Boston"
}
`;
