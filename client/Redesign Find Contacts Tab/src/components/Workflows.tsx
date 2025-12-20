import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Mail, 
  MessageSquare, 
  Linkedin,
  Calendar,
  Clock,
  TrendingUp,
  Zap,
  Settings,
  Play,
  Save
} from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
}

const CHANNELS: Channel[] = [
  { id: 'email', name: 'Email', icon: Mail, enabled: true },
  { id: 'sms', name: 'SMS', icon: MessageSquare, enabled: false },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, enabled: false },
];

const FREQUENCIES = [
  { id: 'week', label: 'Every week' },
  { id: '2weeks', label: 'Every 2 weeks' },
  { id: 'month', label: 'Every month' },
  { id: '2months', label: 'Every 2 months' },
  { id: '3months', label: 'Every 3 months' },
  { id: '6months', label: 'Every 6 months' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TIME_SLOTS = {
  morning: ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM'],
  afternoon: ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
  evening: ['5:00 PM', '6:00 PM', '7:00 PM'],
};

export function Workflows() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [channels, setChannels] = useState(CHANNELS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('week');
  const [selectedDay, setSelectedDay] = useState('Tue');
  const [selectedTime, setSelectedTime] = useState('2:00 PM');
  const [bestTime, setBestTime] = useState('Tuesday at 2:00 PM');

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

  const toggleChannel = (channelId: string) => {
    setChannels(prev => 
      prev.map(ch => 
        ch.id === channelId ? { ...ch, enabled: !ch.enabled } : ch
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

      <div className="max-w-6xl mx-auto p-4 space-y-4 relative z-10">
        
        {/* Page Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className={`relative group ${
              isDarkMode 
                ? 'bg-gradient-to-br from-purple-600 to-indigo-600' 
                : 'bg-gradient-to-br from-purple-500 to-indigo-500'
            } p-2 rounded-xl shadow-lg ${
              isDarkMode ? 'shadow-purple-500/30' : 'shadow-purple-500/20'
            }`}>
              <div className={`absolute -inset-1 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity ${
                isDarkMode ? 'bg-purple-500' : 'bg-purple-400'
              }`}></div>
              <Zap className="w-5 h-5 text-white relative z-10" />
            </div>
            <div>
              <h1 
                className="text-2xl font-bold"
                style={{ 
                  color: isDarkMode ? '#e9d5ff' : '#1f2937',
                  textShadow: isDarkMode ? '0 0 30px rgba(168, 85, 247, 0.3)' : 'none'
                }}
              >
                Create AI-Powered Workflows
              </h1>
              <p 
                className="text-xs mt-0.5"
                style={{ color: isDarkMode ? '#a78bfa' : '#6b7280' }}
              >
                Describe your automation and let AI design it onto
              </p>
            </div>
          </div>

          {/* AI Search Input */}
          <div className="relative mt-4">
            <div className={`absolute -inset-1 rounded-xl blur-lg opacity-20 ${
              isDarkMode ? 'bg-purple-600' : 'bg-purple-500'
            }`} />
            <div className="relative flex gap-2">
              <div className="flex-1 relative">
                <Sparkles className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find tech leads, send personalized email, wait 3 days, follow up if no reply..."
                  className={`w-full pl-10 pr-3 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 transition-all text-sm ${
                    isDarkMode
                      ? 'bg-gray-900/70 border-purple-500/40 focus:border-purple-400 focus:ring-purple-900/40 text-white placeholder:text-gray-500'
                      : 'bg-white border-purple-300 focus:border-purple-500 focus:ring-purple-200 text-gray-900 placeholder:text-gray-400'
                  } backdrop-blur-sm shadow-lg ${isDarkMode ? 'shadow-purple-900/20' : 'shadow-purple-500/10'}`}
                />
              </div>
              <button className={`px-5 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg text-sm ${
                isDarkMode
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-500/40 hover:scale-105'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-500/30 hover:scale-105'
              }`}>
                <Sparkles className="w-4 h-4" />
                Create
              </button>
            </div>
          </div>
        </div>

        {/* Outreach Channels */}
        <div className={`relative rounded-xl overflow-hidden transition-all duration-500 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-purple-950/50 via-indigo-950/40 to-purple-900/50 border-2 border-purple-500/30' 
            : 'bg-gradient-to-br from-white via-purple-50/50 to-indigo-50/40 border-2 border-purple-300/60'
        } backdrop-blur-xl shadow-xl ${isDarkMode ? 'shadow-purple-500/20' : 'shadow-purple-500/10'}`}>
          
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none transition-all duration-700 ${
            isDarkMode ? 'bg-purple-600/10' : 'bg-purple-400/20'
          }`} />
          
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className={`relative p-2 rounded-lg shadow-lg ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-600 shadow-purple-500/30' 
                  : 'bg-gradient-to-br from-purple-600 to-indigo-600 shadow-purple-500/20'
              }`}>
                <div className={`absolute -inset-1 rounded-lg blur-lg transition-opacity ${
                  isDarkMode ? 'bg-purple-500/40 opacity-50' : 'bg-purple-500/30 opacity-30'
                }`} />
                <Mail className="w-4 h-4 text-white relative z-10" />
              </div>
              <div>
                <h2 
                  className="font-bold text-base tracking-tight"
                  style={{ color: isDarkMode ? '#f3e8ff' : '#1f2937' }}
                >
                  Outreach Channels
                </h2>
                <p 
                  className="text-xs mt-0.5"
                  style={{ color: isDarkMode ? '#c4b5fd' : '#6b7280' }}
                >
                  Select which channels to use for this workflow
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {channels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <button
                    key={channel.id}
                    onClick={() => toggleChannel(channel.id)}
                    className={`relative group rounded-xl p-4 transition-all duration-500 transform hover:scale-105 active:scale-95 ${
                      channel.enabled
                        ? isDarkMode
                          ? 'bg-gradient-to-br from-purple-700/40 to-indigo-700/30 border-2 border-purple-400/60 shadow-xl shadow-purple-500/25'
                          : 'bg-gradient-to-br from-purple-200/60 to-indigo-200/50 border-2 border-purple-500 shadow-xl shadow-purple-500/15'
                        : isDarkMode
                          ? 'bg-gray-900/50 border-2 border-gray-700/60 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10'
                          : 'bg-white/80 border-2 border-gray-300 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10'
                    }`}
                  >
                    {channel.enabled && (
                      <div className={`absolute -inset-1 rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-all duration-500 ${
                        isDarkMode ? 'bg-purple-600' : 'bg-purple-500'
                      }`} />
                    )}
                    
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg transition-all duration-300 ${
                          channel.enabled
                            ? isDarkMode
                              ? 'bg-purple-500/40 shadow-md shadow-purple-500/25'
                              : 'bg-purple-500/30 shadow-md shadow-purple-500/15'
                            : isDarkMode
                              ? 'bg-gray-800/60'
                              : 'bg-gray-200/80'
                        }`}>
                          <Icon 
                            className={`w-5 h-5 transition-colors duration-300 ${
                              channel.enabled
                                ? isDarkMode ? 'text-purple-200' : 'text-purple-700'
                                : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`} 
                          />
                        </div>
                        <span 
                          className="font-semibold text-sm"
                          style={{ 
                            color: channel.enabled
                              ? isDarkMode ? '#f3e8ff' : '#1f2937'
                              : isDarkMode ? '#6b7280' : '#9ca3af'
                          }}
                        >
                          {channel.name}
                        </span>
                      </div>
                      
                      <div className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                        channel.enabled
                          ? isDarkMode 
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-500/30'
                            : 'bg-gradient-to-r from-purple-500 to-indigo-500 shadow-md shadow-purple-500/20'
                          : isDarkMode ? 'bg-gray-700/80' : 'bg-gray-300'
                      }`}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                          channel.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Schedule & Frequency */}
        <div className={`relative rounded-xl overflow-hidden transition-all duration-500 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-purple-950/50 via-indigo-950/40 to-purple-900/50 border-2 border-purple-500/30' 
            : 'bg-gradient-to-br from-white via-purple-50/50 to-indigo-50/40 border-2 border-purple-300/60'
        } backdrop-blur-xl shadow-xl ${isDarkMode ? 'shadow-purple-500/20' : 'shadow-purple-500/10'}`}>
          
          <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none transition-all duration-700 ${
            isDarkMode ? 'bg-indigo-600/10' : 'bg-indigo-400/20'
          }`} />
          
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className={`relative p-2 rounded-lg shadow-lg ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-600 shadow-purple-500/30' 
                  : 'bg-gradient-to-br from-purple-600 to-indigo-600 shadow-purple-500/20'
              }`}>
                <div className={`absolute -inset-1 rounded-lg blur-lg transition-opacity ${
                  isDarkMode ? 'bg-purple-500/40 opacity-50' : 'bg-purple-500/30 opacity-30'
                }`} />
                <Calendar className="w-4 h-4 text-white relative z-10" />
              </div>
              <div>
                <h2 
                  className="font-bold text-base tracking-tight"
                  style={{ color: isDarkMode ? '#f3e8ff' : '#1f2937' }}
                >
                  Schedule & Frequency
                </h2>
                <p 
                  className="text-xs mt-0.5"
                  style={{ color: isDarkMode ? '#c4b5fd' : '#6b7280' }}
                >
                  Configure when and how often to run this workflow
                </p>
              </div>
            </div>

            {/* Frequency Selection */}
            <div className="mb-4">
              <label 
                className="block text-xs font-semibold mb-2"
                style={{ color: isDarkMode ? '#f3e8ff' : '#374151' }}
              >
                How Often?
              </label>
              <div className="grid grid-cols-6 gap-2">
                {FREQUENCIES.map((freq) => (
                  <button
                    key={freq.id}
                    onClick={() => setSelectedFrequency(freq.id)}
                    className={`relative px-3 py-2 rounded-lg font-medium text-xs transition-all duration-300 ${
                      selectedFrequency === freq.id
                        ? isDarkMode
                          ? 'bg-gradient-to-br from-purple-700/50 to-indigo-700/40 border-2 border-purple-400/60 text-purple-200 shadow-lg shadow-purple-500/25'
                          : 'bg-gradient-to-br from-purple-200 to-indigo-200 border-2 border-purple-500 text-purple-900 shadow-lg shadow-purple-500/15'
                        : isDarkMode
                          ? 'bg-gray-900/50 border-2 border-gray-700/60 text-gray-400 hover:border-purple-500/40 hover:text-purple-300'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-purple-400 hover:text-purple-700'
                    } hover:scale-105 active:scale-95`}
                  >
                    {selectedFrequency === freq.id && (
                      <div className={`absolute -inset-1 rounded-lg blur-md opacity-10 ${
                        isDarkMode ? 'bg-purple-600' : 'bg-purple-500'
                      }`} />
                    )}
                    <span className="relative z-10">{freq.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Best Time Suggestion */}
            <div className={`relative mb-4 p-3 rounded-lg border-2 transition-all ${
              isDarkMode
                ? 'bg-gradient-to-br from-green-950/30 to-emerald-950/20 border-green-500/40 shadow-lg shadow-green-500/30'
                : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400'
            }`}>
              {isDarkMode && (
                <div className="absolute -inset-1 rounded-lg bg-green-500/20 blur-lg pointer-events-none" />
              )}
              <div className="flex items-start gap-2 relative z-10">
                <div className="relative">
                  <TrendingUp className={`w-4 h-4 relative z-10 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                  <div className={`absolute inset-0 rounded-full blur-sm ${
                    isDarkMode ? 'bg-green-400/30' : 'bg-green-500/20'
                  }`} />
                </div>
                <div className="flex-1">
                  <div 
                    className="font-semibold text-xs mb-0.5 antialiased"
                    style={{ 
                      color: isDarkMode ? '#86efac' : '#15803d',
                      WebkitFontSmoothing: 'antialiased',
                      MozOsxFontSmoothing: 'grayscale'
                    }}
                  >
                    Best Time: {bestTime}
                  </div>
                  <div 
                    className="text-xs antialiased"
                    style={{ 
                      color: isDarkMode ? '#6ee7b7' : '#166534',
                      WebkitFontSmoothing: 'antialiased',
                      MozOsxFontSmoothing: 'grayscale'
                    }}
                  >
                    3% engagement rate • 42+ leads analyzed
                  </div>
                </div>
              </div>
            </div>

            {/* Day Selection */}
            <div className="mb-4">
              <label 
                className="block text-xs font-semibold mb-2"
                style={{ color: isDarkMode ? '#f3e8ff' : '#374151' }}
              >
                Which Day?
              </label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`relative px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-300 ${
                      selectedDay === day
                        ? isDarkMode
                          ? 'bg-gradient-to-br from-purple-700/50 to-indigo-700/40 border-2 border-purple-400/60 text-purple-200 shadow-lg shadow-purple-500/25'
                          : 'bg-gradient-to-br from-purple-200 to-indigo-200 border-2 border-purple-500 text-purple-900 shadow-lg shadow-purple-500/15'
                        : isDarkMode
                          ? 'bg-gray-900/50 border-2 border-gray-700/60 text-gray-400 hover:border-purple-500/40 hover:text-purple-300'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-purple-400 hover:text-purple-700'
                    } hover:scale-105 active:scale-95`}
                  >
                    {selectedDay === day && (
                      <div className={`absolute -inset-1 rounded-lg blur-md opacity-10 ${
                        isDarkMode ? 'bg-purple-600' : 'bg-purple-500'
                      }`} />
                    )}
                    <span className="relative z-10">{day}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <label 
                className="block text-xs font-semibold mb-2"
                style={{ color: isDarkMode ? '#f3e8ff' : '#374151' }}
              >
                What Time?
              </label>
              
              {/* Morning */}
              <div className="mb-3">
                <div 
                  className="text-xs font-medium mb-1.5"
                  style={{ color: isDarkMode ? '#c4b5fd' : '#6b7280' }}
                >
                  Morning
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TIME_SLOTS.morning.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                        selectedTime === time
                          ? isDarkMode
                            ? 'bg-purple-600/40 border-2 border-purple-400/60 text-purple-200'
                            : 'bg-purple-200 border-2 border-purple-500 text-purple-900'
                          : isDarkMode
                            ? 'bg-gray-900/40 border border-gray-700/60 text-gray-400 hover:border-purple-500/40'
                            : 'bg-gray-100 border border-gray-300 text-gray-700 hover:border-purple-400'
                      } hover:scale-105 active:scale-95`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Afternoon */}
              <div className="mb-3">
                <div 
                  className="text-xs font-medium mb-1.5"
                  style={{ color: isDarkMode ? '#c4b5fd' : '#6b7280' }}
                >
                  Afternoon
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TIME_SLOTS.afternoon.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                        selectedTime === time
                          ? isDarkMode
                            ? 'bg-purple-600/40 border-2 border-purple-400/60 text-purple-200'
                            : 'bg-purple-200 border-2 border-purple-500 text-purple-900'
                          : isDarkMode
                            ? 'bg-gray-900/40 border border-gray-700/60 text-gray-400 hover:border-purple-500/40'
                            : 'bg-gray-100 border border-gray-300 text-gray-700 hover:border-purple-400'
                      } hover:scale-105 active:scale-95`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Evening */}
              <div>
                <div 
                  className="text-xs font-medium mb-1.5"
                  style={{ color: isDarkMode ? '#c4b5fd' : '#6b7280' }}
                >
                  Evening
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TIME_SLOTS.evening.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                        selectedTime === time
                          ? isDarkMode
                            ? 'bg-purple-600/40 border-2 border-purple-400/60 text-purple-200'
                            : 'bg-purple-200 border-2 border-purple-500 text-purple-900'
                          : isDarkMode
                            ? 'bg-gray-900/40 border border-gray-700/60 text-gray-400 hover:border-purple-500/40'
                            : 'bg-gray-100 border border-gray-300 text-gray-700 hover:border-purple-400'
                      } hover:scale-105 active:scale-95`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 text-sm ${
            isDarkMode
              ? 'bg-gray-900/60 border-2 border-gray-700/50 text-gray-300 hover:border-purple-500/30 hover:text-purple-300'
              : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-purple-400 hover:text-purple-700'
          } hover:scale-105 active:scale-95`}>
            <Save className="w-4 h-4" />
            Save as Draft
          </button>
          
          <button className={`relative px-6 py-2.5 rounded-lg font-bold transition-all duration-300 flex items-center gap-2 overflow-hidden group shadow-lg text-sm ${
            isDarkMode
              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-purple-500/40'
              : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-purple-500/30'
          } hover:scale-105 active:scale-95`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Play className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Activate Workflow</span>
          </button>
        </div>

      </div>
    </div>
  );
}