// AI Parser Few-Shot Examples
// These are training examples for the AI to learn the expected output format

export const FEW_SHOT_EXAMPLES = `
EXAMPLE 1:
Query: "real estate developers in Miami"
Thinking: User wants people who develop real estate properties (not software developers). Miami is a city in Florida.
{
  "filters": {
    "jobTitles": ["Real Estate Developer", "Property Developer", "Land Developer", "Development Manager", "VP of Development"],
    "locations": ["Miami, Florida, United States"],
    "industries": ["Real Estate", "Commercial Real Estate"],
    "companySizes": [],
    "seniorities": [],
    "keywords": []
  },
  "confidence": 0.95,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for real estate development professionals in Miami, FL"
}

EXAMPLE 2:
Query: "VPs at fintech startups in NYC"
Thinking: User wants Vice Presidents at financial technology companies (small/startup size) in New York City.
{
  "filters": {
    "jobTitles": ["VP", "Vice President", "VP of Sales", "VP of Engineering", "VP of Marketing", "VP of Operations", "VP of Product"],
    "locations": ["New York, New York, United States", "New York City, New York, United States"],
    "industries": ["Financial Services", "Information Technology and Services", "Computer Software"],
    "companySizes": ["1-10", "11-50", "51-200"],
    "seniorities": ["VP"],
    "keywords": ["fintech"]
  },
  "confidence": 0.9,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for VP-level executives at fintech startups in New York City"
}

EXAMPLE 3:
Query: "developers in San Francisco"
Thinking: "Developers" is ambiguous - could mean software developers OR real estate developers. SF is a tech hub so software is more likely, but I should flag this.
{
  "filters": {
    "jobTitles": ["Software Developer", "Software Engineer", "Developer", "Full Stack Developer", "Frontend Developer", "Backend Developer"],
    "locations": ["San Francisco, California, United States"],
    "industries": ["Information Technology and Services", "Computer Software", "Internet"],
    "companySizes": [],
    "seniorities": [],
    "keywords": []
  },
  "confidence": 0.55,
  "needsDisambiguation": true,
  "disambiguationReason": "\\"Developer\\" could mean software developer or real estate developer. Showing software developers since San Francisco is a tech hub.",
  "alternativeInterpretations": [
    {"description": "Real Estate Developers", "filters": {"jobTitles": ["Real Estate Developer", "Property Developer"], "industries": ["Real Estate"]}, "confidence": 0.4}
  ],
  "explanation": "Showing software developers in SF (tech interpretation). Alternative: real estate developers"
}

EXAMPLE 4:
Query: "plumbers in Texas"
Thinking: User wants plumbing professionals. Apollo has limited coverage for trades, so I'll expand to include business owners who run plumbing companies.
{
  "filters": {
    "jobTitles": ["Plumber", "Master Plumber", "Plumbing Contractor", "Owner", "President", "General Manager"],
    "locations": ["Texas, United States"],
    "industries": ["Construction", "Building Materials"],
    "companySizes": [],
    "seniorities": ["Owner", "Founder"],
    "keywords": ["plumbing"]
  },
  "confidence": 0.7,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for plumbing business owners and contractors in Texas"
}

EXAMPLE 5:
Query: "CEOs of SaaS companies with 50-200 employees"
Thinking: User wants Chief Executive Officers at Software-as-a-Service companies of a specific size range.
{
  "filters": {
    "jobTitles": ["CEO", "Chief Executive Officer", "Founder", "Co-Founder", "President"],
    "locations": [],
    "industries": ["Computer Software", "Information Technology and Services", "Internet"],
    "companySizes": ["51-200"],
    "seniorities": ["C-Level", "Owner", "Founder"],
    "keywords": ["SaaS", "software as a service"]
  },
  "confidence": 0.95,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for CEOs at mid-sized SaaS companies"
}

EXAMPLE 6:
Query: "marketing managers at healthcare companies in Chicago"
Thinking: User wants mid-level marketing professionals at healthcare organizations in Chicago, IL.
{
  "filters": {
    "jobTitles": ["Marketing Manager", "Marketing Director", "Head of Marketing", "Digital Marketing Manager", "Brand Manager"],
    "locations": ["Chicago, Illinois, United States"],
    "industries": ["Hospital & Health Care", "Medical Practice", "Pharmaceuticals", "Biotechnology"],
    "companySizes": [],
    "seniorities": ["Manager", "Director"],
    "keywords": []
  },
  "confidence": 0.92,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for marketing managers at healthcare companies in Chicago"
}

EXAMPLE 7:
Query: "investors"
Thinking: Very broad query - what kind of investors? Real estate? Angel? VC? Private equity? Need to ask for clarification but will default to general investment professionals.
{
  "filters": {
    "jobTitles": ["Investor", "Angel Investor", "Venture Capitalist", "Managing Partner", "Principal", "Investment Manager", "Portfolio Manager"],
    "locations": [],
    "industries": ["Venture Capital & Private Equity", "Investment Management", "Investment Banking"],
    "companySizes": [],
    "seniorities": ["Partner", "Director", "VP", "C-Level"],
    "keywords": []
  },
  "confidence": 0.5,
  "needsDisambiguation": true,
  "disambiguationReason": "What type of investors? Options: Tech/VC investors, Real Estate investors, Angel investors, Private Equity",
  "alternativeInterpretations": [
    {"description": "Real Estate Investors", "filters": {"jobTitles": ["Real Estate Investor", "Property Investor"], "industries": ["Real Estate"]}, "confidence": 0.4},
    {"description": "Tech/VC Investors", "filters": {"jobTitles": ["Venture Capitalist", "Angel Investor"], "industries": ["Venture Capital & Private Equity"]}, "confidence": 0.5}
  ],
  "explanation": "Showing general investment professionals. Specify investor type for better results."
}

EXAMPLE 8:
Query: "contractors in LA"
Thinking: User wants contractors in Los Angeles. In B2B context, this likely means general contractors/construction.
{
  "filters": {
    "jobTitles": ["General Contractor", "Contractor", "Construction Manager", "Project Manager", "Owner", "President", "Superintendent"],
    "locations": ["Los Angeles, California, United States"],
    "industries": ["Construction", "Building Materials"],
    "companySizes": [],
    "seniorities": ["Owner", "Manager"],
    "keywords": []
  },
  "confidence": 0.85,
  "needsDisambiguation": false,
  "disambiguationReason": null,
  "alternativeInterpretations": [],
  "explanation": "Searching for construction contractors and company owners in Los Angeles"
}
`;
