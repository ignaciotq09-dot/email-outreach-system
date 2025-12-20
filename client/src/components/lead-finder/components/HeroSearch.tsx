import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Sparkles, Briefcase, MapPin, Building, Users } from "lucide-react";

interface HeroSearchProps {
  aiQuery: string;
  isSearching: boolean;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
}

export function HeroSearch({ aiQuery, isSearching, onQueryChange, onSearch }: HeroSearchProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-purple-50/50 to-transparent dark:from-purple-950/20">
      <div className="max-w-2xl w-full px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/50 mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Use AI to find the right contacts</h2>
          <p className="text-muted-foreground">Describe who you're looking for and AI will search for matching contacts</p>
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <Input
              placeholder="Example: CEOs at tech startups in California"
              value={aiQuery}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !isSearching) onSearch(); }}
              className="pl-12 h-14 text-lg bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 focus:border-purple-400 focus:ring-purple-400 shadow-sm"
              data-testid="input-ai-search"
            />
          </div>
          <Button onClick={onSearch} disabled={isSearching || !aiQuery.trim()} className="h-14 px-6 bg-purple-600 hover:bg-purple-700" data-testid="button-ai-search">
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </Button>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground mb-2">For best results, include:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"><Briefcase className="w-3 h-3" />Job title</span>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"><MapPin className="w-3 h-3" />Location</span>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"><Building className="w-3 h-3" />Industry</span>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"><Users className="w-3 h-3" />Company size</span>
          </div>
        </div>
      </div>
    </div>
  );
}
