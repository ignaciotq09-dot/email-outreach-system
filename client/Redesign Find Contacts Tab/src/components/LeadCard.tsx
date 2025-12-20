import { useState } from 'react';
import { 
  CheckCircle2, 
  MapPin, 
  Building2, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  Target,
  MessageSquare,
  Clock,
  Lightbulb
} from 'lucide-react';
import { Lead } from './FindContacts';
import { RadialScore } from './RadialScore';

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  onToggleSelect: () => void;
  viewMode?: 'card' | 'list';
}

export function LeadCard({ lead, isSelected, onToggleSelect, viewMode = 'card' }: LeadCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState(false);

  const handleExpand = async () => {
    if (!isExpanded && !lead.insights && !insightsError) {
      setIsLoadingInsights(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoadingInsights(false);
    }
    setIsExpanded(!isExpanded);
  };

  const getIcpScoreColor = (score?: number) => {
    if (!score) return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', label: 'N/A' };
    if (score >= 80) return { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300', label: 'Excellent Match' };
    if (score >= 60) return { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', label: 'Good Match' };
    if (score >= 40) return { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300', label: 'Fair Match' };
    return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', label: 'Low Match' };
  };

  const icpColor = getIcpScoreColor(lead.icpScore);
  const hasEmail = !!lead.email;

  return (
    <div
      className={`
        relative rounded-2xl border-2 p-5 transition-all duration-300 group
        ${!hasEmail ? 'border-dashed opacity-70' : ''}
        ${isSelected 
          ? 'border-purple-500 dark:border-transparent bg-gradient-to-br from-purple-50 via-indigo-50/30 to-blue-50 dark:from-purple-950/60 dark:via-indigo-950/30 dark:to-blue-950/60 shadow-xl shadow-purple-500/20 dark:shadow-purple-500/40 scale-[1.02]' 
          : hasEmail 
            ? 'border-gray-200/50 dark:border-transparent bg-white/60 dark:bg-zinc-900/80 backdrop-blur-xl hover:border-purple-300 dark:hover:border-transparent hover:shadow-xl dark:hover:shadow-purple-500/30 hover:-translate-y-1 cursor-pointer' 
            : 'border-gray-300/50 dark:border-gray-700/50 bg-gray-50/60 dark:bg-zinc-950/40 backdrop-blur-xl'
        }
      `}
      style={
        isSelected && typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
          ? {
              borderImage: 'linear-gradient(135deg, rgb(168, 85, 247), rgb(99, 102, 241), rgb(6, 182, 212)) 1',
              borderImageSlice: 1,
            }
          : undefined
      }
    >
      {/* Neon glow for selected in dark mode */}
      {isSelected && (
        <>
          <div className="hidden dark:block absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 rounded-2xl opacity-50 blur-sm -z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-blue-500/5 dark:from-purple-500/10 dark:via-indigo-500/10 dark:to-cyan-500/10 rounded-2xl pointer-events-none"></div>
        </>
      )}
      
      {/* Hover glow effect for non-selected cards in dark mode */}
      {hasEmail && !isSelected && (
        <div className="hidden dark:block absolute -inset-[1px] bg-gradient-to-r from-purple-500/0 via-indigo-500/0 to-cyan-500/0 group-hover:from-purple-500/30 group-hover:via-indigo-500/30 group-hover:to-cyan-500/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 -z-10 blur-sm"></div>
      )}
      
      {/* Header Row */}
      <div className="relative flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 mt-1 text-purple-600 rounded border-purple-300 dark:border-purple-700 focus:ring-purple-500 focus:ring-2 cursor-pointer transition-all"
          />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {lead.name}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* ICP Score with Radial Indicator */}
          {lead.icpScore && (
            <div className="flex items-center gap-2 px-2 py-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <RadialScore score={lead.icpScore} size={36} />
              <div className="flex flex-col">
                <span className={`text-[10px] font-bold ${icpColor.text}`}>
                  {icpColor.label}
                </span>
                <span className="text-[9px] text-gray-500 dark:text-gray-400">ICP Match</span>
              </div>
            </div>
          )}

          {/* Feedback Buttons */}
          <button className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg transition-all hover:scale-110">
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all hover:scale-110">
            <ThumbsDown className="w-4 h-4" />
          </button>

          {/* LinkedIn Link */}
          {lead.linkedin && (
            <a
              href={lead.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg text-xs font-medium transition-all hover:scale-105 border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
            >
              LinkedIn
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {/* Expand Button */}
          <button
            onClick={handleExpand}
            className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-all hover:scale-110"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Title & Company */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 ml-7">
        {lead.title} at {lead.company}
      </p>

      {/* Metadata Row */}
      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 ml-7 flex-wrap">
        {/* Email */}
        {hasEmail ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="font-medium">{lead.email}</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                lead.emailVerified
                  ? 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/50'
                  : 'bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/50 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
              }`}
              title={
                lead.emailVerified
                  ? 'Email address has been verified by Apollo'
                  : 'Email address has not been verified - may bounce'
              }
            >
              {lead.emailVerified ? (
                <>
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3 h-3" />
                  Unverified
                </>
              )}
            </span>
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 italic">No email available</span>
        )}

        {/* Location */}
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          <span>{lead.location}</span>
        </div>

        {/* Company Size */}
        <div className="flex items-center gap-1.5">
          <Building2 className="w-4 h-4" />
          <span>{lead.companySize} employees</span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-gray-200/50 dark:border-gray-800/50">
          {isLoadingInsights ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <div className="relative w-12 h-12 mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
                  <Loader2 className="relative w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mx-auto" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Generating insights...</p>
              </div>
            </div>
          ) : insightsError ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Failed to load insights</p>
                <button
                  onClick={() => {
                    setInsightsError(false);
                    handleExpand();
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : lead.insights ? (
            <div className="grid grid-cols-2 gap-6 bg-gradient-to-br from-gray-50/50 to-purple-50/20 dark:from-gray-900/50 dark:to-purple-950/20 p-5 rounded-xl border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm">
              {/* Left Column */}
              <div className="space-y-5">
                {/* Company Insights */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-semibold">
                    <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg">
                      <Building2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm">Company Insights</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {lead.insights.company.summary}
                  </p>
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Likely Focus:</p>
                    <ul className="space-y-1">
                      {lead.insights.company.focus.map((item, i) => (
                        <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                          <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Role Context */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-semibold">
                    <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                      <Target className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm">Role Context</span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Pain Points:</p>
                    <ul className="space-y-1">
                      {lead.insights.role.painPoints.map((point, i) => (
                        <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                          <span className="text-red-600 dark:text-red-400 font-bold">!</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Goals:</p>
                    <ul className="space-y-1">
                      {lead.insights.role.goals.map((goal, i) => (
                        <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                          <span className="text-green-600 dark:text-green-400 font-bold">→</span>
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                {/* Outreach Strategy */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-semibold">
                    <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                      <MessageSquare className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm">Outreach Strategy</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {lead.insights.outreach.strategy}
                  </p>
                  <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 bg-blue-50/50 dark:bg-blue-950/20 p-2 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
                    <Clock className="w-3.5 h-3.5 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span>{lead.insights.outreach.timing}</span>
                  </div>
                </div>

                {/* Talking Points */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Talking Points:</p>
                  <ul className="space-y-1">
                    {lead.insights.outreach.talkingPoints.map((point, i) => (
                      <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Avoid */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Avoid:</p>
                  <ul className="space-y-1">
                    {lead.insights.outreach.avoid.map((item, i) => (
                      <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="text-orange-600 dark:text-orange-400 font-bold">⚠</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Opening Lines */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-semibold">
                    <div className="p-1.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                      <Lightbulb className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm">Opening Lines</span>
                  </div>
                  <div className="space-y-2">
                    {lead.insights.outreach.openingLines.map((line, i) => (
                      <div
                        key={i}
                        className="p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-purple-200/50 dark:border-purple-800/30 rounded-lg text-xs text-gray-600 dark:text-gray-400 italic shadow-sm"
                      >
                        "{line}"
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
              No insights available for this contact yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}