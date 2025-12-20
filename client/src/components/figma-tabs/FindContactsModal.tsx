import { useState } from 'react';
import { 
  X, 
  Search, 
  Filter, 
  ChevronDown, 
  MapPin, 
  Briefcase, 
  Building2,
  Users,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Plus,
  ChevronRight
} from 'lucide-react';

interface FindContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  title: string;
  company: string;
  selected: boolean;
}

const MOCK_RESULTS: SearchResult[] = [
  { id: '1', name: 'Daniel', title: 'Real Estate Developer', company: 'REDW DEVELOPMENT', selected: false },
  { id: '2', name: 'Lia', title: 'Real Estate Developer', company: 'Amazon', selected: false },
  { id: '3', name: 'Anthony', title: 'Real Estate Developer', company: 'MANDATE DEVELOPMENT GROUP, LLC', selected: false },
  { id: '4', name: 'Andrew', title: 'Real Estate Developer', company: 'Portada', selected: false },
  { id: '5', name: 'Brian', title: 'Real Estate Developer', company: 'Hyperion Development Group', selected: false },
  { id: '6', name: 'Aaron', title: 'Real Estate Developer', company: 'Dash Development', selected: false },
  { id: '7', name: 'Gustavo', title: 'Real Estate Developer', company: 'MSG Developer Group, LLC', selected: false },
  { id: '8', name: 'Bryan', title: 'Real Estate Developer', company: 'Keller Williams Realty, LLC', selected: false },
];

export function FindContactsModal({ isOpen, onClose, isDarkMode }: FindContactsModalProps) {
  const [searchQuery, setSearchQuery] = useState('find estate developer in miami');
  const [results, setResults] = useState<SearchResult[]>(MOCK_RESULTS);

  if (!isOpen) return null;

  const selectedCount = results.filter(r => r.selected).length;

  const toggleSelect = (id: string) => {
    setResults(results.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const selectAll = () => {
    setResults(results.map(r => ({ ...r, selected: true })));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`relative w-[95vw] max-w-[1400px] h-[85vh] rounded-2xl overflow-hidden flex ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-900/95 via-purple-950/40 to-gray-900/95 border border-purple-500/30'
            : 'bg-white border border-gray-200'
        } shadow-2xl ${isDarkMode ? 'shadow-purple-500/20' : 'shadow-lg'} backdrop-blur-xl`}
        style={{ animation: 'scale-in 0.3s ease-out' }}
      >
        {/* Left Sidebar - Filters */}
        <div
          className={`w-64 border-r flex flex-col ${
            isDarkMode
              ? 'bg-gradient-to-b from-purple-950/20 to-gray-900/40 border-purple-500/20'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className={`px-4 py-3.5 border-b flex items-center justify-between ${
            isDarkMode ? 'border-purple-500/20' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-2">
              <Filter className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Filters
              </span>
            </div>
            <button className={`text-xs ${isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}>
              Clear all
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Job Titles */}
            <div>
              <button
                className={`w-full flex items-center justify-between text-sm mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Job Titles
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    isDarkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                  }`}>
                    5
                  </span>
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Location */}
            <div>
              <button
                className={`w-full flex items-center justify-between text-sm mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    isDarkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                  }`}>
                    1
                  </span>
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Industry */}
            <div>
              <button
                className={`w-full flex items-center justify-between text-sm ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Industry
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    isDarkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                  }`}>
                    1
                  </span>
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Companies */}
            <div>
              <button
                className={`w-full flex items-center justify-between text-sm ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Companies
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Company Size */}
            <div>
              <button
                className={`w-full flex items-center justify-between text-sm ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Company Size
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`p-4 border-t ${isDarkMode ? 'border-purple-500/20' : 'border-gray-200'}`}>
            <button
              className={`w-full px-4 py-2.5 rounded-lg text-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 ${
                isDarkMode
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 hover:shadow-lg hover:shadow-purple-500/30'
                  : 'bg-purple-500 text-white hover:bg-purple-600 hover:shadow-lg'
              }`}
            >
              <Search className="w-4 h-4" />
              Search (7)
            </button>
          </div>
        </div>

        {/* Right Side - Search & Results */}
        <div className="flex-1 flex flex-col">
          {/* Top Search Bar */}
          <div
            className={`px-6 py-4 border-b ${
              isDarkMode
                ? 'bg-gradient-to-r from-purple-950/30 via-gray-900/40 to-indigo-950/30 border-purple-500/20 backdrop-blur-sm'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="find estate developer in miami"
                  className={`w-full pl-4 pr-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-gray-800/60 border-purple-500/30 focus:border-purple-400 focus:ring-purple-500/30 text-white placeholder:text-gray-500'
                      : 'bg-white border-gray-300 focus:border-purple-400 focus:ring-purple-100 text-gray-900 placeholder:text-gray-400'
                  }`}
                />
              </div>
              <button
                className={`px-4 py-2.5 rounded-lg text-sm transition-all hover:scale-105 active:scale-95 ${
                  isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-all hover:scale-110 active:scale-95 ${
                  isDarkMode
                    ? 'hover:bg-white/10 text-gray-400 hover:text-gray-300'
                    : 'hover:bg-gray-200 text-gray-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Searching text with confidence */}
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                Searching for real estate development professionals in Miami, FL
              </p>
              <span
                className={`text-xs px-2.5 py-1 rounded-md ${
                  isDarkMode
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}
              >
                95% confident
              </span>
            </div>

            {/* Active Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Active filters:
              </span>
              <div
                className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 ${
                  isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                }`}
              >
                Real Estate Developer
                <X className="w-3 h-3" />
              </div>
              <div
                className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 ${
                  isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                }`}
              >
                Property Developer
                <X className="w-3 h-3" />
              </div>
              <div
                className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 ${
                  isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                }`}
              >
                Lead Developer
                <X className="w-3 h-3" />
              </div>
              <div
                className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 ${
                  isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                }`}
              >
                Development Manager
                <X className="w-3 h-3" />
              </div>
              <div
                className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 ${
                  isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                }`}
              >
                VP of Development
                <X className="w-3 h-3" />
              </div>
              <div
                className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 ${
                  isDarkMode
                    ? 'bg-white/5 text-gray-400 border border-white/10'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                Miami, Florida, United States
                <X className="w-3 h-3" />
              </div>
              <div
                className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 ${
                  isDarkMode
                    ? 'bg-white/5 text-gray-400 border border-white/10'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                Real Estate
                <X className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Results Header */}
          <div
            className={`px-6 py-3 border-b flex items-center justify-between ${
              isDarkMode
                ? 'bg-gray-900/40 border-purple-500/20'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Results
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  isDarkMode
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-purple-100 text-purple-700'
                }`}
              >
                8 Found
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  isDarkMode
                    ? 'bg-yellow-500/20 text-yellow-300'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                No results available
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className={`px-3 py-1.5 rounded-lg text-xs transition-all hover:scale-105 active:scale-95 ${
                  isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                Load Received
              </button>
              <button
                onClick={selectAll}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all hover:scale-105 active:scale-95 ${
                  isDarkMode
                    ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Select All
              </button>
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto">
            <div className={`divide-y ${isDarkMode ? 'divide-purple-500/10' : 'divide-gray-100'}`}>
              {results.map((result) => (
                <div
                  key={result.id}
                  className={`px-6 py-4 flex items-center justify-between gap-4 transition-all ${
                    result.selected
                      ? isDarkMode
                        ? 'bg-purple-500/10 border-l-2 border-purple-400'
                        : 'bg-purple-50 border-l-2 border-purple-500'
                      : isDarkMode
                      ? 'hover:bg-white/[0.02]'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Left: Checkbox + Name/Title */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={result.selected}
                      onChange={() => toggleSelect(result.id)}
                      className={`w-4 h-4 rounded transition-all flex-shrink-0 ${
                        isDarkMode
                          ? 'bg-gray-700/50 border-purple-500/50 text-purple-500 focus:ring-purple-500/30'
                          : 'bg-white border-gray-300 text-purple-600 focus:ring-purple-500'
                      }`}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm mb-0.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {result.name}
                      </h3>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {result.title} at {result.company}
                      </p>
                    </div>
                  </div>

                  {/* Right: Action buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95 ${
                        isDarkMode
                          ? 'hover:bg-green-500/20 text-gray-500 hover:text-green-400'
                          : 'hover:bg-green-50 text-gray-400 hover:text-green-600'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95 ${
                        isDarkMode
                          ? 'hover:bg-red-500/20 text-gray-500 hover:text-red-400'
                          : 'hover:bg-red-50 text-gray-400 hover:text-red-600'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                    <button
                      className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95 ${
                        isDarkMode
                          ? 'hover:bg-white/10 text-gray-500 hover:text-gray-300'
                          : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            className={`px-6 py-3 border-t flex items-center justify-between ${
              isDarkMode
                ? 'bg-gradient-to-r from-purple-950/30 via-gray-900/40 to-indigo-950/30 border-purple-500/20 backdrop-blur-sm'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <span
              className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg text-sm transition-all hover:scale-105 active:scale-95 ${
                  isDarkMode
                    ? 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                disabled={selectedCount === 0}
                className={`px-5 py-2 rounded-lg text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${
                  selectedCount === 0
                    ? isDarkMode
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                    : isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 hover:shadow-lg hover:shadow-purple-500/30'
                    : 'bg-purple-500 text-white hover:bg-purple-600 hover:shadow-lg border border-purple-600'
                }`}
              >
                <Plus className="w-4 h-4" />
                Add {selectedCount > 0 && `${selectedCount} `}Contact{selectedCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}