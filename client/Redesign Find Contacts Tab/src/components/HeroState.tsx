import { Sparkles, Briefcase, MapPin, Building, Users, Search, Loader2 } from 'lucide-react';

interface HeroStateProps {
  aiQuery: string;
  onAiQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export function HeroState({ aiQuery, onAiQueryChange, onSearch, isSearching }: HeroStateProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiQuery.trim()) {
      onSearch(aiQuery);
    }
  };

  return (
    <div className="flex items-center justify-center h-full px-8">
      <div className="max-w-2xl w-full text-center space-y-8 animate-float-slow">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative w-20 h-20 animate-float">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 rounded-2xl rotate-6 blur-xl opacity-50 animate-pulse-glow"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/50 group cursor-default transition-transform hover:scale-110">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/20 group-hover:from-white/10 group-hover:to-white/30 transition-all"></div>
              <Sparkles className="w-10 h-10 text-white relative z-10" />
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Use AI to find the right contacts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
            Describe who you're looking for and AI will search for matching contacts
          </p>
        </div>

        {/* AI Search Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl blur-lg opacity-25 group-hover:opacity-40 group-focus-within:opacity-50 transition-opacity duration-300"></div>
            
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg shadow-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => onAiQueryChange(e.target.value)}
                placeholder="Example: CEOs at tech startups in California"
                className="relative w-full h-16 pl-16 pr-36 bg-white/80 dark:bg-zinc-900/95 backdrop-blur-xl border-2 border-purple-200/50 dark:border-purple-500/50 rounded-2xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-500/30 shadow-xl dark:shadow-purple-500/30 hover:shadow-2xl dark:hover:shadow-purple-500/50 transition-all duration-300"
                disabled={isSearching}
              />
              <button
                type="submit"
                disabled={!aiQuery.trim() || isSearching}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-300 dark:disabled:from-gray-700 dark:disabled:via-gray-700 dark:disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-300 flex items-center gap-2 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 cursor-pointer disabled:hover:scale-100"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Hint Pills */}
          <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">For best results, include:</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="relative group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-medium border border-blue-200 dark:border-blue-800/50 shadow-sm hover:shadow-md transition-all duration-300 cursor-default hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-400/0 group-hover:from-blue-400/10 group-hover:to-blue-400/5 rounded-xl transition-all"></div>
                <Briefcase className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Job title</span>
              </span>
              <span className="relative group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-900/20 text-green-700 dark:text-green-300 rounded-xl text-xs font-medium border border-green-200 dark:border-green-800/50 shadow-sm hover:shadow-md transition-all duration-300 cursor-default hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 to-green-400/0 group-hover:from-green-400/10 group-hover:to-green-400/5 rounded-xl transition-all"></div>
                <MapPin className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Location</span>
              </span>
              <span className="relative group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-orange-900/20 text-orange-700 dark:text-orange-300 rounded-xl text-xs font-medium border border-orange-200 dark:border-orange-800/50 shadow-sm hover:shadow-md transition-all duration-300 cursor-default hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/0 to-orange-400/0 group-hover:from-orange-400/10 group-hover:to-orange-400/5 rounded-xl transition-all"></div>
                <Building className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Industry</span>
              </span>
              <span className="relative group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-medium border border-indigo-200 dark:border-indigo-800/50 shadow-sm hover:shadow-md transition-all duration-300 cursor-default hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/0 to-indigo-400/0 group-hover:from-indigo-400/10 group-hover:to-indigo-400/5 rounded-xl transition-all"></div>
                <Users className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Company size</span>
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}