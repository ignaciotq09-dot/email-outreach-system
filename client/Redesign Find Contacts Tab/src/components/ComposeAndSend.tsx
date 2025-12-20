import { useState, useEffect } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Linkedin, 
  Sparkles, 
  Plus,
  Wand2,
  CheckCircle2,
  ChevronDown,
  Info
} from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
}

interface WritingStyle {
  id: string;
  name: string;
  description: string;
}

const CHANNELS: Channel[] = [
  { id: 'email', name: 'Email', icon: Mail, enabled: true },
  { id: 'sms', name: 'SMS', icon: MessageSquare, enabled: false },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, enabled: false },
];

const WRITING_STYLES: WritingStyle[] = [
  { id: 'professional', name: 'Professional & Adult-like', description: 'Confident, direct, assertive sales-first' },
  { id: 'inspiring', name: 'Inspiring & Uplifting', description: 'Positive, enthusiastic, and focuses on possibilities' },
  { id: 'poetic', name: 'Poetic & Lyrical', description: 'Evocative metaphors with vivid imagery' },
  { id: 'technical', name: 'Passive & Technical', description: 'Emphasizing complex, off-phrase terminology' },
];

export function ComposeAndSend() {
  const [channels, setChannels] = useState(CHANNELS);
  const [message, setMessage] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className={`h-full overflow-auto ${isDarkMode ? 'bg-[#0a0515]' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        
        {/* Page Header */}
        <div className="mb-4">
          <h1 
            className="text-2xl font-bold mb-1"
            style={{ color: isDarkMode ? '#e9d5ff' : '#1f2937' }}
          >
            Compose & Send
          </h1>
          <p 
            className="text-xs"
            style={{ color: isDarkMode ? '#a78bfa' : '#6b7280' }}
          >
            Create AI-powered outreach messages across multiple channels
          </p>
        </div>

        {/* Outreach Channels Section */}
        <div className={`relative rounded-xl overflow-hidden ${
          isDarkMode 
            ? 'bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-purple-900/40 border border-purple-500/20' 
            : 'bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 border border-purple-200/50'
        } backdrop-blur-xl shadow-xl ${isDarkMode ? 'shadow-purple-500/10' : 'shadow-purple-500/5'}`}>
          
          {/* Decorative gradient overlay */}
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none ${
            isDarkMode ? 'bg-purple-600/10' : 'bg-purple-300/20'
          }`} />
          
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className={`p-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-500' 
                  : 'bg-gradient-to-br from-purple-600 to-indigo-600'
              } shadow-lg shadow-purple-500/30`}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 
                className="font-semibold text-base"
                style={{ color: isDarkMode ? '#e9d5ff' : '#1f2937' }}
              >
                Outreach Channels
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {channels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <button
                    key={channel.id}
                    onClick={() => toggleChannel(channel.id)}
                    className={`relative group rounded-xl p-4 transition-all duration-300 ${
                      channel.enabled
                        ? isDarkMode
                          ? 'bg-gradient-to-br from-purple-600/30 to-indigo-600/20 border-2 border-purple-400/50 shadow-lg shadow-purple-500/20'
                          : 'bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-purple-400 shadow-lg shadow-purple-500/10'
                        : isDarkMode
                          ? 'bg-gray-900/40 border-2 border-gray-700/50 hover:border-purple-500/30'
                          : 'bg-white border-2 border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {/* Glow effect when enabled */}
                    {channel.enabled && (
                      <div className={`absolute -inset-1 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity ${
                        isDarkMode ? 'bg-purple-500' : 'bg-purple-400'
                      }`} />
                    )}
                    
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${
                          channel.enabled
                            ? isDarkMode
                              ? 'bg-purple-500/30'
                              : 'bg-purple-500/20'
                            : isDarkMode
                              ? 'bg-gray-800/50'
                              : 'bg-gray-100'
                        }`}>
                          <Icon 
                            className={`w-5 h-5 ${
                              channel.enabled
                                ? isDarkMode ? 'text-purple-300' : 'text-purple-600'
                                : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`} 
                          />
                        </div>
                        <span 
                          className="font-medium text-sm"
                          style={{ 
                            color: channel.enabled
                              ? isDarkMode ? '#e9d5ff' : '#1f2937'
                              : isDarkMode ? '#6b7280' : '#9ca3af'
                          }}
                        >
                          {channel.name}
                        </span>
                      </div>
                      
                      {/* Toggle indicator */}
                      <div className={`relative w-11 h-6 rounded-full transition-colors ${
                        channel.enabled
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                          : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                          channel.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </div>
                    </div>
                    
                    {channel.enabled && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className={`w-4 h-4 ${
                          isDarkMode ? 'text-green-400' : 'text-green-500'
                        }`} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Compose Message Section */}
        <div className={`relative rounded-xl overflow-hidden ${
          isDarkMode 
            ? 'bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-purple-900/40 border border-purple-500/20' 
            : 'bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 border border-purple-200/50'
        } backdrop-blur-xl shadow-xl ${isDarkMode ? 'shadow-purple-500/10' : 'shadow-purple-500/5'}`}>
          
          {/* Decorative gradient overlay */}
          <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none ${
            isDarkMode ? 'bg-indigo-600/10' : 'bg-indigo-300/20'
          }`} />
          
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-500' 
                  : 'bg-gradient-to-br from-purple-600 to-indigo-600'
              } shadow-lg shadow-purple-500/30`}>
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              <h2 
                className="font-semibold text-base"
                style={{ color: isDarkMode ? '#e9d5ff' : '#1f2937' }}
              >
                Step 1: Compose Your Message
              </h2>
            </div>

            <p 
              className="text-xs mb-4 ml-10"
              style={{ color: isDarkMode ? '#a78bfa' : '#6b7280' }}
            >
              Write your message here. AI will generate 3 different variants.
            </p>

            {/* Base Message */}
            <div className="mb-4">
              <label 
                className="block text-xs font-medium mb-2"
                style={{ color: isDarkMode ? '#e9d5ff' : '#374151' }}
              >
                Base Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here. AI will generate 3 different variants..."
                rows={6}
                className={`w-full px-3 py-2.5 text-sm rounded-lg border-2 focus:outline-none focus:ring-2 transition-all resize-none ${
                  isDarkMode
                    ? 'bg-gray-900/60 border-purple-500/30 focus:border-purple-400 focus:ring-purple-900/30 text-white placeholder:text-gray-500'
                    : 'bg-white border-purple-200 focus:border-purple-400 focus:ring-purple-100 text-gray-900 placeholder:text-gray-400'
                } backdrop-blur-sm`}
              />
            </div>

            {/* Writing Style */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label 
                  className="text-xs font-medium"
                  style={{ color: isDarkMode ? '#e9d5ff' : '#374151' }}
                >
                  Writing Style
                </label>
                <button className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-purple-300 hover:bg-purple-500/20 border border-purple-500/30' 
                    : 'text-purple-600 hover:bg-purple-50 border border-purple-200'
                }`}>
                  <Plus className="w-3 h-3" />
                  Add Writing Rules
                </button>
              </div>

              <div className="space-y-2.5">
                {WRITING_STYLES.map((style) => (
                  <label
                    key={style.id}
                    className={`relative flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                      selectedStyle === style.id
                        ? isDarkMode
                          ? 'bg-gradient-to-br from-purple-700/40 to-indigo-700/30 border-purple-400/60 shadow-xl shadow-purple-500/25 scale-[1.01]'
                          : 'bg-gradient-to-br from-purple-100 to-indigo-100 border-purple-500 shadow-xl shadow-purple-500/15 scale-[1.01]'
                        : isDarkMode
                          ? 'bg-gray-900/40 border-gray-700/60 hover:border-purple-500/40 hover:bg-purple-950/30 hover:shadow-md hover:shadow-purple-500/10'
                          : 'bg-white/80 border-gray-300 hover:border-purple-400 hover:bg-purple-50/60 hover:shadow-lg hover:shadow-purple-500/10'
                    } hover:scale-[1.005] active:scale-[0.995]`}
                  >
                    {/* Outer glow when selected */}
                    {selectedStyle === style.id && (
                      <div className={`absolute -inset-1 rounded-xl blur-lg opacity-20 transition-opacity ${
                        isDarkMode ? 'bg-purple-600' : 'bg-purple-500'
                      }`} />
                    )}
                    
                    {/* Pulse ring on hover */}
                    <div className={`absolute -inset-1 rounded-xl border-2 opacity-0 hover:opacity-100 transition-opacity duration-300 ${
                      selectedStyle === style.id 
                        ? isDarkMode ? 'border-purple-400/40' : 'border-purple-500/40'
                        : isDarkMode ? 'border-purple-500/30' : 'border-purple-400/30'
                    }`} />
                    
                    <div className="relative">
                      <input
                        type="radio"
                        name="writing-style"
                        value={style.id}
                        checked={selectedStyle === style.id}
                        onChange={(e) => setSelectedStyle(e.target.value)}
                        className="mt-1 w-4 h-4 text-purple-600 focus:ring-purple-500 focus:ring-2 transition-all cursor-pointer"
                      />
                      {/* Radio button glow when selected */}
                      {selectedStyle === style.id && (
                        <div className={`absolute inset-0 rounded-full blur-md ${
                          isDarkMode ? 'bg-purple-400/40' : 'bg-purple-500/30'
                        }`} />
                      )}
                    </div>
                    
                    <div className="flex-1 relative z-10">
                      <div 
                        className="font-semibold mb-1 text-sm"
                        style={{ color: isDarkMode ? '#f3e8ff' : '#1f2937' }}
                      >
                        {style.name}
                      </div>
                      <div 
                        className="text-xs leading-relaxed"
                        style={{ color: isDarkMode ? '#c4b5fd' : '#6b7280' }}
                      >
                        {style.description}
                      </div>
                    </div>
                    
                    {/* Selected checkmark indicator */}
                    {selectedStyle === style.id && (
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <CheckCircle2 className={`w-4 h-4 ${
                          isDarkMode ? 'text-purple-400' : 'text-purple-600'
                        }`} />
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!message.trim() || isGenerating}
              className={`relative w-full py-3 px-5 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden group/btn text-sm ${
                !message.trim() || isGenerating
                  ? isDarkMode
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
              }`}
            >
              {/* Shine effect */}
              {message.trim() && !isGenerating && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              )}
              
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span className="relative z-10">
                {isGenerating ? 'Generating Variants...' : 'Generate 5 Email Variants'}
              </span>
            </button>

            {/* Info tip */}
            <div className={`mt-3 flex items-start gap-2 p-2.5 rounded-lg ${
              isDarkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
            }`}>
              <Info className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <p 
                className="text-xs"
                style={{ color: isDarkMode ? '#93c5fd' : '#2563eb' }}
              >
                AI will analyze your message and generate 5 unique variants based on the selected writing style. Each variant will maintain your core message while adapting the tone and style.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
