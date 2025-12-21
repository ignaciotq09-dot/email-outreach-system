import { useState, useEffect } from 'react';
import {
  Mail,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  MailOpen,
  Reply,
  ChevronDown,
  Search,
  Filter,
  Calendar,
  Users,
  BarChart3,
  Archive,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SentEmail {
  id: string;
  recipientName: string;
  company: string;
  email: string;
  subject: string;
  date: string;
  status: 'no-reply' | 'replied' | 'opened' | 'bounced';
  openedAt?: string;
}

const MOCK_EMAILS: SentEmail[] = [
  { id: '1', recipientName: 'Alice Johnson', company: 'TechCorp Solutions', email: 'alice.j@techcorp.com', subject: 'Partnership Opportunity', date: 'Nov 14, 2025', status: 'no-reply' },
  { id: '2', recipientName: 'Bob Smith', company: 'Startup XYZ', email: 'bob.s@startupxyz.com', subject: 'Follow-up on Demo', date: 'Nov 14, 2025', status: 'no-reply' },
  { id: '3', recipientName: 'Test User One', company: 'Example Corp', email: 'test1@example.com', subject: 'Product Demo Request', date: 'Nov 14, 2025', status: 'no-reply' },
  { id: '4', recipientName: 'Alice Johnson', company: 'TechCorp Solutions', email: 'alice.j@techcorp.com', subject: 'Q4 Strategy Meeting', date: 'Nov 14, 2025', status: 'no-reply' },
  { id: '5', recipientName: 'Alice Johnson', company: 'TechCorp Solutions', email: 'alice.j@techcorp.com', subject: 'Collaboration Proposal', date: 'Nov 14, 2025', status: 'no-reply' },
  { id: '6', recipientName: 'Test User One', company: 'Example Corp', email: 'test1@example.com', subject: 'Quick Question', date: 'Nov 14, 2025', status: 'no-reply' },
  { id: '7', recipientName: 'Test User One', company: 'Example Corp', email: 'test1@example.com', subject: 'Introduction', date: 'Nov 14, 2025', status: 'no-reply' },
  { id: '8', recipientName: 'Bob Smith', company: 'Startup XYZ', email: 'bob.s@startupxyz.com', subject: 'Pricing Discussion', date: 'Nov 14, 2025', status: 'no-reply' },
  { id: '9', recipientName: 'Bob Smith', company: 'Startup XYZ', email: 'bob.s@startupxyz.com', subject: 'Feature Request', date: 'Nov 14, 2025', status: 'no-reply' },
  { id: '10', recipientName: 'Alice Johnson', company: 'TechCorp Solutions', email: 'alice.j@techcorp.com', subject: 'Weekly Update', date: 'Nov 14, 2025', status: 'no-reply' },
  { id: '11', recipientName: 'Carol Baseline', company: 'Gamma LLC', email: 'carol.b@gammaexample.com', subject: 'Partnership Review', date: 'Nov 14, 2025', status: 'no-reply' },
  { id: '12', recipientName: 'Bob Smith', company: 'Startup XYZ', email: 'bob.s@startupxyz.com', subject: 'Next Steps', date: 'Nov 14, 2025', status: 'no-reply' },
];

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
  const [archivedPagination, setArchivedPagination] = useState({
    page: 0,
    pageSize: 50,
    totalCount: 0,
    totalPages: 0,
    hasMore: false
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
      if (archivedType === 'emails') {
        const response = await fetch(`/api/emails/archived?page=${page}&pageSize=50`);
        if (response.ok) {
          const data = await response.json();
          const transformedEmails = data.emails.map((email: any) => ({
            id: String(email.id),
            recipientName: email.contact?.name || 'Unknown',
            company: email.contact?.company || 'Unknown',
            email: email.contact?.email || '',
            subject: email.subject || 'No Subject',
            date: email.sentAt ? new Date(email.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
            status: email.replyReceived ? 'replied' : email.opened ? 'opened' : 'no-reply'
          }));
          setArchivedEmails(transformedEmails);
          setArchivedPagination(data.pagination);
        }
      } else {
        const response = await fetch(`/api/sms/archived?page=${page}&pageSize=50`);
        if (response.ok) {
          const data = await response.json();
          const transformedSms = data.sms.map((sms: any) => ({
            id: String(sms.id),
            recipientName: sms.contact?.name || 'Unknown',
            company: sms.contact?.company || 'Unknown',
            email: sms.contact?.email || sms.toPhone || '',
            subject: sms.message?.substring(0, 50) + (sms.message?.length > 50 ? '...' : '') || 'SMS',
            date: sms.sentAt ? new Date(sms.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
            status: sms.status === 'delivered' ? 'replied' : sms.status === 'sent' ? 'opened' : 'no-reply'
          }));
          setArchivedSms(transformedSms);
          setArchivedPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching archived content:', error);
    } finally {
      setArchivedLoading(false);
    }
  };

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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'replied':
        return {
          label: 'Replied',
          icon: Reply,
          textColor: isDarkMode ? 'text-green-400' : 'text-green-600',
          bgColor: isDarkMode ? 'bg-green-500/10' : 'bg-green-100',
          borderColor: isDarkMode ? 'border-green-500/30' : 'border-green-300'
        };
      case 'opened':
        return {
          label: 'Opened',
          icon: MailOpen,
          textColor: isDarkMode ? 'text-blue-400' : 'text-blue-600',
          bgColor: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100',
          borderColor: isDarkMode ? 'border-blue-500/30' : 'border-blue-300'
        };
      case 'bounced':
        return {
          label: 'Bounced',
          icon: AlertCircle,
          textColor: isDarkMode ? 'text-red-400' : 'text-red-600',
          bgColor: isDarkMode ? 'bg-red-500/10' : 'bg-red-100',
          borderColor: isDarkMode ? 'border-red-500/30' : 'border-red-300'
        };
      default:
        return {
          label: 'No Reply',
          icon: Clock,
          textColor: isDarkMode ? 'text-amber-400' : 'text-amber-600',
          bgColor: isDarkMode ? 'bg-amber-500/10' : 'bg-amber-100',
          borderColor: isDarkMode ? 'border-amber-500/30' : 'border-amber-300'
        };
    }
  };

  const stats = {
    total: emails.length,
    sent: emails.length,
    opened: emails.filter(e => e.status === 'opened').length,
    replied: emails.filter(e => e.status === 'replied').length,
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
              Sent Messages
            </h1>
            <p className={`text-base mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Track your emails and SMS outreach
            </p>
          </div>

          {/* Send Auto Follow-up Button */}
          <button className={`px-5 py-2.5 rounded-lg text-base transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${isDarkMode
            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 hover:border-amber-500/50'
            : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-300 hover:border-amber-400'
            }`}>
            <Mail className="w-5 h-5" />
            <span>Send Auto Follow-up</span>
          </button>
        </div>

        {/* Stats Cards */}
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
              <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-purple-500/10' : 'bg-purple-100'
                }`}>
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
              <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100'
                }`}>
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
              <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-green-500/10' : 'bg-green-100'
                }`}>
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
              <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-100'
                }`}>
                <TrendingUp className={`w-6 h-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Tabs */}
        <div className={`rounded-xl p-4 border ${isDarkMode
          ? 'bg-white/5 backdrop-blur-xl border-white/10'
          : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
          }`}>
          <div className="flex items-center justify-between gap-3">
            {/* Left - Tabs */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedTab('emails')}
                className={`px-4 py-2 rounded-lg text-base transition-all ${selectedTab === 'emails'
                  ? isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-purple-100 text-purple-700 border border-purple-300'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>Emails ({stats.total})</span>
                </div>
              </button>

              <button
                onClick={() => setSelectedTab('sms')}
                className={`px-4 py-2 rounded-lg text-base transition-all ${selectedTab === 'sms'
                  ? isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-purple-100 text-purple-700 border border-purple-300'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <span>SMS (0)</span>
              </button>

              <button
                onClick={() => setSelectedTab('archived')}
                className={`px-4 py-2 rounded-lg text-base transition-all ${selectedTab === 'archived'
                  ? isDarkMode
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4" />
                  <span>Archived</span>
                </div>
              </button>
            </div>

            {/* Right - Search and Filters */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isDarkMode
                ? 'bg-white/5 border-white/10 text-gray-300'
                : 'bg-white border-gray-200 text-gray-700'
                }`}>
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`bg-transparent outline-none text-base w-48 placeholder:text-gray-500 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}
                />
              </div>

              {/* Filter Button */}
              <button
                onClick={() => alert('Filter options:\n\n• Emails tab: Regular emails\n• SMS tab: Text messages\n• Archived tab: Old items\n\nUse the tabs above to filter!')}
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
            Follow-up sequence: 3 days → 7 days → 2 weeks
          </div>
        </div>

        {/* Email List */}
        <div className={`rounded-xl border overflow-hidden ${isDarkMode
          ? 'bg-white/5 backdrop-blur-xl border-white/10'
          : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
          }`}>
          {/* Table Header */}
          <div className={`grid grid-cols-12 gap-4 px-5 py-3.5 border-b text-sm ${isDarkMode
            ? 'bg-white/5 border-white/10 text-gray-400'
            : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
            <div className="col-span-2">Recipient</div>
            <div className="col-span-2">Company</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Date Sent</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Archived Type Toggle (Emails/SMS) */}
          {selectedTab === 'archived' && (
            <div className={`flex items-center gap-2 px-5 py-3 border-b ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
              }`}>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Show:</span>
              <button
                onClick={() => setArchivedType('emails')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${archivedType === 'emails'
                  ? isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-purple-100 text-purple-700 border border-purple-300'
                  : isDarkMode
                    ? 'text-gray-400 hover:bg-white/10'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <Mail className="w-4 h-4 inline mr-1" />
                Emails
              </button>
              <button
                onClick={() => setArchivedType('sms')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${archivedType === 'sms'
                  ? isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-purple-100 text-purple-700 border border-purple-300'
                  : isDarkMode
                    ? 'text-gray-400 hover:bg-white/10'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                SMS
              </button>
            </div>
          )}

          {/* Loading State for Archived */}
          {selectedTab === 'archived' && archivedLoading && (
            <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading archived {archivedType}...
            </div>
          )}

          {/* Empty State for Archived */}
          {selectedTab === 'archived' && !archivedLoading &&
            ((archivedType === 'emails' && archivedEmails.length === 0) ||
              (archivedType === 'sms' && archivedSms.length === 0)) && (
              <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <Archive className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No archived {archivedType} yet</p>
                <p className="text-sm mt-1 opacity-75">
                  {archivedType === 'emails'
                    ? 'Emails older than your 100 most recent will appear here'
                    : 'SMS older than your 100 most recent will appear here'}
                </p>
              </div>
            )}

          {/* Email/SMS Rows */}
          <div className="divide-y divide-white/5">
            {(selectedTab === 'archived'
              ? (archivedType === 'emails' ? archivedEmails : archivedSms)
              : emails
            ).map((email) => {
              const statusConfig = getStatusConfig(email.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={email.id}
                  className={`grid grid-cols-12 gap-4 px-5 py-4 items-center text-base transition-all ${isDarkMode
                    ? 'hover:bg-white/5 border-white/5'
                    : 'hover:bg-purple-50/50 border-gray-100'
                    }`}
                >
                  {/* Recipient */}
                  <div className={`col-span-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {email.recipientName}
                  </div>

                  {/* Company */}
                  <div className={`col-span-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {email.company}
                  </div>

                  {/* Email */}
                  <div className={`col-span-3 text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {email.email}
                  </div>

                  {/* Date */}
                  <div className={`col-span-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {email.date}
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-sm ${statusConfig.bgColor
                      } ${statusConfig.borderColor} ${statusConfig.textColor}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span>{statusConfig.label}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 text-right">
                    <button className={`p-1.5 rounded hover:bg-white/10 transition-all ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                      }`}>
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination for Archived */}
          {selectedTab === 'archived' && archivedPagination.totalPages > 1 && (
            <div className={`flex items-center justify-between px-5 py-3 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'
              }`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Page {archivedPagination.page + 1} of {archivedPagination.totalPages} ({archivedPagination.totalCount} {archivedType})
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchArchivedContent(archivedPagination.page - 1)}
                  disabled={archivedPagination.page === 0}
                  className={`p-2 rounded-lg transition-all ${archivedPagination.page === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : isDarkMode
                      ? 'hover:bg-white/10 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                    } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => fetchArchivedContent(archivedPagination.page + 1)}
                  disabled={!archivedPagination.hasMore}
                  className={`p-2 rounded-lg transition-all ${!archivedPagination.hasMore
                    ? 'opacity-50 cursor-not-allowed'
                    : isDarkMode
                      ? 'hover:bg-white/10 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                    } ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}