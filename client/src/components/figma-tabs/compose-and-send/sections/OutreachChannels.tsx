// Outreach Channels Section Component

import { Sparkles, CheckCircle2 } from 'lucide-react';
import type { Channel } from '../types';

interface OutreachChannelsSectionProps {
    channels: Channel[];
    onToggleChannel: (channelId: string) => void;
    isDarkMode: boolean;
}

export function OutreachChannelsSection({ channels, onToggleChannel, isDarkMode }: OutreachChannelsSectionProps) {
    return (
        <div className={`relative rounded-xl overflow-hidden ${isDarkMode
            ? 'bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-purple-900/40 border border-purple-500/20'
            : 'bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 border border-purple-200/50'
            } backdrop-blur-xl shadow-xl ${isDarkMode ? 'shadow-purple-500/10' : 'shadow-purple-500/5'}`}>

            {/* Decorative gradient overlay */}
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none ${isDarkMode ? 'bg-purple-600/10' : 'bg-purple-300/20'
                }`} />

            <div className="relative p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className={`p-2 rounded-lg ${isDarkMode
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-500'
                        : 'bg-gradient-to-br from-purple-600 to-indigo-600'
                        } shadow-lg shadow-purple-500/30`}>
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h2
                        className="font-semibold text-base"
                        style={{ color: isDarkMode ? '#e9d5ff' : '#1f2937' }}
                    >
                        Outreach Channels
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {channels.map((channel) => {
                        const Icon = channel.icon;
                        return (
                            <button
                                key={channel.id}
                                onClick={() => onToggleChannel(channel.id)}
                                className={`relative group rounded-xl p-5 transition-all duration-300 ${channel.enabled
                                    ? isDarkMode
                                        ? 'bg-gradient-to-br from-purple-600/30 to-indigo-600/20 border-2 border-purple-400/50 shadow-lg shadow-purple-500/20'
                                        : 'bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-purple-400 shadow-lg shadow-purple-500/10'
                                    : isDarkMode
                                        ? 'bg-gray-900/40 border-2 border-gray-700/50 hover:border-purple-500/30'
                                        : 'bg-white border-2 border-gray-200 hover:border-purple-300'
                                    }`}
                            >
                                {/* Glow effect when enabled */}
                                {channel.enabled && (
                                    <div className={`absolute -inset-1 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity ${isDarkMode ? 'bg-purple-500' : 'bg-purple-400'
                                        }`} />
                                )}

                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-lg ${channel.enabled
                                            ? isDarkMode
                                                ? 'bg-purple-500/30'
                                                : 'bg-purple-500/20'
                                            : isDarkMode
                                                ? 'bg-gray-800/50'
                                                : 'bg-gray-100'
                                            }`}>
                                            <Icon
                                                className={`w-5 h-5 ${channel.enabled
                                                    ? isDarkMode ? 'text-purple-300' : 'text-purple-600'
                                                    : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                                    }`}
                                            />
                                        </div>
                                        <span
                                            className="font-medium text-sm"
                                            style={{
                                                color: channel.enabled
                                                    ? isDarkMode ? '#e9d5ff' : '#1f2937'
                                                    : isDarkMode ? '#6b7280' : '#9ca3af'
                                            }}
                                        >
                                            {channel.name}
                                        </span>
                                    </div>

                                    {/* Toggle indicator */}
                                    <div className={`relative w-11 h-6 rounded-full transition-colors ${channel.enabled
                                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                                        : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                                        }`}>
                                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${channel.enabled ? 'translate-x-5' : 'translate-x-0'
                                            }`} />
                                    </div>
                                </div>

                                {channel.enabled && (
                                    <div className="absolute top-2 right-2">
                                        <CheckCircle2 className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-500'
                                            }`} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
