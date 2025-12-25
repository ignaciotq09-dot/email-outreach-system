// SentEmails component - Main entry point

import { useState, useEffect } from 'react';
import {
    Mail,
    Search,
    Filter,
    Archive,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

import type { SentEmail, ArchivedPagination } from './types';
import { MOCK_EMAILS } from './data';
import { calculateStats, transformArchivedEmail, transformArchivedSms } from './helpers';
import { StatsCards } from './sections/StatsCards';
import { EmailRow } from './sections/EmailRow';

// Re-export types for backward compatibility
export type { SentEmail, StatusConfig, ArchivedPagination } from './types';

export function SentEmails() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [emails, setEmails] = useState(MOCK_EMAILS);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState<'emails' | 'sms' | 'archived'>('emails');

    // Archived content state
    const [archivedEmails, setArchivedEmails] = useState<SentEmail[]>([]);
    const [archivedSms, setArchivedSms] = useState<SentEmail[]>([]);
    const [archivedLoading, setArchivedLoading] = useState(false);
    const [archivedType, setArchivedType] = useState<'emails' | 'sms'>('emails');
    const [archivedPagination, setArchivedPagination] = useState<ArchivedPagination>({
        page: 0, pageSize: 50, totalCount: 0, totalPages: 0, hasMore: false
    });

    // Fetch archived content when archived tab is selected or type changes
    useEffect(() => {
        if (selectedTab === 'archived') {
            fetchArchivedContent(0);
        }
    }, [selectedTab, archivedType]);

    const fetchArchivedContent = async (page: number) => {
        setArchivedLoading(true);
        try {
            const endpoint = archivedType === 'emails' ? '/api/emails/archived' : '/api/sms/archived';
            const response = await fetch(`${endpoint}?page=${page}&pageSize=50`);
            if (response.ok) {
                const data = await response.json();
                const transform = archivedType === 'emails' ? transformArchivedEmail : transformArchivedSms;
                const transformed = (archivedType === 'emails' ? data.emails : data.sms).map(transform);
                archivedType === 'emails' ? setArchivedEmails(transformed) : setArchivedSms(transformed);
                setArchivedPagination(data.pagination);
            }
        } catch (error) {
            console.error('Error fetching archived content:', error);
        } finally {
            setArchivedLoading(false);
        }
    };

    // Detect dark mode
    useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
        checkDarkMode();
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const stats = calculateStats(emails);
    const currentEmails = selectedTab === 'archived'
        ? (archivedType === 'emails' ? archivedEmails : archivedSms)
        : emails;

    return (
        <div className={`h-full overflow-auto ${isDarkMode ? 'bg-[#0a0515]' : 'bg-slate-50'}`}>
            {/* Decorative Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {isDarkMode ? (
                    <>
                        <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full filter blur-[120px] animate-blob"></div>
                        <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full filter blur-[120px] animate-blob animation-delay-2000"></div>
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
                        <h1 className={`text-3xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sent Messages</h1>
                        <p className={`text-base mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Track your emails and SMS outreach</p>
                    </div>
                    <button className={`px-5 py-2.5 rounded-lg text-base transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${isDarkMode
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-300'
                        }`}>
                        <Mail className="w-5 h-5" />
                        <span>Send Auto Follow-up</span>
                    </button>
                </div>

                {/* Stats Cards */}
                <StatsCards stats={stats} isDarkMode={isDarkMode} />

                {/* Filters and Tabs */}
                <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white/80 backdrop-blur-xl border-purple-200/50'}`}>
                    <div className="flex items-center justify-between gap-3">
                        {/* Tabs */}
                        <div className="flex items-center gap-1.5">
                            {(['emails', 'sms', 'archived'] as const).map(tab => (
                                <button key={tab} onClick={() => setSelectedTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-base transition-all ${selectedTab === tab
                                        ? isDarkMode ? (tab === 'archived' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30')
                                            : (tab === 'archived' ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-purple-100 text-purple-700 border border-purple-300')
                                        : isDarkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        }`}>
                                    <div className="flex items-center gap-2">
                                        {tab === 'emails' ? <Mail className="w-4 h-4" /> : tab === 'archived' ? <Archive className="w-4 h-4" /> : null}
                                        <span>{tab === 'emails' ? `Emails (${stats.total})` : tab === 'sms' ? 'SMS (0)' : 'Archived'}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Search and Filter */}
                        <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                                <Search className="w-4 h-4 text-gray-400" />
                                <input type="text" placeholder="Search emails..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`bg-transparent outline-none text-base w-48 placeholder:text-gray-500 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`} />
                            </div>
                            <button onClick={() => alert('Filter options: Use tabs above!')}
                                className={`px-4 py-2 rounded-lg text-base transition-all flex items-center gap-2 border ${isDarkMode ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                                <Filter className="w-4 h-4" /><span>Filter</span>
                            </button>
                        </div>
                    </div>
                    <div className={`mt-3 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Follow-up sequence: 3 days → 7 days → 2 weeks</div>
                </div>

                {/* Email List */}
                <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white/80 backdrop-blur-xl border-purple-200/50'}`}>
                    {/* Table Header */}
                    <div className={`grid grid-cols-12 gap-4 px-5 py-3.5 border-b text-sm ${isDarkMode ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                        <div className="col-span-2">Recipient</div><div className="col-span-2">Company</div><div className="col-span-3">Email</div>
                        <div className="col-span-2">Date Sent</div><div className="col-span-2">Status</div><div className="col-span-1 text-right">Actions</div>
                    </div>

                    {/* Archived Type Toggle */}
                    {selectedTab === 'archived' && (
                        <div className={`flex items-center gap-2 px-5 py-3 border-b ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Show:</span>
                            {(['emails', 'sms'] as const).map(type => (
                                <button key={type} onClick={() => setArchivedType(type)}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${archivedType === type
                                        ? isDarkMode ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-700 border border-purple-300'
                                        : isDarkMode ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
                                        }`}>
                                    {type === 'emails' && <Mail className="w-4 h-4 inline mr-1" />}{type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Loading/Empty States */}
                    {selectedTab === 'archived' && archivedLoading && (
                        <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading archived {archivedType}...</div>
                    )}
                    {selectedTab === 'archived' && !archivedLoading && currentEmails.length === 0 && (
                        <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Archive className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No archived {archivedType} yet</p>
                        </div>
                    )}

                    {/* Email Rows */}
                    <div className="divide-y divide-white/5">
                        {currentEmails.map(email => <EmailRow key={email.id} email={email} isDarkMode={isDarkMode} />)}
                    </div>

                    {/* Pagination */}
                    {selectedTab === 'archived' && archivedPagination.totalPages > 1 && (
                        <div className={`flex items-center justify-between px-5 py-3 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Page {archivedPagination.page + 1} of {archivedPagination.totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => fetchArchivedContent(archivedPagination.page - 1)} disabled={archivedPagination.page === 0}
                                    className={`p-2 rounded-lg ${archivedPagination.page === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}><ChevronLeft className="w-5 h-5" /></button>
                                <button onClick={() => fetchArchivedContent(archivedPagination.page + 1)} disabled={!archivedPagination.hasMore}
                                    className={`p-2 rounded-lg ${!archivedPagination.hasMore ? 'opacity-50 cursor-not-allowed' : ''}`}><ChevronRight className="w-5 h-5" /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
