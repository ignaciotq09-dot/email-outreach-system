import { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Brain,
  X,
  Briefcase,
  MapPin,
  Building,
  Building2,
  Users,
  UserPlus,
  Loader2,
  LayoutGrid,
  List,
  Zap
} from 'lucide-react';
import { LeadCard } from './LeadCard';
import { Lead, Filters } from './FindContacts';

interface ResultsViewProps {
  leads: Lead[];
  filters: Filters;
  aiQuery: string;
  onAiQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onRemoveFilter: (type: keyof Filters, value: string) => void;
  isSearching: boolean;
  selectedLeads: Set<string>;
  onToggleSelectLead: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function ResultsView({
  leads,
  filters,
  aiQuery,
  onAiQueryChange,
  onSearch,
  onRemoveFilter,
  isSearching,
  selectedLeads,
  onToggleSelectLead,
  onSelectAll,
  onDeselectAll,
}: ResultsViewProps) {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiQuery.trim()) {
      onSearch(aiQuery);
    }
  };

  const leadsWithEmail = leads.filter(lead => lead.email).length;

  const hasActiveFilters = 
    filters.jobTitles.length > 0 ||
    filters.locations.length > 0 ||
    filters.industries.length > 0 ||
    filters.companies.length > 0 ||
    filters.companySizes.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Consolidated Smart Header */}
      <div className="relative bg-gradient-to-r from-purple-100/50 via-indigo-100/50 to-blue-100/50 dark:from-purple-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 border-b border-purple-200/50 dark:border-purple-900/30 backdrop-blur-xl">
        {/* Decorative gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        
        <div className="px-6 py-4 space-y-3">
          {/* Top Row: Search + Stats + Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <form onSubmit={handleSubmit} className="flex-1 max-w-xl">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                    <div className="p-1 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-md">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => onAiQueryChange(e.target.value)}
                    placeholder="Search for contacts..."
                    className="relative w-full h-11 pl-11 pr-24 bg-white/80 dark:bg-zinc-900/95 backdrop-blur-xl border-2 border-purple-200/50 dark:border-purple-500/50 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-500/30 shadow-lg dark:shadow-purple-500/20 transition-all"
                    disabled={isSearching}
                  />
                  <button
                    type="submit"
                    disabled={!aiQuery.trim() || isSearching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                  >
                    {isSearching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* AI Confidence Badge */}
            {aiQuery && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-blue-100/80 to-indigo-100/80 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-xl border border-blue-200/50 dark:border-blue-800/30 backdrop-blur-sm">
                <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-md">
                  <Brain className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">92% confident</span>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold border border-gray-200 dark:border-gray-700 shadow-sm">
                {leads.length} results
              </span>
              <span className="px-3 py-2 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 text-green-700 dark:text-green-300 rounded-lg text-sm font-semibold border-2 border-green-300 dark:border-green-700 shadow-sm">
                {leadsWithEmail} verified
              </span>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'card'
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={selectedLeads.size === leads.length ? onDeselectAll : onSelectAll}
                className="px-4 py-2 border-2 border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 text-sm"
              >
                {selectedLeads.size === leads.length ? 'Deselect' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Bottom Row: Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Filters:</span>
              
              {filters.jobTitles.map((title) => (
                <span
                  key={title}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium border border-blue-200 dark:border-blue-800/50 shadow-sm hover:shadow-md transition-all"
                >
                  <Briefcase className="w-3 h-3" />
                  {title}
                  <button
                    onClick={() => onRemoveFilter('jobTitles', title)}
                    className="hover:text-blue-900 dark:hover:text-blue-100 ml-0.5 hover:scale-110 transition-transform"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {filters.locations.map((location) => (
                <span
                  key={location}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-xs font-medium border border-green-200 dark:border-green-800/50 shadow-sm hover:shadow-md transition-all"
                >
                  <MapPin className="w-3 h-3" />
                  {location}
                  <button
                    onClick={() => onRemoveFilter('locations', location)}
                    className="hover:text-green-900 dark:hover:text-green-100 ml-0.5 hover:scale-110 transition-transform"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {filters.industries.map((industry) => (
                <span
                  key={industry}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg text-xs font-medium border border-orange-200 dark:border-orange-800/50 shadow-sm hover:shadow-md transition-all"
                >
                  <Building className="w-3 h-3" />
                  {industry}
                  <button
                    onClick={() => onRemoveFilter('industries', industry)}
                    className="hover:text-orange-900 dark:hover:text-orange-100 ml-0.5 hover:scale-110 transition-transform"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {filters.companies.map((company) => (
                <span
                  key={company}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/40 dark:to-teal-900/20 text-teal-700 dark:text-teal-300 rounded-lg text-xs font-medium border border-teal-200 dark:border-teal-800/50 shadow-sm hover:shadow-md transition-all"
                >
                  <Building2 className="w-3 h-3" />
                  {company}
                  <button
                    onClick={() => onRemoveFilter('companies', company)}
                    className="hover:text-teal-900 dark:hover:text-teal-100 ml-0.5 hover:scale-110 transition-transform"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {filters.companySizes.map((size) => (
                <span
                  key={size}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium border border-indigo-200 dark:border-indigo-800/50 shadow-sm hover:shadow-md transition-all"
                >
                  <Users className="w-3 h-3" />
                  {size}
                  <button
                    onClick={() => onRemoveFilter('companySizes', size)}
                    className="hover:text-indigo-900 dark:hover:text-indigo-100 ml-0.5 hover:scale-110 transition-transform"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lead Cards List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-3 max-w-5xl">
          {leads.map((lead, index) => (
            <div
              key={lead.id}
              style={{
                animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`
              }}
            >
              <LeadCard
                lead={lead}
                isSelected={selectedLeads.has(lead.id)}
                onToggleSelect={() => onToggleSelectLead(lead.id)}
                viewMode={viewMode}
              />
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center py-8">
          <button className="px-8 py-3 border-2 border-purple-300 dark:border-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-950/30 dark:hover:to-indigo-950/30 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md">
            Load More (Page 1 of 10)
          </button>
        </div>
      </div>

      {/* Floating Action Button */}
      {selectedLeads.size > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
          <button
            className="group relative w-16 h-16 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white rounded-2xl font-medium transition-all flex items-center justify-center shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-110 active:scale-95"
            style={{
              animation: 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <Zap className="w-7 h-7 relative z-10" />
            <span className="absolute -top-2 -right-2 w-7 h-7 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-lg">
              {selectedLeads.size}
            </span>
          </button>
          <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-xl">
              Add {selectedLeads.size} to Campaign
            </div>
          </div>
        </div>
      )}
    </div>
  );
}