import {
  CheckCircle2,
  MapPin,
  Building2,
  ExternalLink,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Mail,
  MailX
} from 'lucide-react';
import { Lead } from './FindContacts';
import { RadialScore } from './RadialScore';

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  onToggleSelect: () => void;
  viewMode?: 'card' | 'list';
  isDarkMode?: boolean;
}

// Helper to get email quality badge props based on Apollo's email_status field
function getEmailStatusBadge(emailStatus: string | undefined, hasEmail: boolean, isDarkMode: boolean) {
  if (!hasEmail) {
    return {
      icon: MailX,
      label: 'No Email',
      bgColor: isDarkMode ? 'bg-gray-800/60' : 'bg-gray-100',
      textColor: isDarkMode ? 'text-gray-400' : 'text-gray-500',
      borderColor: isDarkMode ? 'border-gray-700' : 'border-gray-300',
    };
  }

  switch (emailStatus) {
    case 'verified':
    case 'valid':
      return {
        icon: ShieldCheck,
        label: 'Verified',
        bgColor: isDarkMode ? 'bg-green-900/40' : 'bg-green-50',
        textColor: isDarkMode ? 'text-green-400' : 'text-green-600',
        borderColor: isDarkMode ? 'border-green-700/50' : 'border-green-300',
      };
    case 'guessed':
      return {
        icon: ShieldAlert,
        label: 'Guessed',
        bgColor: isDarkMode ? 'bg-yellow-900/40' : 'bg-yellow-50',
        textColor: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
        borderColor: isDarkMode ? 'border-yellow-700/50' : 'border-yellow-300',
      };
    default:
      return {
        icon: Mail,
        label: 'Email',
        bgColor: isDarkMode ? 'bg-blue-900/40' : 'bg-blue-50',
        textColor: isDarkMode ? 'text-blue-400' : 'text-blue-600',
        borderColor: isDarkMode ? 'border-blue-700/50' : 'border-blue-300',
      };
  }
}

export function LeadCard({ lead, isSelected, onToggleSelect, viewMode = 'card', isDarkMode = false }: LeadCardProps) {
  const borderClassName = isSelected
    ? isDarkMode
      ? 'border-purple-500/30 shadow-lg shadow-purple-500/20'
      : 'border-purple-500 shadow-2xl shadow-purple-500/30'
    : isDarkMode
      ? 'border-white/5 hover:border-purple-500/20 hover:shadow-md hover:shadow-purple-500/10'
      : 'border-purple-200/60 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/20';

  const getIcpScoreColor = (score?: number) => {
    if (!score) return { bg: isDarkMode ? 'bg-gray-800' : 'bg-gray-100', text: isDarkMode ? 'text-gray-300' : 'text-gray-700', label: 'N/A' };
    if (score >= 80) return { bg: isDarkMode ? 'bg-green-900/40' : 'bg-green-100', text: isDarkMode ? 'text-green-300' : 'text-green-700', label: 'Excellent Match' };
    if (score >= 60) return { bg: isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100', text: isDarkMode ? 'text-blue-300' : 'text-blue-700', label: 'Good Match' };
    if (score >= 40) return { bg: isDarkMode ? 'bg-yellow-900/40' : 'bg-yellow-100', text: isDarkMode ? 'text-yellow-300' : 'text-yellow-700', label: 'Fair Match' };
    return { bg: isDarkMode ? 'bg-gray-800' : 'bg-gray-100', text: isDarkMode ? 'text-gray-300' : 'text-gray-700', label: 'Low Match' };
  };

  const icpColor = getIcpScoreColor(lead.icpScore);
  const hasEmail = !!lead.email;
  const emailBadge = getEmailStatusBadge(lead.emailStatus, hasEmail, isDarkMode);
  const EmailIcon = emailBadge.icon;

  return (
    <div
      style={{
        backgroundColor: isDarkMode
          ? (isSelected ? 'rgb(42, 34, 53)' : 'rgb(31, 26, 40)')
          : (isSelected ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255, 255, 255, 0.8)'),
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}
      className={`
        relative rounded-2xl transition-all duration-300 overflow-hidden group cursor-pointer
        border
        ${borderClassName}
      `}
    >
      {/* Animated gradient overlay for selected state */}
      {isSelected && isDarkMode && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-cyan-500/5 pointer-events-none animate-pulse"></div>
      )}

      {/* Hover glow effect - subtle for dark mode */}
      {!isSelected && isDarkMode && (
        <div className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 -z-10 blur-sm bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-cyan-500/10"></div>
      )}

      {/* Light mode effects */}
      {!isDarkMode && (
        <>
          {isSelected && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 pointer-events-none animate-pulse"></div>
              <div className="absolute -inset-[2px] rounded-2xl opacity-40 blur-lg -z-10 animate-pulse bg-gradient-to-r from-purple-500/40 via-indigo-500/40 to-cyan-500/40"></div>
            </>
          )}
          {!isSelected && (
            <div className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 -z-10 blur-md bg-gradient-to-r from-purple-500/0 via-indigo-500/0 to-cyan-500/0 group-hover:from-purple-500/30 group-hover:via-indigo-500/30 group-hover:to-cyan-500/30"></div>
          )}
        </>
      )}

      {/* Top accent gradient line - only show on select/hover */}
      {isDarkMode && (
        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'} transition-opacity`}></div>
      )}

      {/* Content Row */}
      <div className="relative px-6 py-4 flex items-center justify-between gap-4">
        {/* Left: Checkbox + Name/Title */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Custom styled checkbox with glow */}
          <div className="relative flex-shrink-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className={`w-5 h-5 rounded-md transition-all cursor-pointer
                ${isDarkMode ? 'text-purple-500' : 'text-purple-600'}
                border-2 ${isDarkMode ? 'border-purple-500/30 checked:border-purple-500/60 hover:border-purple-500/50' : 'border-purple-300 checked:border-purple-500 hover:border-purple-500'}
                focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-0
                shadow-sm checked:shadow-purple-500/20
                ${isDarkMode ? 'bg-[#0a0515]/80' : 'bg-white'}
              `}
            />
            {isSelected && isDarkMode && (
              <div className="absolute -inset-1.5 rounded-lg blur-sm -z-10 bg-purple-500/30"></div>
            )}
            {isSelected && !isDarkMode && (
              <>
                <div className="absolute -inset-1.5 rounded-lg blur-md -z-10 animate-pulse bg-purple-500/30"></div>
                <div className="absolute -inset-0.5 rounded-md -z-10 bg-gradient-to-br from-purple-500/20 to-indigo-500/20"></div>
              </>
            )}
          </div>

          {/* Name and Title with gradient text on hover */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold mb-1 transition-all duration-200 ${isSelected
                ? isDarkMode ? 'text-white' : 'text-purple-700 drop-shadow-sm'
                : isDarkMode
                  ? 'text-gray-100 group-hover:text-white'
                  : 'text-gray-900 group-hover:text-purple-600'
              }`}>
              {lead.name}
            </h3>
            <p className={`text-sm flex items-center gap-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="truncate">{lead.title}</span>
              <span className={isDarkMode ? 'text-purple-400/50' : 'text-purple-400/60'}>•</span>
              <span className={`truncate font-medium transition-colors ${isSelected
                  ? isDarkMode ? 'text-purple-300' : 'text-purple-600'
                  : isDarkMode
                    ? 'text-purple-400 group-hover:text-purple-300'
                    : 'text-gray-700 group-hover:text-purple-600'
                }`}>
                {lead.company}
              </span>
            </p>
          </div>
        </div>

        {/* Right: Email Quality Badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${emailBadge.bgColor} ${emailBadge.textColor} ${emailBadge.borderColor}`}>
            <EmailIcon className="w-3.5 h-3.5" />
            <span>{emailBadge.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}