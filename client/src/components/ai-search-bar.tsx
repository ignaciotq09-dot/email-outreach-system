/**
 * AI Search Bar Component
 * Conversational natural language search input with intelligent parsing
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Sparkles, X, Lightbulb, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParsedFilters {
  jobTitles: string[];
  locations: string[];
  industries: string[];
  companySizes: string[];
  companies: string[];  // Specific company names or domains
  seniorities: string[];
  technologies: string[];
  keywords: string[];
  revenueRanges: string[];
  intentTopics: string[];
}

interface Suggestion {
  id: number;
  type: string;
  text: string;
  filters: Partial<ParsedFilters>;
  predictedScore: number;
  reasoning: string;
}

interface AISearchBarProps {
  onSearch: (query: string) => void;
  onSuggestionClick?: (suggestion: Suggestion) => void;
  suggestions?: Suggestion[];
  isLoading?: boolean;
  parsedFilters?: ParsedFilters | null;
  explanation?: string;
  confidence?: number;
  needsClarification?: boolean;
  clarifyingQuestions?: string[];
  onClarify?: (answer: string) => void;
  placeholder?: string;
  className?: string;
}

export default function AISearchBar({
  onSearch,
  onSuggestionClick,
  suggestions = [],
  isLoading = false,
  parsedFilters,
  explanation,
  confidence,
  needsClarification,
  clarifyingQuestions = [],
  onClarify,
  placeholder = "Describe who you want to find... (e.g., \"senior marketers at SaaS startups in SF\")",
  className,
}: AISearchBarProps) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
    setShowSuggestions(false);
  };

  const handleClarifyClick = (question: string) => {
    if (onClarify) {
      setQuery(query + " ");
      inputRef.current?.focus();
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return "text-green-600 dark:text-green-400";
    if (conf >= 0.5) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getActiveFilterCount = (filters: ParsedFilters): number => {
    return (
      (filters.jobTitles?.length || 0) +
      (filters.locations?.length || 0) +
      (filters.industries?.length || 0) +
      (filters.companySizes?.length || 0) +
      (filters.companies?.length || 0) +
      (filters.seniorities?.length || 0) +
      (filters.technologies?.length || 0)
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-3 flex items-center gap-1.5 text-muted-foreground">
            <Sparkles className="h-4 w-4 text-violet-500" />
          </div>
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            placeholder={placeholder}
            className="pl-10 pr-24 h-12 text-base"
            disabled={isLoading}
            data-testid="input-ai-search"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {query && !isLoading && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuery("")}
                data-testid="button-clear-search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={!query.trim() || isLoading}
              className="h-8"
              data-testid="button-search"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-1" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border rounded-lg shadow-lg p-2 space-y-1">
          <div className="text-xs text-muted-foreground px-2 py-1 flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Suggested searches based on your patterns
          </div>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              className="w-full text-left px-3 py-2 rounded hover-elevate flex items-center justify-between group"
              onClick={() => handleSuggestionClick(suggestion)}
              data-testid={`suggestion-${suggestion.id}`}
            >
              <div>
                <div className="font-medium text-sm">{suggestion.text}</div>
                <div className="text-xs text-muted-foreground">{suggestion.reasoning}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {Math.round(suggestion.predictedScore)}%
                </Badge>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      )}

      {needsClarification && clarifyingQuestions.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm text-amber-900 dark:text-amber-100 font-medium">
                Your search could be more specific
              </p>
              <div className="space-y-1">
                {clarifyingQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    className="block text-sm text-amber-700 dark:text-amber-300 hover:underline text-left"
                    onClick={() => handleClarifyClick(question)}
                    data-testid={`clarify-question-${idx}`}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {parsedFilters && !needsClarification && (
        <div className="flex items-start gap-2 text-sm">
          {explanation && (
            <div className="flex-1">
              <span className="text-muted-foreground">{explanation}</span>
            </div>
          )}
          {getActiveFilterCount(parsedFilters) > 0 && (
            <Badge variant="outline" className="text-xs">
              {getActiveFilterCount(parsedFilters)} filters applied
            </Badge>
          )}
        </div>
      )}

      {parsedFilters && !needsClarification && getActiveFilterCount(parsedFilters) > 0 && (
        <div className="flex flex-wrap gap-2">
          {parsedFilters.jobTitles?.map((title, idx) => (
            <Badge key={`title-${idx}`} variant="secondary" className="text-xs">
              {title}
            </Badge>
          ))}
          {parsedFilters.seniorities?.map((sen, idx) => (
            <Badge key={`sen-${idx}`} variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              {sen}
            </Badge>
          ))}
          {parsedFilters.locations?.map((loc, idx) => (
            <Badge key={`loc-${idx}`} variant="outline" className="text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
              {loc}
            </Badge>
          ))}
          {parsedFilters.industries?.map((ind, idx) => (
            <Badge key={`ind-${idx}`} variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
              {ind}
            </Badge>
          ))}
          {parsedFilters.companySizes?.map((size, idx) => (
            <Badge key={`size-${idx}`} variant="outline" className="text-xs bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
              {size}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
