// Meetings component - Main entry point

import { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    CheckCircle2,
    Search,
    Filter,
    Link as LinkIcon,
    Copy,
    Edit,
    ExternalLink
} from 'lucide-react';

import type { Meeting, MeetingStats } from './types';
import { MOCK_MEETINGS } from './data';
import { calculateStats } from './helpers';
import { StatsCards } from './sections/StatsCards';
import { MeetingRow } from './sections/MeetingRow';

// Re-export types for backward compatibility
export type { Meeting, PlatformConfig, StatusConfig, MeetingStats } from './types';

export function Meetings() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [meetings, setMeetings] = useState(MOCK_MEETINGS);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState<'upcoming' | 'all' | 'completed'>('upcoming');
    const [bookingLink, setBookingLink] = useState('https://cal.outreach.ai/your-name');

    // Detect dark mode
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };

        checkDarkMode();

        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    const filteredMeetings = meetings.filter(meeting => {
        if (selectedTab === 'upcoming') return meeting.status === 'upcoming';
        if (selectedTab === 'completed') return meeting.status === 'completed';
        return true;
    });

    const stats = calculateStats(meetings);

    const copyBookingLink = () => {
        navigator.clipboard.writeText(bookingLink);
    };

    const handleCreateMeeting = () => {
        const title = prompt('Meeting title:');
        if (title) {
            const newMeeting: Meeting = {
                id: String(Date.now()),
                attendeeName: 'New Attendee',
                company: 'Company',
                email: '',
                title,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                time: '10:00 AM',
                duration: '30 min',
                platform: 'zoom',
                status: 'upcoming',
                meetingLink: 'https://zoom.us/j/' + Date.now()
            };
            setMeetings(prev => [newMeeting, ...prev]);
        }
    };

    const handleCancelMeeting = (id: string) => {
        setMeetings(prev => prev.map(m => m.id === id ? { ...m, status: 'cancelled' } : m));
    };

    return (
        <div className={`h-full overflow-auto ${isDarkMode ? 'bg-[#0a0515]' : 'bg-slate-50'}`}>
            {/* Decorative Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {isDarkMode ? (
                    <>
                        <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full filter blur-[120px] animate-blob"></div>
                        <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full filter blur-[120px] animate-blob animation-delay-2000"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full filter blur-[140px]"></div>
                    </>
                ) : (
                    <>
                        <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-purple-300/20 rounded-full filter blur-[100px] animate-blob"></div>
                        <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-blue-300/20 rounded-full filter blur-[100px] animate-blob animation-delay-2000"></div>
                    </>
                )}
            </div>

            <div className="max-w-7xl mx-auto p-4 space-y-4 relative z-10">

                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className={`text-3xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Meetings
                        </h1>
                        <p className={`text-base mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Manage your scheduled meetings and booking link
                        </p>
                    </div>

                    {/* Create Meeting Button */}
                    <button
                        onClick={handleCreateMeeting}
                        className={`px-5 py-2.5 rounded-lg text-base transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${isDarkMode
                            ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30 hover:border-purple-500/50'
                            : 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-300 hover:border-purple-400'
                            }`}>
                        <Calendar className="w-5 h-5" />
                        <span>Schedule Meeting</span>
                    </button>
                </div>

                {/* Booking Link Card */}
                <div className={`rounded-xl p-4 border ${isDarkMode
                    ? 'bg-white/5 backdrop-blur-xl border-white/10'
                    : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
                    }`}>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-purple-500/10' : 'bg-purple-100'}`}>
                                <LinkIcon className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Your Booking Link
                                </p>
                                <div className={`flex items-center gap-2 mt-1`}>
                                    <input
                                        type="text"
                                        value={bookingLink}
                                        onChange={(e) => setBookingLink(e.target.value)}
                                        className={`text-base flex-1 bg-transparent outline-none ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={copyBookingLink}
                                className={`px-4 py-2 rounded-lg text-base transition-all flex items-center gap-2 border ${isDarkMode
                                    ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}>
                                <Copy className="w-4 h-4" />
                                <span>Copy</span>
                            </button>

                            <button className={`px-4 py-2 rounded-lg text-base transition-all flex items-center gap-2 border ${isDarkMode
                                ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}>
                                <Edit className="w-4 h-4" />
                                <span>Edit</span>
                            </button>

                            <button
                                onClick={() => window.open(bookingLink, '_blank')}
                                className={`p-2 rounded-lg transition-all border ${isDarkMode
                                    ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}>
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <StatsCards stats={stats} isDarkMode={isDarkMode} />

                {/* Filters and Tabs */}
                <div className={`rounded-xl p-4 border ${isDarkMode
                    ? 'bg-white/5 backdrop-blur-xl border-white/10'
                    : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
                    }`}>
                    <div className="flex items-center justify-between gap-3">
                        {/* Left - Tabs */}
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setSelectedTab('upcoming')}
                                className={`px-4 py-2 rounded-lg text-base transition-all ${selectedTab === 'upcoming'
                                    ? isDarkMode
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                        : 'bg-purple-100 text-purple-700 border border-purple-300'
                                    : isDarkMode
                                        ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Upcoming ({stats.upcoming})</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setSelectedTab('all')}
                                className={`px-4 py-2 rounded-lg text-base transition-all ${selectedTab === 'all'
                                    ? isDarkMode
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                        : 'bg-purple-100 text-purple-700 border border-purple-300'
                                    : isDarkMode
                                        ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                <span>All ({stats.total})</span>
                            </button>

                            <button
                                onClick={() => setSelectedTab('completed')}
                                className={`px-4 py-2 rounded-lg text-base transition-all ${selectedTab === 'completed'
                                    ? isDarkMode
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                        : 'bg-purple-100 text-purple-700 border border-purple-300'
                                    : isDarkMode
                                        ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Completed ({stats.completed})</span>
                                </div>
                            </button>
                        </div>

                        {/* Right - Search and Filters */}
                        <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isDarkMode
                                ? 'bg-white/5 border-white/10 text-gray-300'
                                : 'bg-white border-gray-200 text-gray-700'
                                }`}>
                                <Search className="w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search meetings..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`bg-transparent outline-none text-base w-48 placeholder:text-gray-500 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}
                                />
                            </div>

                            <button
                                onClick={() => alert('Filter by platform:\n\n• Zoom\n• Google Meet\n• Teams\n• Phone\n• In Person\n\nUse the tabs above to filter by status!')}
                                className={`px-4 py-2 rounded-lg text-base transition-all flex items-center gap-2 border ${isDarkMode
                                    ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}>
                                <Filter className="w-4 h-4" />
                                <span>Filter</span>
                            </button>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className={`mt-3 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                        Showing {filteredMeetings.length} of {stats.total} meetings
                    </div>
                </div>

                {/* Meetings List */}
                <div className={`rounded-xl border overflow-hidden ${isDarkMode
                    ? 'bg-white/5 backdrop-blur-xl border-white/10'
                    : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
                    }`}>
                    <div className="divide-y divide-white/5">
                        {filteredMeetings.map((meeting) => (
                            <MeetingRow
                                key={meeting.id}
                                meeting={meeting}
                                isDarkMode={isDarkMode}
                                onCancel={handleCancelMeeting}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
