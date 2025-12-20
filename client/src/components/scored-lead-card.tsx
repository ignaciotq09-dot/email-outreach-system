/**
 * Scored Lead Card Component
 * Displays a lead with ICP scoring and match indicators
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Building2,
  MapPin,
  Briefcase,
  ExternalLink,
  Mail,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Check,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoredLead {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string | null;
  title: string | null;
  seniority: string | null;
  company: string | null;
  companyWebsite: string | null;
  location: string | null;
  industry: string | null;
  companySize: string | null;
  employeeCount: number | null;
  revenue: string | null;
  technologies: string[];
  linkedinUrl: string | null;
  photoUrl: string | null;
  emailStatus: string | null;
  icpScore: number;
  matchReasons: string[];
  unmatchReasons: string[];
  overallScore: number;
}

interface ScoredLeadCardProps {
  lead: ScoredLead;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onFeedback?: (type: "thumbs_up" | "thumbs_down") => void;
  showIcpScore?: boolean;
  className?: string;
}

export default function ScoredLeadCard({
  lead,
  isSelected,
  onSelect,
  onFeedback,
  showIcpScore = true,
  className,
}: ScoredLeadCardProps) {
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30";
    if (score >= 60) return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30";
    return "text-muted-foreground bg-muted";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Fair Match";
    return "Low Match";
  };

  const handleFeedback = (type: "thumbs_up" | "thumbs_down") => {
    if (onFeedback) {
      onFeedback(type);
      setFeedbackGiven(type === "thumbs_up" ? "up" : "down");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border bg-card transition-all",
        isSelected && "ring-2 ring-primary border-primary",
        className
      )}
      data-testid={`lead-card-${lead.id}`}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onSelect}
        className="mt-1"
        data-testid={`checkbox-lead-${lead.id}`}
      />

      <Avatar className="h-12 w-12 flex-shrink-0">
        {lead.photoUrl ? (
          <AvatarImage src={lead.photoUrl} alt={lead.name} />
        ) : null}
        <AvatarFallback className="bg-primary/10 text-primary">
          {getInitials(lead.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{lead.name}</h4>
              {lead.linkedinUrl && (
                <a
                  href={lead.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                  data-testid={`linkedin-${lead.id}`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            {lead.title && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Briefcase className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{lead.title}</span>
                {lead.seniority && (
                  <Badge variant="outline" className="ml-1 text-xs py-0">
                    {lead.seniority}
                  </Badge>
                )}
              </p>
            )}
          </div>

          {showIcpScore && lead.icpScore !== 50 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                    getScoreColor(lead.icpScore)
                  )}
                  data-testid={`icp-score-${lead.id}`}
                >
                  <TrendingUp className="h-3 w-3" />
                  {lead.icpScore}%
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <div className="space-y-2">
                  <div className="font-medium">{getScoreLabel(lead.icpScore)}</div>
                  {lead.matchReasons.length > 0 && (
                    <div className="space-y-1">
                      {lead.matchReasons.map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-1 text-xs text-green-600">
                          <Check className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {reason}
                        </div>
                      ))}
                    </div>
                  )}
                  {lead.unmatchReasons.length > 0 && (
                    <div className="space-y-1">
                      {lead.unmatchReasons.map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-1 text-xs text-muted-foreground">
                          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {lead.company && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {lead.company}
              {lead.companySize && (
                <span className="text-muted-foreground/60">({lead.companySize})</span>
              )}
            </span>
          )}
          {lead.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {lead.location}
            </span>
          )}
          {lead.industry && (
            <Badge variant="outline" className="text-xs py-0 px-1.5">
              {lead.industry}
            </Badge>
          )}
        </div>

        {lead.email && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <Mail className="h-3 w-3 text-green-600" />
            <span className="text-green-600">{lead.email}</span>
            {lead.emailStatus && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs py-0",
                  lead.emailStatus === "verified"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : lead.emailStatus === "likely"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-yellow-50 text-yellow-700 border-yellow-200"
                )}
              >
                {lead.emailStatus}
              </Badge>
            )}
          </div>
        )}

        {lead.technologies && lead.technologies.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {lead.technologies.slice(0, 4).map((tech, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs py-0 px-1.5">
                {tech}
              </Badge>
            ))}
            {lead.technologies.length > 4 && (
              <Badge variant="secondary" className="text-xs py-0 px-1.5">
                +{lead.technologies.length - 4}
              </Badge>
            )}
          </div>
        )}
      </div>

      {onFeedback && (
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7",
              feedbackGiven === "up" && "text-green-600 bg-green-100"
            )}
            onClick={() => handleFeedback("thumbs_up")}
            disabled={feedbackGiven !== null}
            data-testid={`feedback-up-${lead.id}`}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7",
              feedbackGiven === "down" && "text-red-600 bg-red-100"
            )}
            onClick={() => handleFeedback("thumbs_down")}
            disabled={feedbackGiven !== null}
            data-testid={`feedback-down-${lead.id}`}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
