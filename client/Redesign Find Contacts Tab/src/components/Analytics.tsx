import { useState, useEffect } from 'react';
import { 
  TrendingUp,
  Mail,
  MailOpen,
  Reply,
  Target,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Users,
  Award,
  Download,
  Search,
  Filter,
  MessageSquare,
  Linkedin,
  Phone
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface Campaign {
  id: string;
  name: string;
  date: string;
  sent: number;
  openRate: number;
  replyRate: number;
  status: 'active' | 'draft' | 'completed';
}

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  score: number;
  opens: number;
  replies: number;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Exploring Ideas Together: Meeting Proposal', date: 'Dec 3, 2025', sent: 0, openRate: 0, replyRate: 0, status: 'draft' },
  { id: '2', name: 'Follow Up: Let\'s Connect This Tuesday', date: 'Nov 4, 2025', sent: 0, openRate: 0, replyRate: 0, status: 'draft' },
  { id: '3', name: 'Enhance Your Website and Drive Revenue Growth', date: 'Nov 1, 2025', sent: 0, openRate: 0, replyRate: 0, status: 'draft' },
  { id: '4', name: 'Boost Your Property Listings and Profits', date: 'Nov 1, 2025', sent: 0, openRate: 0, replyRate: 0, status: 'draft' },
  { id: '5', name: 'Quick follow-up on your request', date: 'Nov 1, 2025', sent: 0, openRate: 0, replyRate: 0, status: 'draft' },
];

const MOCK_CONTACTS: Contact[] = [
  { id: '1', name: 'Test Contact 5d85', email: 'wdgn3@exampleprovider.com', company: 'Test Company Inc', score: 0, opens: 0, replies: 0 },
  { id: '2', name: 'Test Contact f8c6', email: 'test762@exampleprovider.com', company: 'Test Company Inc', score: 0, opens: 0, replies: 0 },
  { id: '3', name: 'Debug Contact #0C', email: 'debug0C@test.com', company: 'Debug Corp', score: 0, opens: 0, replies: 0 },
  { id: '4', name: 'Alice Johnson', email: 'alice.j@testcorp.com', company: 'TechCorp Solutions', score: 0, opens: 0, replies: 0 },
  { id: '5', name: 'Bob Smith', email: 'bob.s@example.com', company: 'Innovation Labs', score: 0, opens: 0, replies: 0 },
];

const PERFORMANCE_DATA = [
  { date: 'Dec 10', sent: 45, opened: 18, replied: 3 },
  { date: 'Dec 11', sent: 52, opened: 22, replied: 5 },
  { date: 'Dec 12', sent: 38, opened: 15, replied: 2 },
  { date: 'Dec 13', sent: 61, opened: 28, replied: 7 },
  { date: 'Dec 14', sent: 48, opened: 20, replied: 4 },
  { date: 'Dec 15', sent: 55, opened: 25, replied: 6 },
  { date: 'Dec 16', sent: 42, opened: 19, replied: 3 },
];

const ENGAGEMENT_DATA = [
  { date: 'Nov 17', opens: 32, clicks: 18, replies: 8 },
  { date: 'Nov 24', opens: 28, clicks: 15, replies: 6 },
  { date: 'Dec 1', opens: 35, clicks: 20, replies: 9 },
  { date: 'Dec 8', opens: 40, clicks: 24, replies: 11 },
  { date: 'Dec 15', opens: 38, clicks: 22, replies: 10 },
];

const BEST_TIMES = [
  { day: 'Sun', hours: Array(24).fill(0) },
  { day: 'Mon', hours: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { day: 'Tue', hours: [0, 0, 0, 0, 0, 8, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0] },
  { day: 'Wed', hours: Array(24).fill(0) },
  { day: 'Thu', hours: Array(24).fill(0) },
  { day: 'Fri', hours: Array(24).fill(0) },
  { day: 'Sat', hours: Array(24).fill(0) },
];

export function Analytics() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'email' | 'sms' | 'linkedin'>('all');
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'draft' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const stats = {
    totalSent: 472,
    openRate: 0.0,
    replyRate: 0.0,
    clickRate: 0.0,
    deliveryRate: 100.0,
    bounceRate: 0.0,
    spamScore: 0.0,
  };

  const filteredCampaigns = MOCK_CAMPAIGNS.filter(campaign => {
    if (selectedTab !== 'all' && campaign.status !== selectedTab) return false;
    if (searchQuery && !campaign.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

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
              Analytics Dashboard
            </h1>
            <p className={`text-base mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Track email performance and engagement metrics
            </p>
          </div>

          {/* Channel Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedChannel('email')}
              className={`px-4 py-2 rounded-lg text-base transition-all flex items-center gap-2 border ${
                selectedChannel === 'email'
                  ? isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-purple-100 text-purple-700 border-purple-300'
                  : isDarkMode
                    ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}>
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </button>

            <button
              onClick={() => setSelectedChannel('sms')}
              className={`px-4 py-2 rounded-lg text-base transition-all flex items-center gap-2 border ${
                selectedChannel === 'sms'
                  ? isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-purple-100 text-purple-700 border-purple-300'
                  : isDarkMode
                    ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}>
              <MessageSquare className="w-4 h-4" />
              <span>SMS</span>
            </button>

            <button
              onClick={() => setSelectedChannel('linkedin')}
              className={`px-4 py-2 rounded-lg text-base transition-all flex items-center gap-2 border ${
                selectedChannel === 'linkedin'
                  ? isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-purple-100 text-purple-700 border-purple-300'
                  : isDarkMode
                    ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}>
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn</span>
            </button>

            <button
              onClick={() => setSelectedChannel('all')}
              className={`px-4 py-2 rounded-lg text-base transition-all border ${
                selectedChannel === 'all'
                  ? isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-purple-100 text-purple-700 border-purple-300'
                  : isDarkMode
                    ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}>
              <span>All</span>
            </button>
          </div>
        </div>

        {/* Tracking Notice */}
        <div className={`rounded-xl p-4 border ${
          isDarkMode
            ? 'bg-amber-500/5 backdrop-blur-xl border-amber-500/20'
            : 'bg-amber-50/80 backdrop-blur-xl border-amber-200/50'
        }`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 mt-0.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            <div>
              <p className={`text-base ${isDarkMode ? 'text-amber-300' : 'text-amber-900'}`}>
                <span>Tracking Data Notice</span>
              </p>
              <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-amber-400/80' : 'text-amber-700'}`}>
                5 of 472 emails have tracking enabled (0.0% coverage). <button className={`underline ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>All legacy emails use tracking email</button>
              </p>
            </div>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          {/* Total Sent */}
          <div className={`relative overflow-hidden rounded-xl p-4 border transition-all ${
            isDarkMode
              ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-purple-500/30'
              : 'bg-white/80 backdrop-blur-xl border-purple-200/50 hover:border-purple-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Sent
                </p>
                <p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalSent}
                </p>
                <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Emails delivered
                </p>
              </div>
              <div className={`p-2.5 rounded-lg ${
                isDarkMode ? 'bg-purple-500/10' : 'bg-purple-100'
              }`}>
                <Mail className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
            </div>
          </div>

          {/* Open Rate */}
          <div className={`relative overflow-hidden rounded-xl p-4 border transition-all ${
            isDarkMode
              ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-blue-500/30'
              : 'bg-white/80 backdrop-blur-xl border-blue-200/50 hover:border-blue-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Open Rate
                </p>
                <p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.openRate}%
                </p>
                <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  0 emails opens
                </p>
              </div>
              <div className={`p-2.5 rounded-lg ${
                isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100'
              }`}>
                <MailOpen className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            </div>
          </div>

          {/* Reply Rate */}
          <div className={`relative overflow-hidden rounded-xl p-4 border transition-all ${
            isDarkMode
              ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-green-500/30'
              : 'bg-white/80 backdrop-blur-xl border-green-200/50 hover:border-green-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Reply Rate
                </p>
                <p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.replyRate}%
                </p>
                <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  0 conversations
                </p>
              </div>
              <div className={`p-2.5 rounded-lg ${
                isDarkMode ? 'bg-green-500/10' : 'bg-green-100'
              }`}>
                <Reply className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
            </div>
          </div>

          {/* Click Rate */}
          <div className={`relative overflow-hidden rounded-xl p-4 border transition-all ${
            isDarkMode
              ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-indigo-500/30'
              : 'bg-white/80 backdrop-blur-xl border-indigo-200/50 hover:border-indigo-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Click Rate
                </p>
                <p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.clickRate}%
                </p>
                <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  0 link clicks
                </p>
              </div>
              <div className={`p-2.5 rounded-lg ${
                isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-100'
              }`}>
                <Target className={`w-6 h-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Trends Chart */}
        <div className={`rounded-xl p-5 border ${
          isDarkMode
            ? 'bg-white/5 backdrop-blur-xl border-white/10'
            : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <div>
                <h2 className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Performance Trends
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Compare your metrics vs the previous period
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${
                isDarkMode
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : 'bg-purple-100 text-purple-700 border-purple-300'
              }`}>
                7 Days
              </button>
              <button className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${
                isDarkMode
                  ? 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}>
                30 Days
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={PERFORMANCE_DATA}>
              <defs>
                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorReplied" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#ffffff10' : '#00000010'} />
              <XAxis 
                dataKey="date" 
                stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1a0f2e' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#ffffff20' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  color: isDarkMode ? '#ffffff' : '#111827'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="sent" 
                stroke="#7C3AED" 
                fillOpacity={1} 
                fill="url(#colorSent)" 
                name="Sent"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="opened" 
                stroke="#3B82F6" 
                fillOpacity={1} 
                fill="url(#colorOpened)" 
                name="Opened"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="replied" 
                stroke="#10B981" 
                fillOpacity={1} 
                fill="url(#colorReplied)" 
                name="Replied"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Deliverability Health & Email Engagement */}
        <div className="grid grid-cols-2 gap-3">
          {/* Deliverability Health */}
          <div className={`rounded-xl p-5 border ${
            isDarkMode
              ? 'bg-white/5 backdrop-blur-xl border-white/10'
              : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              <div>
                <h2 className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Deliverability Health
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Track your email delivery success and spam risk
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Delivery Rate
                </p>
                <p className={`text-2xl mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {stats.deliveryRate}%
                </p>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Excellent
                </p>
              </div>

              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Bounce Rate
                </p>
                <p className={`text-2xl mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {stats.bounceRate}%
                </p>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  0 email (0 soft)
                </p>
              </div>

              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Spam Score
                </p>
                <p className={`text-2xl mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {stats.spamScore}/10
                </p>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  No spam data
                </p>
              </div>

              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Email Sent
                </p>
                <p className={`text-2xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalSent}
                </p>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Total tracked
                </p>
              </div>
            </div>
          </div>

          {/* Email Engagement Trends */}
          <div className={`rounded-xl p-5 border ${
            isDarkMode
              ? 'bg-white/5 backdrop-blur-xl border-white/10'
              : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <div>
                <h2 className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Email Engagement (Last 30 Days)
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Track opens and replies over time
                </p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={ENGAGEMENT_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#ffffff10' : '#00000010'} />
                <XAxis 
                  dataKey="date" 
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  style={{ fontSize: '11px' }}
                />
                <YAxis 
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  style={{ fontSize: '11px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1a0f2e' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#ffffff20' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: isDarkMode ? '#ffffff' : '#111827',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="opens" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Opens"
                  dot={{ fill: '#3B82F6', r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#7C3AED" 
                  strokeWidth={2}
                  name="Clicks"
                  dot={{ fill: '#7C3AED', r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="replies" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Replies"
                  dot={{ fill: '#10B981', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best Send Times Heatmap */}
        <div className={`rounded-xl p-5 border ${
          isDarkMode
            ? 'bg-white/5 backdrop-blur-xl border-white/10'
            : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Clock className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <div>
                <h2 className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Best Send Times
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  See when your emails get the most engagement (timezone: America/New_York)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${
                isDarkMode
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : 'bg-purple-100 text-purple-700 border-purple-300'
              }`}>
                Open Rate
              </button>
              <button className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${
                isDarkMode
                  ? 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}>
                Reply Rate
              </button>
            </div>
          </div>

          {/* Heatmap */}
          <div className="space-y-1">
            {/* Hour labels */}
            <div className="flex items-center gap-1 ml-12">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className={`flex-1 text-center text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  {i === 0 ? '12am' : i === 6 ? '6am' : i === 12 ? '12pm' : i === 18 ? '6pm' : ''}
                </div>
              ))}
            </div>

            {/* Days and heatmap cells */}
            {BEST_TIMES.map((row) => (
              <div key={row.day} className="flex items-center gap-1">
                <div className={`w-10 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {row.day}
                </div>
                <div className="flex gap-1 flex-1">
                  {row.hours.map((value, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 h-8 rounded transition-all ${
                        value === 0
                          ? isDarkMode ? 'bg-white/5' : 'bg-gray-100'
                          : value >= 8
                            ? isDarkMode ? 'bg-green-500/40 border border-green-500/50' : 'bg-green-300 border border-green-400'
                            : isDarkMode ? 'bg-green-500/20 border border-green-500/30' : 'bg-green-200 border border-green-300'
                      }`}
                      title={value > 0 ? `${row.day} ${idx}:00 - ${value}% opens` : ''}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Best times summary */}
          <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-purple-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Award className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <p className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                Your Best Send Times
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1.5 rounded-lg text-sm ${isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'}`}>
                #1 Tuesday 5am (8% opens)
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-sm ${isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'}`}>
                #2 Tuesday 7am (9% opens)
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-sm ${isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'}`}>
                #3 Tuesday 7pm (7% opens)
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Leaderboard */}
        <div className={`rounded-xl p-5 border ${
          isDarkMode
            ? 'bg-white/5 backdrop-blur-xl border-white/10'
            : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Award className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <div>
                <h2 className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Campaign Leaderboard
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  All campaigns ranked by performance (total: 2802 campaigns - 0% reply)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className={`px-4 py-2 rounded-lg text-base transition-all flex items-center gap-2 border ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}>
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button className={`px-3 py-2 rounded-lg text-sm transition-all ${
                isDarkMode
                  ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                  : 'bg-purple-50 text-purple-700 border border-purple-200'
              }`}>
                28029 campaigns
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border flex-1 max-w-md ${
              isDarkMode
                ? 'bg-white/5 border-white/10 text-gray-300'
                : 'bg-white border-gray-200 text-gray-700'
            }`}>
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`bg-transparent outline-none text-base flex-1 placeholder:text-gray-500 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-900'
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTab('all')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  selectedTab === 'all'
                    ? isDarkMode
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-purple-100 text-purple-700'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedTab('active')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  selectedTab === 'active'
                    ? isDarkMode
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-purple-100 text-purple-700'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setSelectedTab('draft')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  selectedTab === 'draft'
                    ? isDarkMode
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-purple-100 text-purple-700'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Draft
              </button>
              <button
                onClick={() => setSelectedTab('completed')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  selectedTab === 'completed'
                    ? isDarkMode
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-purple-100 text-purple-700'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b text-sm ${
                  isDarkMode
                    ? 'border-white/10 text-gray-400'
                    : 'border-gray-200 text-gray-600'
                }`}>
                  <th className="text-left py-3 px-4">Campaign</th>
                  <th className="text-center py-3 px-4">Sent</th>
                  <th className="text-center py-3 px-4">Open Rate</th>
                  <th className="text-center py-3 px-4">Reply Rate</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign, idx) => (
                  <tr
                    key={campaign.id}
                    className={`border-b transition-all ${
                      isDarkMode
                        ? 'border-white/5 hover:bg-white/5'
                        : 'border-gray-100 hover:bg-purple-50/50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                          isDarkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {campaign.name}
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {campaign.date}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`py-3 px-4 text-center text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {campaign.sent}
                    </td>
                    <td className={`py-3 px-4 text-center text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {campaign.openRate}%
                    </td>
                    <td className={`py-3 px-4 text-center text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {campaign.replyRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Engaged Contacts */}
        <div className={`rounded-xl p-5 border ${
          isDarkMode
            ? 'bg-white/5 backdrop-blur-xl border-white/10'
            : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <Users className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <div>
              <h2 className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Most Engaged Contacts
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Contacts ranked by engagement score
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {MOCK_CONTACTS.map((contact, idx) => (
              <div
                key={contact.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  isDarkMode
                    ? 'bg-white/5 hover:bg-white/10'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    idx === 0
                      ? isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                      : isDarkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {contact.name}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      {contact.email} • {contact.company}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {contact.opens} opens
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {contact.replies} replies
                    </p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-base ${
                    isDarkMode ? 'bg-purple-500/10 text-purple-300' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {contact.score} score
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}