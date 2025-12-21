import { useState, useEffect } from 'react';
import {
  Mail,
  Inbox as InboxIcon,
  Star,
  Archive,
  Trash2,
  Reply,
  MoreVertical,
  Search,
  Filter,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  MailOpen
} from 'lucide-react';

interface InboxEmail {
  id: string;
  senderName: string;
  company: string;
  email: string;
  subject: string;
  preview: string;
  date: string;
  status: 'unread' | 'read' | 'replied';
  isStarred?: boolean;
}

const MOCK_INBOX: InboxEmail[] = [
  { id: '1', senderName: 'Alice Johnson', company: 'TechCorp Solutions', email: 'alice.j@techcorp.com', subject: 'Re: Partnership Opportunity', preview: 'Thanks for reaching out! I\'d love to discuss this further...', date: 'Nov 15, 2025', status: 'unread', isStarred: true },
  { id: '2', senderName: 'Bob Smith', company: 'Startup XYZ', email: 'bob.s@startupxyz.com', subject: 'Re: Demo Follow-up', preview: 'The demo looks great. Can we schedule a call next week?', date: 'Nov 15, 2025', status: 'unread' },
  { id: '3', senderName: 'Carol Baseline', company: 'Gamma LLC', email: 'carol.b@gammaexample.com', subject: 'Re: Collaboration Proposal', preview: 'I reviewed your proposal and have a few questions...', date: 'Nov 14, 2025', status: 'read' },
  { id: '4', senderName: 'David Chen', company: 'Innovation Labs', email: 'david.c@innovationlabs.com', subject: 'Meeting Request', preview: 'Would you be available for a 30-minute call on Thursday?', date: 'Nov 14, 2025', status: 'replied' },
  { id: '5', senderName: 'Emma Wilson', company: 'Digital Agency', email: 'emma.w@digitalagency.com', subject: 'Re: Pricing Discussion', preview: 'Your pricing structure looks reasonable. Let\'s move forward...', date: 'Nov 13, 2025', status: 'read' },
  { id: '6', senderName: 'Frank Martinez', company: 'Cloud Services', email: 'frank.m@cloudservices.com', subject: 'Integration Questions', preview: 'I have some technical questions about the integration...', date: 'Nov 13, 2025', status: 'unread', isStarred: true },
  { id: '7', senderName: 'Grace Kim', company: 'Marketing Pro', email: 'grace.k@marketingpro.com', subject: 'Re: Campaign Strategy', preview: 'The campaign strategy you outlined looks promising...', date: 'Nov 12, 2025', status: 'replied' },
  { id: '8', senderName: 'Henry Lopez', company: 'Consulting Group', email: 'henry.l@consultinggroup.com', subject: 'Follow-up Question', preview: 'Quick question about the timeline you mentioned...', date: 'Nov 12, 2025', status: 'read' },
  { id: '9', senderName: 'Isabel Torres', company: 'Growth Ventures', email: 'isabel.t@growthventures.com', subject: 'Re: Partnership Terms', preview: 'I\'ve reviewed the terms and they look good overall...', date: 'Nov 11, 2025', status: 'replied' },
  { id: '10', senderName: 'Jack Peterson', company: 'Software Inc', email: 'jack.p@softwareinc.com', subject: 'Feature Request', preview: 'Would it be possible to add support for...', date: 'Nov 11, 2025', status: 'read' },
];

export function Inbox() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [emails, setEmails] = useState(MOCK_INBOX);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread' | 'starred'>('all');

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
      case 'read':
        return {
          label: 'Read',
          icon: MailOpen,
          textColor: isDarkMode ? 'text-blue-400' : 'text-blue-600',
          bgColor: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100',
          borderColor: isDarkMode ? 'border-blue-500/30' : 'border-blue-300'
        };
      default:
        return {
          label: 'Unread',
          icon: Mail,
          textColor: isDarkMode ? 'text-purple-400' : 'text-purple-600',
          bgColor: isDarkMode ? 'bg-purple-500/10' : 'bg-purple-100',
          borderColor: isDarkMode ? 'border-purple-500/30' : 'border-purple-300'
        };
    }
  };

  const filteredEmails = emails.filter(email => {
    if (selectedTab === 'unread') return email.status === 'unread';
    if (selectedTab === 'starred') return email.isStarred;
    return true;
  });

  const stats = {
    total: emails.length,
    unread: emails.filter(e => e.status === 'unread').length,
    replied: emails.filter(e => e.status === 'replied').length,
    starred: emails.filter(e => e.isStarred).length,
  };

  const toggleStar = (emailId: string) => {
    setEmails(prev =>
      prev.map(email =>
        email.id === emailId ? { ...email, isStarred: !email.isStarred } : email
      )
    );
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
              Inbox
            </h1>
            <p className={`text-base mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage replies and incoming messages
            </p>
          </div>

          {/* Mark All Read Button */}
          <button
            onClick={async () => {
              // Update local state immediately
              setEmails(prev => prev.map(email => email.status === 'unread' ? { ...email, status: 'read' } : email));
              // Also call backend API for persistence
              try {
                await fetch('/api/inbox/replies/mark-all-read', { method: 'PUT' });
              } catch (error) {
                console.log('Note: Backend sync will happen on next login');
              }
            }}
            className={`px-5 py-2.5 rounded-lg text-base transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${isDarkMode
              ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30 hover:border-purple-500/50'
              : 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-300 hover:border-purple-400'
              }`}>
            <CheckCircle2 className="w-5 h-5" />
            <span>Mark All Read</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          {/* Total Emails */}
          <div className={`relative overflow-hidden rounded-xl p-4 border transition-all ${isDarkMode
            ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-purple-500/30'
            : 'bg-white/80 backdrop-blur-xl border-purple-200/50 hover:border-purple-300'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total
                </p>
                <p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.total}
                </p>
              </div>
              <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-purple-500/10' : 'bg-purple-100'
                }`}>
                <InboxIcon className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
            </div>
          </div>

          {/* Unread */}
          <div className={`relative overflow-hidden rounded-xl p-4 border transition-all ${isDarkMode
            ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-amber-500/30'
            : 'bg-white/80 backdrop-blur-xl border-amber-200/50 hover:border-amber-300'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Unread
                </p>
                <p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.unread}
                </p>
              </div>
              <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-amber-500/10' : 'bg-amber-100'
                }`}>
                <Mail className={`w-6 h-6 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
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

          {/* Starred */}
          <div className={`relative overflow-hidden rounded-xl p-4 border transition-all ${isDarkMode
            ? 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-yellow-500/30'
            : 'bg-white/80 backdrop-blur-xl border-yellow-200/50 hover:border-yellow-300'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Starred
                </p>
                <p className={`text-3xl mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.starred}
                </p>
              </div>
              <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-yellow-500/10' : 'bg-yellow-100'
                }`}>
                <Star className={`w-6 h-6 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
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
                <div className="flex items-center gap-2">
                  <InboxIcon className="w-4 h-4" />
                  <span>All ({stats.total})</span>
                </div>
              </button>

              <button
                onClick={() => setSelectedTab('unread')}
                className={`px-4 py-2 rounded-lg text-base transition-all ${selectedTab === 'unread'
                  ? isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-purple-100 text-purple-700 border border-purple-300'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <span>Unread ({stats.unread})</span>
              </button>

              <button
                onClick={() => setSelectedTab('starred')}
                className={`px-4 py-2 rounded-lg text-base transition-all ${selectedTab === 'starred'
                  ? isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-purple-100 text-purple-700 border border-purple-300'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  <span>Starred ({stats.starred})</span>
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
                  placeholder="Search inbox..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`bg-transparent outline-none text-base w-48 placeholder:text-gray-500 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}
                />
              </div>

              {/* Filter Button */}
              <button
                onClick={() => alert('Filter options:\n\n• All: Shows all emails\n• Unread: Shows only unread\n• Starred: Shows only starred\n\nUse the tabs above to filter!')}
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
            Showing {filteredEmails.length} of {stats.total} emails
          </div>
        </div>

        {/* Email List */}
        <div className={`rounded-xl border overflow-hidden ${isDarkMode
          ? 'bg-white/5 backdrop-blur-xl border-white/10'
          : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
          }`}>
          {/* Email Rows */}
          <div className="divide-y divide-white/5">
            {filteredEmails.map((email) => {
              const statusConfig = getStatusConfig(email.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={email.id}
                  className={`px-5 py-4 transition-all ${isDarkMode
                    ? 'hover:bg-white/5 border-white/5'
                    : 'hover:bg-purple-50/50 border-gray-100'
                    } ${email.status === 'unread' ? 'bg-purple-500/5' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Star */}
                    <button
                      onClick={() => toggleStar(email.id)}
                      className={`mt-1 transition-all hover:scale-110 ${email.isStarred
                        ? 'text-yellow-400'
                        : isDarkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-300 hover:text-gray-500'
                        }`}
                    >
                      <Star className={`w-5 h-5 ${email.isStarred ? 'fill-current' : ''}`} />
                    </button>

                    {/* Sender Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className={`text-base ${email.status === 'unread'
                              ? isDarkMode ? 'text-white' : 'text-gray-900'
                              : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                              {email.senderName}
                            </h3>
                            <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              {email.company}
                            </span>
                          </div>
                          <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                            {email.email}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Date */}
                          <span className={`text-sm whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {email.date}
                          </span>

                          {/* Status Badge */}
                          <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-sm ${statusConfig.bgColor
                            } ${statusConfig.borderColor} ${statusConfig.textColor}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span>{statusConfig.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Subject and Preview */}
                      <div className="mb-2">
                        <h4 className={`text-base mb-1 ${email.status === 'unread'
                          ? isDarkMode ? 'text-white' : 'text-gray-900'
                          : isDarkMode ? 'text-gray-400' : 'text-gray-700'
                          }`}>
                          {email.subject}
                        </h4>
                        <p className={`text-sm line-clamp-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                          {email.preview}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            alert(`Reply to ${email.senderName} at ${email.email}\n\nTip: Go to Compose tab to write your reply!`);
                            setEmails(prev => prev.map(e => e.id === email.id ? { ...e, status: 'read' } : e));
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${isDarkMode
                            ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20'
                            : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                            }`}>
                          <Reply className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </button>

                        <button
                          onClick={() => {
                            setEmails(prev => prev.filter(e => e.id !== email.id));
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${isDarkMode
                            ? 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                            }`}>
                          <Archive className="w-3.5 h-3.5" />
                          <span>Archive</span>
                        </button>

                        <button
                          onClick={() => {
                            const action = prompt('Choose action:\n1. Mark as unread\n2. Delete\n\nEnter 1 or 2:');
                            if (action === '1') {
                              setEmails(prev => prev.map(e => e.id === email.id ? { ...e, status: 'unread' } : e));
                            } else if (action === '2') {
                              setEmails(prev => prev.filter(e => e.id !== email.id));
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-all ${isDarkMode
                            ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}>
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
