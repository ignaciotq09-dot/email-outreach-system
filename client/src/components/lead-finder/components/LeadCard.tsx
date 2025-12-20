import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Building2, MapPin, ExternalLink, CheckCircle2, TrendingUp, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Loader2, Lightbulb, Target, MessageSquare, AlertTriangle, Clock, ShieldCheck, ShieldAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Lead } from "../types";

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  hasFeedback: boolean;
  onToggleSelection: (id: string) => void;
  onFeedback: (lead: Lead, type: "thumbs_up" | "thumbs_down") => void;
}

interface DeepDiveInsights {
  companyInsights: {
    summary: string;
    likelyFocus: string[];
    marketPosition: string;
  };
  roleContext: {
    responsibilities: string[];
    painPoints: string[];
    goals: string[];
  };
  outreachStrategy: {
    bestApproach: string;
    talkingPoints: string[];
    avoidTopics: string[];
    timing: string;
  };
  personalization: {
    openingLines: string[];
    valueProps: string[];
  };
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
  if (score >= 60) return "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
  if (score >= 40) return "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
  return "bg-muted text-muted-foreground border-border";
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return "Excellent Match";
  if (score >= 60) return "Good Match";
  if (score >= 40) return "Fair Match";
  return "Low Match";
};

export function LeadCard({ lead, isSelected, hasFeedback, onToggleSelection, onFeedback }: LeadCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: deepDiveData, isLoading: isLoadingDeepDive, error: deepDiveError, refetch } = useQuery({
    queryKey: ['/api/leads/deep-dive', lead.id],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/leads/deep-dive', {
        name: lead.name,
        title: lead.title,
        company: lead.company,
        industry: lead.industry,
        location: lead.location,
        email: lead.email,
        linkedinUrl: lead.linkedinUrl,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate insights (${response.status})`);
      }
      return response.json();
    },
    enabled: false,
    retry: false,
  });

  const handleExpand = () => {
    if (!isExpanded && !deepDiveData) {
      refetch();
    }
    setIsExpanded(!isExpanded);
  };

  const insights: DeepDiveInsights | null = deepDiveData?.data?.insights || null;

  return (
    <div className={`rounded-lg border ${isSelected ? 'border-purple-400 dark:border-purple-600 bg-purple-50/50 dark:bg-purple-950/20' : lead.email ? 'border-border hover:border-green-200 dark:hover:border-green-800' : 'border-dashed border-border opacity-75'}`} data-testid={`lead-card-${lead.id}`}>
      <div className="flex items-start gap-4 p-4">
        <div className="flex items-center gap-2 pt-1">
          <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelection(lead.id)} className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600" data-testid={`checkbox-lead-${lead.id}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium" data-testid={`text-lead-name-${lead.id}`}>{lead.name}</h4>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {lead.icpScore !== undefined && lead.icpScore !== 50 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getScoreColor(lead.icpScore)}`}><TrendingUp className="w-3 h-3" />{lead.icpScore}%</div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <div className="space-y-2">
                      <div className="font-medium">{getScoreLabel(lead.icpScore)}</div>
                      {lead.matchReasons && lead.matchReasons.length > 0 && (
                        <div className="space-y-1">{lead.matchReasons.slice(0, 3).map((reason, idx) => (<div key={idx} className="flex items-start gap-1 text-xs text-green-600 dark:text-green-400"><CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />{reason}</div>))}</div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {!hasFeedback && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onFeedback(lead, "thumbs_up"); }} data-testid={`feedback-up-${lead.id}`}><ThumbsUp className="w-3 h-3 text-green-600" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onFeedback(lead, "thumbs_down"); }} data-testid={`feedback-down-${lead.id}`}><ThumbsDown className="w-3 h-3 text-muted-foreground" /></Button>
                </div>
              )}
              
              {lead.linkedinUrl && (<a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm" data-testid={`link-linkedin-${lead.id}`}><ExternalLink className="w-3 h-3" />LinkedIn</a>)}
              
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExpand} data-testid={`button-expand-${lead.id}`}>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {(lead.title || lead.company) && (<p className="text-sm text-muted-foreground mt-1">{lead.title && lead.company ? `${lead.title} at ${lead.company}` : lead.title || lead.company}</p>)}
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
            {lead.email && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                {lead.email}
                {lead.emailStatus === "verified" ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" data-testid={`badge-email-verified-${lead.id}`}>
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Email address has been verified by Apollo</TooltipContent>
                  </Tooltip>
                ) : lead.email && lead.emailStatus === "unverified" ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground" data-testid={`badge-email-unverified-${lead.id}`}>
                        <ShieldAlert className="w-3 h-3" />
                        Unverified
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Email address has not been verified - may bounce</TooltipContent>
                  </Tooltip>
                ) : null}
              </span>
            )}
            {lead.location && (<span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.location}</span>)}
            {lead.companySize && (<span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{lead.companySize}</span>)}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t px-4 py-4 bg-muted/30">
          {isLoadingDeepDive ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Generating insights...</span>
            </div>
          ) : deepDiveError ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="w-8 h-8 text-orange-500 mb-2" />
              <p className="text-sm text-muted-foreground mb-3">{(deepDiveError as Error).message || "Failed to generate insights"}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} data-testid={`button-retry-${lead.id}`}>
                Try Again
              </Button>
            </div>
          ) : insights ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium flex items-center gap-2 text-sm mb-2">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    Company Insights
                  </h5>
                  <p className="text-sm text-muted-foreground">{insights.companyInsights.summary}</p>
                  <div className="mt-2">
                    <span className="text-xs font-medium text-muted-foreground">Likely Focus:</span>
                    <ul className="mt-1 space-y-1">
                      {insights.companyInsights.likelyFocus.map((focus, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                          <span className="text-blue-500 mt-0.5">•</span> {focus}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium flex items-center gap-2 text-sm mb-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    Role Context
                  </h5>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Pain Points:</span>
                      <ul className="mt-1 space-y-1">
                        {insights.roleContext.painPoints.slice(0, 3).map((point, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-orange-500 mt-0.5">!</span> {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Goals:</span>
                      <ul className="mt-1 space-y-1">
                        {insights.roleContext.goals.map((goal, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-green-500 mt-0.5">→</span> {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h5 className="font-medium flex items-center gap-2 text-sm mb-2">
                    <MessageSquare className="w-4 h-4 text-green-500" />
                    Outreach Strategy
                  </h5>
                  <p className="text-sm text-muted-foreground mb-2">{insights.outreachStrategy.bestApproach}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <Clock className="w-3 h-3" />
                    {insights.outreachStrategy.timing}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Talking Points:</span>
                    <ul className="mt-1 space-y-1">
                      {insights.outreachStrategy.talkingPoints.map((point, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" /> {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {insights.outreachStrategy.avoidTopics.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-muted-foreground">Avoid:</span>
                      <ul className="mt-1 space-y-1">
                        {insights.outreachStrategy.avoidTopics.map((topic, idx) => (
                          <li key={idx} className="text-xs text-red-500 dark:text-red-400 flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <h5 className="font-medium flex items-center gap-2 text-sm mb-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Opening Lines
                  </h5>
                  <ul className="space-y-2">
                    {insights.personalization.openingLines.map((line, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground bg-background rounded p-2 border italic">
                        "{line}"
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>Click expand to generate insights for this lead</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
