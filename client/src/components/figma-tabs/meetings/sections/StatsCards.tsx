// Stats Cards Component for Meetings

import { Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { MeetingStats } from '../types';

interface StatsCardsProps {
    stats: MeetingStats;
    isDarkMode: boolean;
}

export function StatsCards({ stats, isDarkMode }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-4 gap-3">
            {/* Total Meetings */}
            <div className={`relative overflow-hidden rounded-xl p-4 border transition-all ${isDarkMode
                ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-purple-500/30'
                : 'bg-white/80 backdrop-blur-xl border-purple-200/50 hover:border-purple-300'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Total Meetings
                        </p>
                        <p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {stats.total}
                        </p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-purple-500/10' : 'bg-purple-100'}`}>
                        <Calendar className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                </div>
            </div>

            {/* Upcoming */}
            <div className={`relative overflow-hidden rounded-xl p-4 border transition-all ${isDarkMode
                ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-blue-500/30'
                : 'bg-white/80 backdrop-blur-xl border-blue-200/50 hover:border-blue-300'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Upcoming
                        </p>
                        <p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {stats.upcoming}
                        </p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
                        <Clock className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                </div>
            </div>

            {/* Completed */}
            <div className={`relative overflow-hidden rounded-xl p-4 border transition-all ${isDarkMode
                ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-green-500/30'
                : 'bg-white/80 backdrop-blur-xl border-green-200/50 hover:border-green-300'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Completed
                        </p>
                        <p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {stats.completed}
                        </p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-green-500/10' : 'bg-green-100'}`}>
                        <CheckCircle2 className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    </div>
                </div>
            </div>

            {/* Cancelled */}
            <div className={`relative overflow-hidden rounded-xl p-4 border transition-all ${isDarkMode
                ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-red-500/30'
                : 'bg-white/80 backdrop-blur-xl border-red-200/50 hover:border-red-300'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Cancelled
                        </p>
                        <p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {stats.cancelled}
                        </p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-red-500/10' : 'bg-red-100'}`}>
                        <XCircle className={`w-6 h-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                    </div>
                </div>
            </div>
        </div>
    );
}
