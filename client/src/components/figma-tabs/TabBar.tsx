import {
  Send,
  Users,
  Mail,
  Inbox,
  Calendar,
  BarChart3,
  Sparkles,
  Settings
} from 'lucide-react';

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'compose', label: 'Compose', icon: Send, group: 'outreach' },
  { id: 'find-contacts', label: 'Find Contacts', icon: Users, group: 'outreach' },
  { id: 'sent-emails', label: 'Sent', icon: Mail, group: 'monitoring' },
  { id: 'inbox', label: 'Inbox', icon: Inbox, group: 'monitoring' },
  { id: 'meetings', label: 'Meetings', icon: Calendar, group: 'engagement' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, group: 'insights' },
  { id: 'personalize', label: 'Personalize', icon: Sparkles, group: 'settings' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'settings' },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="relative h-12 bg-white/60 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-purple-200/50 dark:border-purple-500/30 shadow-sm dark:shadow-purple-500/10">
      {/* Gradient line at bottom - VIBRANT in dark mode */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 dark:via-purple-400/80 to-transparent"></div>

      <div className="flex items-center h-full px-6 gap-1 relative dark:bg-white/[0.05] dark:backdrop-blur-xl dark:border-b dark:border-purple-500/30 dark:shadow-lg dark:shadow-purple-500/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 h-full transition-all group
                ${isActive
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              <div className={`
                p-1 rounded-lg transition-all
                ${isActive
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-500 dark:from-purple-500 dark:to-cyan-500 text-white shadow-lg shadow-purple-500/30 dark:shadow-purple-500/60'
                  : 'bg-transparent group-hover:bg-purple-50 dark:group-hover:bg-purple-500/20'
                }
              `}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-medium whitespace-nowrap">{tab.label}</span>
              {isActive && (
                <>
                  <div className="absolute bottom-0 left-2 right-2 h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 dark:from-purple-500 dark:via-pink-500 dark:to-cyan-500 rounded-full shadow-lg dark:shadow-purple-500/80 animate-gradient" />
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 to-transparent dark:from-purple-500/20 dark:to-transparent rounded-t-lg -z-10"></div>
                  {/* Neon glow in dark mode */}
                  <div className="hidden dark:block absolute bottom-0 left-2 right-2 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full blur-md opacity-60"></div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}