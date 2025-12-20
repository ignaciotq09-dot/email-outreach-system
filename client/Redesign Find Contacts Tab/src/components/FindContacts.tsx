import { useState } from 'react';
import { FiltersSidebar } from './FiltersSidebar';
import { HeroState } from './HeroState';
import { ResultsView } from './ResultsView';

export interface Filters {
  jobTitles: string[];
  locations: string[];
  industries: string[];
  companies: string[];
  companySizes: string[];
}

export interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  email?: string;
  emailVerified?: boolean;
  location: string;
  companySize: string;
  icpScore?: number;
  linkedin?: string;
  insights?: {
    company: {
      summary: string;
      focus: string[];
    };
    role: {
      painPoints: string[];
      goals: string[];
    };
    outreach: {
      strategy: string;
      timing: string;
      talkingPoints: string[];
      avoid: string[];
      openingLines: string[];
    };
  };
}

const MOCK_LEADS: Lead[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    title: 'CEO',
    company: 'TechFlow Inc',
    email: 'sarah.johnson@techflow.com',
    emailVerified: true,
    location: 'San Francisco, CA',
    companySize: '51-200',
    icpScore: 92,
    linkedin: 'https://linkedin.com/in/sarahjohnson',
    insights: {
      company: {
        summary: 'TechFlow is a fast-growing B2B SaaS company specializing in workflow automation for enterprise teams. Recently raised Series B funding and expanding rapidly.',
        focus: ['Enterprise automation', 'Team productivity', 'API integrations']
      },
      role: {
        painPoints: ['Scaling sales operations efficiently', 'Managing growing team communication'],
        goals: ['Reach 500+ enterprise customers by Q4', 'Build strategic partnerships']
      },
      outreach: {
        strategy: 'Focus on scalability and enterprise-grade solutions. Emphasize ROI and team efficiency gains.',
        timing: 'Best to reach out Tuesday-Thursday, 10am-2pm PST',
        talkingPoints: ['Enterprise automation success stories', 'Integration capabilities', 'Proven ROI metrics'],
        avoid: ['Generic sales pitches', 'Unproven solutions'],
        openingLines: [
          'Noticed TechFlow just closed Series B - congrats! We help companies at your stage scale outreach 3x faster.',
          'Your focus on enterprise automation aligns perfectly with what we\'re building...'
        ]
      }
    }
  },
  {
    id: '2',
    name: 'Michael Chen',
    title: 'VP of Sales',
    company: 'DataSync Corp',
    email: 'mchen@datasync.io',
    emailVerified: false,
    location: 'Austin, TX',
    companySize: '201-500',
    icpScore: 78,
    linkedin: 'https://linkedin.com/in/michaelchen',
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    title: 'Head of Business Development',
    company: 'CloudNine Solutions',
    location: 'New York, NY',
    companySize: '51-200',
    icpScore: 85,
    linkedin: 'https://linkedin.com/in/emilyrodriguez',
  },
  {
    id: '4',
    name: 'David Park',
    title: 'Founder & CEO',
    company: 'StartupX',
    email: 'david@startupx.com',
    emailVerified: true,
    location: 'San Francisco, CA',
    companySize: '11-50',
    icpScore: 67,
    linkedin: 'https://linkedin.com/in/davidpark',
  },
  {
    id: '5',
    name: 'Jennifer Wu',
    title: 'Chief Revenue Officer',
    company: 'ScaleCo',
    email: 'jwu@scaleco.com',
    emailVerified: true,
    location: 'Los Angeles, CA',
    companySize: '501-1000',
    icpScore: 94,
    linkedin: 'https://linkedin.com/in/jenniferwu',
  },
];

export function FindContacts() {
  const [filters, setFilters] = useState<Filters>({
    jobTitles: [],
    locations: [],
    industries: [],
    companies: [],
    companySizes: [],
  });
  const [aiQuery, setAiQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  const handleSearch = async (query?: string) => {
    setIsSearching(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLeads(MOCK_LEADS);
    setHasSearched(true);
    setIsSearching(false);
  };

  const handleClearFilters = () => {
    setFilters({
      jobTitles: [],
      locations: [],
      industries: [],
      companies: [],
      companySizes: [],
    });
  };

  const activeFilterCount = 
    filters.jobTitles.length + 
    filters.locations.length + 
    filters.industries.length + 
    filters.companies.length + 
    filters.companySizes.length;

  return (
    <div className="flex h-full">
      {/* Filters Sidebar */}
      <FiltersSidebar
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
        onClearFilters={handleClearFilters}
        isSearching={isSearching}
        activeFilterCount={activeFilterCount}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {!hasSearched && !isSearching ? (
          <HeroState
            aiQuery={aiQuery}
            onAiQueryChange={setAiQuery}
            onSearch={handleSearch}
            isSearching={isSearching}
          />
        ) : (
          <ResultsView
            leads={leads}
            aiQuery={aiQuery}
            onAiQueryChange={setAiQuery}
            onSearch={handleSearch}
            isSearching={isSearching}
            filters={filters}
            onRemoveFilter={(type, value) => {
              setFilters(prev => ({
                ...prev,
                [type]: prev[type as keyof Filters].filter(v => v !== value)
              }));
            }}
            selectedLeads={selectedLeads}
            onToggleSelectLead={(id) => {
              setSelectedLeads(prev => {
                const next = new Set(prev);
                if (next.has(id)) {
                  next.delete(id);
                } else {
                  next.add(id);
                }
                return next;
              });
            }}
            onSelectAll={() => {
              setSelectedLeads(new Set(leads.map(l => l.id)));
            }}
            onDeselectAll={() => {
              setSelectedLeads(new Set());
            }}
          />
        )}
      </div>
    </div>
  );
}
