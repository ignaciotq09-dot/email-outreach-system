// Analytics Component - Main Entry Point
import { useState, useEffect } from 'react';
import { MOCK_CAMPAIGNS, DEFAULT_STATS } from './data';
import { AnalyticsHeader, TrackingNotice, StatsCards, PerformanceTrendsChart, DeliverabilityHealth, EngagementTrendsChart, BestSendTimesHeatmap } from './sections';
import { CampaignLeaderboard, MostEngagedContacts } from './leaderboard';

export function Analytics() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<'all' | 'email' | 'sms'>('all');
    const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'draft' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
        checkDarkMode();
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const stats = DEFAULT_STATS;
    const filteredCampaigns = MOCK_CAMPAIGNS.filter(campaign => {
        if (selectedTab !== 'all' && campaign.status !== selectedTab) return false;
        if (searchQuery && !campaign.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <div className={`h-full overflow-auto ${isDarkMode ? 'bg-[#0a0515]' : 'bg-slate-50'}`}>
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {isDarkMode ? (
                    <>
                        <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full filter blur-[120px] animate-blob" />
                        <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full filter blur-[120px] animate-blob animation-delay-2000" />
                    </>
                ) : (
                    <>
                        <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-purple-300/20 rounded-full filter blur-[100px] animate-blob" />
                        <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-blue-300/20 rounded-full filter blur-[100px] animate-blob animation-delay-2000" />
                    </>
                )}
            </div>

            <div className="max-w-7xl mx-auto p-4 space-y-4 relative z-10">
                <AnalyticsHeader isDarkMode={isDarkMode} selectedChannel={selectedChannel} setSelectedChannel={setSelectedChannel} />
                <TrackingNotice isDarkMode={isDarkMode} />
                <StatsCards isDarkMode={isDarkMode} stats={stats} />
                <PerformanceTrendsChart isDarkMode={isDarkMode} />
                <div className="grid grid-cols-2 gap-3">
                    <DeliverabilityHealth isDarkMode={isDarkMode} stats={stats} />
                    <EngagementTrendsChart isDarkMode={isDarkMode} />
                </div>
                <BestSendTimesHeatmap isDarkMode={isDarkMode} />
                <CampaignLeaderboard isDarkMode={isDarkMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedTab={selectedTab} setSelectedTab={setSelectedTab} filteredCampaigns={filteredCampaigns} />
                <MostEngagedContacts isDarkMode={isDarkMode} />
            </div>
        </div>
    );
}

export * from './types';
export * from './data';
