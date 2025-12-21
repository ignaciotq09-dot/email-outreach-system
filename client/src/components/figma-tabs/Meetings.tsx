import { useState, useEffect } from 'react';
import {
  Calendar,
  Video,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Search,
  Filter,
  Link as LinkIcon,
  Copy,
  Edit,
  Trash2,
  ExternalLink,
  MapPin,
  Phone,
  Globe
} from 'lucide-react';

interface Meeting {
  id: string;
  attendeeName: string;
  company: string;
  email: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  platform: 'zoom' | 'google-meet' | 'teams' | 'phone' | 'in-person';
  status: 'upcoming' | 'completed' | 'cancelled';
  meetingLink?: string;
  notes?: string;
}

const MOCK_MEETINGS: Meeting[] = [
  {
    id: '1',
    attendeeName: 'Sarah Mitchell',
    company: 'TechVentures Inc',
    email: 'sarah.m@techventures.com',
    title: 'Product Demo & Partnership Discussion',
    date: 'Dec 18, 2025',
    time: '2:00 PM',
    duration: '30 min',
    platform: 'zoom',
    status: 'upcoming',
    meetingLink: 'https://zoom.us/j/123456789',
    notes: 'Interested in enterprise plan'
  },
  {
    id: '2',
    attendeeName: 'Michael Chen',
    company: 'Growth Partners',
    email: 'michael.c@growthpartners.com',
    title: 'Strategy Session',
    date: 'Dec 18, 2025',
    time: '4:30 PM',
    duration: '45 min',
    platform: 'google-meet',
    status: 'upcoming',
    meetingLink: 'https://meet.google.com/xyz-abcd-efg'
  },
  {
    id: '3',
    attendeeName: 'Emily Johnson',
    company: 'Startup Labs',
    email: 'emily.j@startuplabs.com',
    title: 'Initial Consultation',
    date: 'Dec 19, 2025',
    time: '10:00 AM',
    duration: '30 min',
    platform: 'teams',
    status: 'upcoming',
    meetingLink: 'https://teams.microsoft.com/l/meetup-join/...'
  },
  {
    id: '4',
    attendeeName: 'David Park',
    company: 'Innovation Corp',
    email: 'david.p@innovationcorp.com',
    title: 'Follow-up Call',
    date: 'Dec 19, 2025',
    time: '3:00 PM',
    duration: '15 min',
    platform: 'phone',
    status: 'upcoming'
  },
  {
    id: '5',
    attendeeName: 'Lisa Anderson',
    company: 'Digital Solutions',
    email: 'lisa.a@digitalsolutions.com',
    title: 'Contract Review Meeting',
    date: 'Dec 15, 2025',
    time: '11:00 AM',
    duration: '60 min',
    platform: 'zoom',
    status: 'completed'
  },
  {
    id: '6',
    attendeeName: 'James Wilson',
    company: 'Cloud Services Ltd',
    email: 'james.w@cloudservices.com',
    title: 'Technical Integration Discussion',
    date: 'Dec 14, 2025',
    time: '2:00 PM',
    duration: '45 min',
    platform: 'google-meet',
    status: 'completed'
  },
  {
    id: '7',
    attendeeName: 'Rachel Green',
    company: 'Marketing Pro',
    email: 'rachel.g@marketingpro.com',
    title: 'Campaign Planning Session',
    date: 'Dec 13, 2025',
    time: '1:00 PM',
    duration: '30 min',
    platform: 'teams',
    status: 'cancelled'
  },
];

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

  const getPlatformConfig = (platform: string) => {
    switch (platform) {
      case 'zoom':
        return {
          label: 'Zoom',
          icon: Video,
          color: isDarkMode ? 'text-blue-400' : 'text-blue-600',
          bgColor: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100',
          borderColor: isDarkMode ? 'border-blue-500/30' : 'border-blue-300'
        };
      case 'google-meet':
        return {
          label: 'Google Meet',
          icon: Video,
          color: isDarkMode ? 'text-green-400' : 'text-green-600',
          bgColor: isDarkMode ? 'bg-green-500/10' : 'bg-green-100',
          borderColor: isDarkMode ? 'border-green-500/30' : 'border-green-300'
        };
      case 'teams':
        return {
          label: 'Teams',
          icon: Video,
          color: isDarkMode ? 'text-purple-400' : 'text-purple-600',
          bgColor: isDarkMode ? 'bg-purple-500/10' : 'bg-purple-100',
          borderColor: isDarkMode ? 'border-purple-500/30' : 'border-purple-300'
        };
      case 'phone':
        return {
          label: 'Phone Call',
          icon: Phone,
          color: isDarkMode ? 'text-amber-400' : 'text-amber-600',
          bgColor: isDarkMode ? 'bg-amber-500/10' : 'bg-amber-100',
          borderColor: isDarkMode ? 'border-amber-500/30' : 'border-amber-300'
        };
      default:
        return {
          label: 'In Person',
          icon: MapPin,
          color: isDarkMode ? 'text-indigo-400' : 'text-indigo-600',
          bgColor: isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-100',
          borderColor: isDarkMode ? 'border-indigo-500/30' : 'border-indigo-300'
        };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          color: isDarkMode ? 'text-green-400' : 'text-green-600',
          bgColor: isDarkMode ? 'bg-green-500/10' : 'bg-green-100',
          borderColor: isDarkMode ? 'border-green-500/30' : 'border-green-300'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: isDarkMode ? 'text-red-400' : 'text-red-600',
          bgColor: isDarkMode ? 'bg-red-500/10' : 'bg-red-100',
          borderColor: isDarkMode ? 'border-red-500/30' : 'border-red-300'
        };
      default:
        return {
          label: 'Upcoming',
          color: isDarkMode ? 'text-blue-400' : 'text-blue-600',
          bgColor: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100',
          borderColor: isDarkMode ? 'border-blue-500/30' : 'border-blue-300'
        };
    }
  };

  const filteredMeetings = meetings.filter(meeting => {
    if (selectedTab === 'upcoming') return meeting.status === 'upcoming';
    if (selectedTab === 'completed') return meeting.status === 'completed';
    return true;
  });

  const stats = {
    total: meetings.length,
    upcoming: meetings.filter(m => m.status === 'upcoming').length,
    completed: meetings.filter(m => m.status === 'completed').length,
    cancelled: meetings.filter(m => m.status === 'cancelled').length,
  };

  const copyBookingLink = () => {
    navigator.clipboard.writeText(bookingLink);
    // Could add a toast notification here
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
            onClick={() => {
              const title = prompt('Meeting title:');
              if (title) {
                const newMeeting = {
                  id: String(Date.now()),
                  attendeeName: 'New Attendee',
                  company: 'Company',
                  email: '',
                  title,
                  date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                  time: '10:00 AM',
                  duration: '30 min',
                  platform: 'zoom' as const,
                  status: 'upcoming' as const,
                  meetingLink: 'https://zoom.us/j/' + Date.now()
                };
                setMeetings(prev => [newMeeting, ...prev]);
              }
            }}
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
              <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-purple-500/10' : 'bg-purple-100'
                }`}>
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
                    className={`text-base flex-1 bg-transparent outline-none ${isDarkMode ? 'text-purple-300' : 'text-purple-700'
                      }`}
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
              <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-purple-500/10' : 'bg-purple-100'
                }`}>
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
              <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100'
                }`}>
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
              <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-green-500/10' : 'bg-green-100'
                }`}>
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
              <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-red-500/10' : 'bg-red-100'
                }`}>
                <XCircle className={`w-6 h-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
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
              {/* Search */}
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
                  className={`bg-transparent outline-none text-base w-48 placeholder:text-gray-500 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'
                    }`}
                />
              </div>

              {/* Filter Button */}
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
          {/* Meeting Rows */}
          <div className="divide-y divide-white/5">
            {filteredMeetings.map((meeting) => {
              const platformConfig = getPlatformConfig(meeting.platform);
              const statusConfig = getStatusConfig(meeting.status);
              const PlatformIcon = platformConfig.icon;

              return (
                <div
                  key={meeting.id}
                  className={`px-5 py-4 transition-all ${isDarkMode
                    ? 'hover:bg-white/5 border-white/5'
                    : 'hover:bg-purple-50/50 border-gray-100'
                    } ${meeting.status === 'upcoming' ? 'bg-purple-500/5' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Calendar Icon */}
                    <div className={`p-2.5 rounded-lg mt-1 ${platformConfig.bgColor}`}>
                      <PlatformIcon className={`w-5 h-5 ${platformConfig.color}`} />
                    </div>

                    {/* Meeting Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-base mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            {meeting.title}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                              {meeting.attendeeName}
                            </span>
                            <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              {meeting.company}
                            </span>
                          </div>
                          <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                            {meeting.email}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Date & Time */}
                          <div className={`text-right`}>
                            <p className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {meeting.date}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {meeting.time} • {meeting.duration}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-sm whitespace-nowrap ${statusConfig.bgColor
                            } ${statusConfig.borderColor} ${statusConfig.color}`}>
                            <span>{statusConfig.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Platform & Notes */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-sm ${platformConfig.bgColor
                          } ${platformConfig.borderColor} ${platformConfig.color}`}>
                          <PlatformIcon className="w-3.5 h-3.5" />
                          <span>{platformConfig.label}</span>
                        </div>

                        {meeting.notes && (
                          <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                            Note: {meeting.notes}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {meeting.status === 'upcoming' && meeting.meetingLink && (
                          <button
                            onClick={() => window.open(meeting.meetingLink, '_blank')}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${isDarkMode
                              ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20'
                              : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                              }`}>
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Meeting</span>
                          </button>
                        )}

                        {meeting.status === 'upcoming' && (
                          <>
                            <button className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${isDarkMode
                              ? 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                              }`}>
                              <Edit className="w-3.5 h-3.5" />
                              <span>Reschedule</span>
                            </button>

                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to cancel this meeting?')) {
                                  setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, status: 'cancelled' } : m));
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${isDarkMode
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                                }`}>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          </>
                        )}

                        {meeting.status === 'completed' && (
                          <button className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${isDarkMode
                            ? 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                            }`}>
                            <Edit className="w-3.5 h-3.5" />
                            <span>Add Notes</span>
                          </button>
                        )}
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
