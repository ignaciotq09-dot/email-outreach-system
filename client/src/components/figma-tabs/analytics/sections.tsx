// Analytics Component - Sections Part 1 (Header, Stats, Charts)
import { useState, useEffect } from 'react';
import { TrendingUp, Mail, MailOpen, Reply, Target, AlertCircle, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { AnalyticsStats } from './types';
import { PERFORMANCE_DATA, ENGAGEMENT_DATA, BEST_TIMES, DEFAULT_STATS } from './data';

interface SectionProps { isDarkMode: boolean; stats: AnalyticsStats; }

export function AnalyticsHeader({ isDarkMode, selectedChannel, setSelectedChannel }: { isDarkMode: boolean; selectedChannel: string; setSelectedChannel: (c: 'all' | 'email' | 'sms') => void; }) {
    const btnClass = (active: boolean) => `px-4 py-2 rounded-lg text-base transition-all flex items-center gap-2 border ${active ? (isDarkMode ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-300') : (isDarkMode ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50')}`;
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className={`text-3xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Analytics Dashboard</h1>
                <p className={`text-base mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Track email performance and engagement metrics</p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setSelectedChannel('email')} className={btnClass(selectedChannel === 'email')}><Mail className="w-4 h-4" /><span>Email</span></button>
                <button onClick={() => setSelectedChannel('sms')} className={btnClass(selectedChannel === 'sms')}><MessageSquare className="w-4 h-4" /><span>SMS</span></button>
                <button onClick={() => setSelectedChannel('all')} className={btnClass(selectedChannel === 'all')}><span>All</span></button>
            </div>
        </div>
    );
}

export function TrackingNotice({ isDarkMode }: { isDarkMode: boolean }) {
    return (
        <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-amber-500/5 backdrop-blur-xl border-amber-500/20' : 'bg-amber-50/80 backdrop-blur-xl border-amber-200/50'}`}>
            <div className="flex items-start gap-3">
                <AlertCircle className={`w-5 h-5 mt-0.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                <div>
                    <p className={`text-base ${isDarkMode ? 'text-amber-300' : 'text-amber-900'}`}>Tracking Data Notice</p>
                    <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-amber-400/80' : 'text-amber-700'}`}>5 of 472 emails have tracking enabled (0.0% coverage).</p>
                </div>
            </div>
        </div>
    );
}

export function StatsCards({ isDarkMode, stats }: SectionProps) {
    const cardClass = (color: string) => `relative overflow-hidden rounded-xl p-4 border transition-all ${isDarkMode ? `bg-white/5 backdrop-blur-xl border-white/10 hover:border-${color}-500/30` : `bg-white/80 backdrop-blur-xl border-${color}-200/50 hover:border-${color}-300`}`;
    const iconBg = (color: string) => isDarkMode ? `bg-${color}-500/10` : `bg-${color}-100`;
    const iconColor = (color: string) => isDarkMode ? `text-${color}-400` : `text-${color}-600`;
    return (
        <div className="grid grid-cols-4 gap-3">
            <div className={cardClass('purple')}><div className="flex items-center justify-between"><div><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Sent</p><p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalSent}</p><p className="text-sm mt-0.5 text-gray-500">Emails delivered</p></div><div className={`p-2.5 rounded-lg ${iconBg('purple')}`}><Mail className={`w-6 h-6 ${iconColor('purple')}`} /></div></div></div>
            <div className={cardClass('blue')}><div className="flex items-center justify-between"><div><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Open Rate</p><p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.openRate}%</p><p className="text-sm mt-0.5 text-gray-500">0 email opens</p></div><div className={`p-2.5 rounded-lg ${iconBg('blue')}`}><MailOpen className={`w-6 h-6 ${iconColor('blue')}`} /></div></div></div>
            <div className={cardClass('green')}><div className="flex items-center justify-between"><div><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reply Rate</p><p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.replyRate}%</p><p className="text-sm mt-0.5 text-gray-500">0 conversations</p></div><div className={`p-2.5 rounded-lg ${iconBg('green')}`}><Reply className={`w-6 h-6 ${iconColor('green')}`} /></div></div></div>
            <div className={cardClass('indigo')}><div className="flex items-center justify-between"><div><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Click Rate</p><p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.clickRate}%</p><p className="text-sm mt-0.5 text-gray-500">0 link clicks</p></div><div className={`p-2.5 rounded-lg ${iconBg('indigo')}`}><Target className={`w-6 h-6 ${iconColor('indigo')}`} /></div></div></div>
        </div>
    );
}

export function PerformanceTrendsChart({ isDarkMode }: { isDarkMode: boolean }) {
    const cardClass = `rounded-xl p-5 border ${isDarkMode ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white/80 backdrop-blur-xl border-purple-200/50'}`;
    return (
        <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <TrendingUp className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <div><h2 className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Performance Trends</h2><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Compare your metrics vs the previous period</p></div>
                </div>
                <div className="flex items-center gap-2">
                    <button className={`px-3 py-1.5 rounded-lg text-sm border ${isDarkMode ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-300'}`}>7 Days</button>
                    <button className={`px-3 py-1.5 rounded-lg text-sm border ${isDarkMode ? 'bg-white/5 text-gray-400 border-white/10' : 'bg-white text-gray-700 border-gray-200'}`}>30 Days</button>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={PERFORMANCE_DATA}>
                    <defs>
                        <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} /><stop offset="95%" stopColor="#7C3AED" stopOpacity={0} /></linearGradient>
                        <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3B82F6" stopOpacity={0} /></linearGradient>
                        <linearGradient id="colorReplied" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#ffffff10' : '#00000010'} />
                    <XAxis dataKey="date" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} style={{ fontSize: '12px' }} />
                    <YAxis stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} style={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1a0f2e' : '#ffffff', border: `1px solid ${isDarkMode ? '#ffffff20' : '#e5e7eb'}`, borderRadius: '8px', color: isDarkMode ? '#ffffff' : '#111827' }} />
                    <Legend />
                    <Area type="monotone" dataKey="sent" stroke="#7C3AED" fillOpacity={1} fill="url(#colorSent)" name="Sent" strokeWidth={2} />
                    <Area type="monotone" dataKey="opened" stroke="#3B82F6" fillOpacity={1} fill="url(#colorOpened)" name="Opened" strokeWidth={2} />
                    <Area type="monotone" dataKey="replied" stroke="#10B981" fillOpacity={1} fill="url(#colorReplied)" name="Replied" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export function DeliverabilityHealth({ isDarkMode, stats }: SectionProps) {
    const cardClass = `rounded-xl p-5 border ${isDarkMode ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white/80 backdrop-blur-xl border-purple-200/50'}`;
    const metricBg = isDarkMode ? 'bg-white/5' : 'bg-gray-50';
    return (
        <div className={cardClass}>
            <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                <div><h2 className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Deliverability Health</h2><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Track your email delivery success</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg ${metricBg}`}><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Delivery Rate</p><p className={`text-2xl mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.deliveryRate}%</p><p className="text-xs mt-0.5 text-gray-500">Excellent</p></div>
                <div className={`p-3 rounded-lg ${metricBg}`}><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Bounce Rate</p><p className={`text-2xl mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.bounceRate}%</p><p className="text-xs mt-0.5 text-gray-500">0 email</p></div>
                <div className={`p-3 rounded-lg ${metricBg}`}><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Spam Score</p><p className={`text-2xl mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.spamScore}/10</p><p className="text-xs mt-0.5 text-gray-500">No spam data</p></div>
                <div className={`p-3 rounded-lg ${metricBg}`}><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email Sent</p><p className={`text-2xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalSent}</p><p className="text-xs mt-0.5 text-gray-500">Total tracked</p></div>
            </div>
        </div>
    );
}

export function EngagementTrendsChart({ isDarkMode }: { isDarkMode: boolean }) {
    const cardClass = `rounded-xl p-5 border ${isDarkMode ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white/80 backdrop-blur-xl border-purple-200/50'}`;
    return (
        <div className={cardClass}>
            <div className="flex items-center gap-3 mb-4">
                <TrendingUp className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <div><h2 className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Email Engagement (Last 30 Days)</h2><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Track opens and replies over time</p></div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
                <LineChart data={ENGAGEMENT_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#ffffff10' : '#00000010'} />
                    <XAxis dataKey="date" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} style={{ fontSize: '11px' }} />
                    <YAxis stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} style={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1a0f2e' : '#ffffff', border: `1px solid ${isDarkMode ? '#ffffff20' : '#e5e7eb'}`, borderRadius: '8px', color: isDarkMode ? '#ffffff' : '#111827', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="opens" stroke="#3B82F6" strokeWidth={2} name="Opens" dot={{ fill: '#3B82F6', r: 3 }} />
                    <Line type="monotone" dataKey="clicks" stroke="#7C3AED" strokeWidth={2} name="Clicks" dot={{ fill: '#7C3AED', r: 3 }} />
                    <Line type="monotone" dataKey="replies" stroke="#10B981" strokeWidth={2} name="Replies" dot={{ fill: '#10B981', r: 3 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export function BestSendTimesHeatmap({ isDarkMode }: { isDarkMode: boolean }) {
    const cardClass = `rounded-xl p-5 border ${isDarkMode ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white/80 backdrop-blur-xl border-purple-200/50'}`;
    return (
        <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Clock className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <div><h2 className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Best Send Times</h2><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Engagement by hour and day</p></div>
                </div>
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-1 ml-12">{Array.from({ length: 24 }, (_, i) => (<div key={i} className={`flex-1 text-center text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>{i === 0 ? '12am' : i === 6 ? '6am' : i === 12 ? '12pm' : i === 18 ? '6pm' : ''}</div>))}</div>
                {BEST_TIMES.map((row) => (
                    <div key={row.day} className="flex items-center gap-1">
                        <div className={`w-10 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{row.day}</div>
                        <div className="flex gap-1 flex-1">{row.hours.map((value, idx) => (<div key={idx} className={`flex-1 h-8 rounded ${value === 0 ? (isDarkMode ? 'bg-white/5' : 'bg-gray-100') : value >= 8 ? (isDarkMode ? 'bg-green-500/40' : 'bg-green-300') : (isDarkMode ? 'bg-green-500/20' : 'bg-green-200')}`} />))}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
