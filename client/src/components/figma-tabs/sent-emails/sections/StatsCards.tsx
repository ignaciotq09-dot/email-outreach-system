// Stats Cards Component for Sent Emails

import { Mail, MailOpen, Reply, TrendingUp } from 'lucide-react';

interface SentEmailsStats {
    total: number;
    opened: number;
    replied: number;
}

interface StatsCardsProps {
    stats: SentEmailsStats;
    isDarkMode: boolean;
}

export function StatsCards({ stats, isDarkMode }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-4 gap-3">
            {/* Total Sent */}
            <div className={`relative overflow-hidden rounded-xl p-4 border transition-all ${isDarkMode
                ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-purple-500/30'
                : 'bg-white/80 backdrop-blur-xl border-purple-200/50 hover:border-purple-300'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Total Sent
                        </p>
                        <p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {stats.total}
                        </p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-purple-500/10' : 'bg-purple-100'}`}>
                        <Mail className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                </div>
            </div>

            {/* Opened */}
            <div className={`relative overflow-hidden rounded-xl p-4 border transition-all ${isDarkMode
                ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-blue-500/30'
                : 'bg-white/80 backdrop-blur-xl border-blue-200/50 hover:border-blue-300'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Opened
                        </p>
                        <p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {stats.opened}
                        </p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
                        <MailOpen className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                </div>
            </div>

            {/* Replied */}
            <div className={`relative overflow-hidden rounded-xl p-4 border transition-all ${isDarkMode
                ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-green-500/30'
                : 'bg-white/80 backdrop-blur-xl border-green-200/50 hover:border-green-300'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Replied
                        </p>
                        <p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {stats.replied}
                        </p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-green-500/10' : 'bg-green-100'}`}>
                        <Reply className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    </div>
                </div>
            </div>

            {/* Response Rate */}
            <div className={`relative overflow-hidden rounded-xl p-4 border transition-all ${isDarkMode
                ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-indigo-500/30'
                : 'bg-white/80 backdrop-blur-xl border-indigo-200/50 hover:border-indigo-300'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Response Rate
                        </p>
                        <p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            0%
                        </p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-100'}`}>
                        <TrendingUp className={`w-6 h-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    </div>
                </div>
            </div>
        </div>
    );
}
