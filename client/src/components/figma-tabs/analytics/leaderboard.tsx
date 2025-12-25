// Analytics Component - Leaderboard and Contacts Sections
import { Award, Download, Search, Users } from 'lucide-react';
import type { Campaign, Contact } from './types';
import { MOCK_CONTACTS } from './data';

interface LeaderboardProps {
    isDarkMode: boolean;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    selectedTab: 'all' | 'active' | 'draft' | 'completed';
    setSelectedTab: (t: 'all' | 'active' | 'draft' | 'completed') => void;
    filteredCampaigns: Campaign[];
}

export function CampaignLeaderboard({ isDarkMode, searchQuery, setSearchQuery, selectedTab, setSelectedTab, filteredCampaigns }: LeaderboardProps) {
    const cardClass = `rounded-xl p-5 border ${isDarkMode ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white/80 backdrop-blur-xl border-purple-200/50'}`;
    const tabClass = (active: boolean) => `px-3 py-1.5 rounded-lg text-sm transition-all ${active ? (isDarkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700') : (isDarkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')}`;

    return (
        <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Award className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <div><h2 className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Campaign Leaderboard</h2><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>All campaigns ranked by performance</p></div>
                </div>
                <div className="flex items-center gap-2">
                    <button className={`px-4 py-2 rounded-lg text-base flex items-center gap-2 border ${isDarkMode ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}><Download className="w-4 h-4" /><span>Export</span></button>
                </div>
            </div>
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border flex-1 max-w-md ${isDarkMode ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                    <Search className="w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search campaigns..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`bg-transparent outline-none text-base flex-1 placeholder:text-gray-500 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`} />
                </div>
                <div className="flex items-center gap-2">
                    {(['all', 'active', 'draft', 'completed'] as const).map(tab => (
                        <button key={tab} onClick={() => setSelectedTab(tab)} className={tabClass(selectedTab === tab)}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
                    ))}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead><tr className={`border-b text-sm ${isDarkMode ? 'border-white/10 text-gray-400' : 'border-gray-200 text-gray-600'}`}><th className="text-left py-3 px-4">Campaign</th><th className="text-center py-3 px-4">Sent</th><th className="text-center py-3 px-4">Open Rate</th><th className="text-center py-3 px-4">Reply Rate</th></tr></thead>
                    <tbody>
                        {filteredCampaigns.map((campaign, idx) => (
                            <tr key={campaign.id} className={`border-b transition-all ${isDarkMode ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-purple-50/50'}`}>
                                <td className="py-3 px-4"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${isDarkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>{idx + 1}</div><div><p className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{campaign.name}</p><p className="text-sm text-gray-500">{campaign.date}</p></div></div></td>
                                <td className={`py-3 px-4 text-center text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{campaign.sent}</td>
                                <td className={`py-3 px-4 text-center text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{campaign.openRate}%</td>
                                <td className={`py-3 px-4 text-center text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{campaign.replyRate}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function MostEngagedContacts({ isDarkMode }: { isDarkMode: boolean }) {
    const cardClass = `rounded-xl p-5 border ${isDarkMode ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white/80 backdrop-blur-xl border-purple-200/50'}`;
    return (
        <div className={cardClass}>
            <div className="flex items-center gap-3 mb-4">
                <Users className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <div><h2 className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Most Engaged Contacts</h2><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Contacts ranked by engagement score</p></div>
            </div>
            <div className="space-y-3">
                {MOCK_CONTACTS.map((contact, idx) => (
                    <div key={contact.id} className={`flex items-center justify-between p-3 rounded-lg transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${idx === 0 ? (isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700') : (isDarkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-700')}`}>{idx + 1}</div>
                            <div><p className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{contact.name}</p><p className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{contact.email} • {contact.company}</p></div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right"><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{contact.opens} opens</p></div>
                            <div className="text-right"><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{contact.replies} replies</p></div>
                            <div className={`px-3 py-1.5 rounded-lg text-base ${isDarkMode ? 'bg-purple-500/10 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>{contact.score} score</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
