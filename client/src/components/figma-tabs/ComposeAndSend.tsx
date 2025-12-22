import { useState, useEffect, useMemo } from 'react';
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
import { WritingStyleModal } from './WritingStyleModal';
import { EmailVariants } from './EmailVariants';
import { AddContacts } from './AddContacts';
import { WRITING_STYLES, DEFAULT_ACTIVE_STYLES, MAX_ACTIVE_STYLES, type WritingStyleId } from '@shared/writing-styles';
import { useComposeQueries } from '@/components/compose/hooks/useComposeQueries';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Channel {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
}

// Email variant interface matching API response
export interface EmailVariant {
  subject: string;
  body: string;
  approach: string;
}

const CHANNELS: Channel[] = [
  { id: 'email', name: 'Email', icon: Mail, enabled: true },
  { id: 'sms', name: 'SMS', icon: MessageSquare, enabled: false },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, enabled: false },
];

export function ComposeAndSend() {
  const { toast } = useToast();
  const { variantDiversity, smsEnabled, linkedinEnabled } = useComposeQueries();

  // Writing styles management (3 default + 1 optional, max 4, then replace only)
  const [activeStyleIds, setActiveStyleIds] = useState<WritingStyleId[]>(DEFAULT_ACTIVE_STYLES);
  const [showAddStyleModal, setShowAddStyleModal] = useState(false);
  const [newStyleToAdd, setNewStyleToAdd] = useState<WritingStyleId | null>(null); // For replace flow: the new style selected first

  // Clear old localStorage and start fresh with 3 defaults
  // This ensures clean slate after the UI reorganization
  useEffect(() => {
    // Reset to 3 defaults (clears any stale data from before)
    localStorage.setItem('activeWritingStyles', JSON.stringify(DEFAULT_ACTIVE_STYLES));
    setActiveStyleIds([...DEFAULT_ACTIVE_STYLES]);
  }, []);

  // Save active styles to localStorage
  const saveActiveStyles = (styles: WritingStyleId[]) => {
    const unique = Array.from(new Set(styles)) as WritingStyleId[];
    const limited = unique.slice(0, MAX_ACTIVE_STYLES);
    setActiveStyleIds(limited);
    localStorage.setItem('activeWritingStyles', JSON.stringify(limited));
  };

  // Step 1: Select a new style to add (if at max, goes to replace flow)
  const selectNewStyle = (styleId: WritingStyleId) => {
    if (activeStyleIds.length < MAX_ACTIVE_STYLES) {
      // Under max: just add it
      saveActiveStyles([...activeStyleIds, styleId]);
      setShowAddStyleModal(false);
      setNewStyleToAdd(null);
    } else {
      // At max: set it as the new style, now user picks which to replace
      setNewStyleToAdd(styleId);
    }
  };

  // Step 2: Select which current style to replace with the new style
  const replaceWithNewStyle = (oldStyleId: WritingStyleId) => {
    if (newStyleToAdd) {
      const newStyles = activeStyleIds.map(id => id === oldStyleId ? newStyleToAdd : id);
      saveActiveStyles(newStyles);
    }
    // Close modal and reset
    setNewStyleToAdd(null);
    setShowAddStyleModal(false);
  };

  // Remove a writing style
  const removeStyle = (styleId: WritingStyleId) => {
    saveActiveStyles(activeStyleIds.filter(id => id !== styleId));
  };

  // Get available styles (not currently active)
  const availableStyles = useMemo(() => {
    return (Object.keys(WRITING_STYLES) as WritingStyleId[])
      .filter(id => !activeStyleIds.includes(id));
  }, [activeStyleIds]);

  // Convert active styles to array for rendering
  const writingStylesArray = useMemo(() => {
    return activeStyleIds
      .filter(id => WRITING_STYLES[id])
      .map(id => ({
        id,
        ...WRITING_STYLES[id]
      }));
  }, [activeStyleIds]);

  const [channels, setChannels] = useState(CHANNELS);
  const [message, setMessage] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<WritingStyleId>('professional-adult');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showWritingStyleModal, setShowWritingStyleModal] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showContacts, setShowContacts] = useState(false);
  const [variants, setVariants] = useState<EmailVariant[]>([]);

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

  const handleGenerate = async () => {
    if (!message.trim()) {
      toast({
        title: "Missing Message",
        description: "Please enter a base message.",
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    try {
      const data = await apiRequest<{ variants: EmailVariant[] }>('POST', '/api/emails/generate', {
        baseMessage: message,
        writingStyle: selectedStyle,
        variantDiversity: variantDiversity,
      });

      console.log('Generated variants:', data);

      // Store the generated variants
      setVariants(data.variants || []);
      setIsGenerating(false);
      setShowVariants(true);

      toast({
        title: "Variants Generated",
        description: `${data.variants?.length || 0} email variants created!`,
      });
    } catch (error) {
      console.error('Error generating variants:', error);
      setIsGenerating(false);
      toast({
        title: "Error",
        description: "Failed to generate variants. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/emails/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          baseMessage: message,
          writingStyle: selectedStyle,
          feedback: feedback,
          currentVariants: variants,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate variants');
      }

      const data = await response.json();
      console.log('Regenerated variants:', data);

      // Update with regenerated variants
      setVariants(data.variants || []);
      setFeedback(''); // Clear feedback after regeneration
      setIsGenerating(false);
    } catch (error) {
      console.error('Error regenerating variants:', error);
      setIsGenerating(false);
    }
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

        {/* Outreach Channels Section - Hidden when showing variants */}
        {!showVariants && (
          <div className={`relative rounded-xl overflow-hidden ${isDarkMode
            ? 'bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-purple-900/40 border border-purple-500/20'
            : 'bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 border border-purple-200/50'
            } backdrop-blur-xl shadow-xl ${isDarkMode ? 'shadow-purple-500/10' : 'shadow-purple-500/5'}`}>

            {/* Decorative gradient overlay */}
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none ${isDarkMode ? 'bg-purple-600/10' : 'bg-purple-300/20'
              }`} />

            <div className="relative p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className={`p-2 rounded-lg ${isDarkMode
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
                      className={`relative group rounded-xl p-4 transition-all duration-300 ${channel.enabled
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
                        <div className={`absolute -inset-1 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity ${isDarkMode ? 'bg-purple-500' : 'bg-purple-400'
                          }`} />
                      )}

                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${channel.enabled
                            ? isDarkMode
                              ? 'bg-purple-500/30'
                              : 'bg-purple-500/20'
                            : isDarkMode
                              ? 'bg-gray-800/50'
                              : 'bg-gray-100'
                            }`}>
                            <Icon
                              className={`w-5 h-5 ${channel.enabled
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
                        <div className={`relative w-11 h-6 rounded-full transition-colors ${channel.enabled
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                          : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                          }`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${channel.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                        </div>
                      </div>

                      {channel.enabled && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-500'
                            }`} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Compose Message Section - Hidden when showing variants */}
        {!showVariants && (
          <div className={`relative rounded-xl overflow-hidden ${isDarkMode
            ? 'bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-purple-900/40 border border-purple-500/20'
            : 'bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 border border-purple-200/50'
            } backdrop-blur-xl shadow-xl ${isDarkMode ? 'shadow-purple-500/10' : 'shadow-purple-500/5'}`}>

            {/* Decorative gradient overlay */}
            <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none ${isDarkMode ? 'bg-indigo-600/10' : 'bg-indigo-300/20'
              }`} />

            <div className="relative p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${isDarkMode
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
                  className={`w-full px-3 py-2.5 text-sm rounded-lg border-2 focus:outline-none focus:ring-2 transition-all resize-none ${isDarkMode
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
                  <button className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors ${isDarkMode
                    ? 'text-purple-300 hover:bg-purple-500/20 border border-purple-500/30'
                    : 'text-purple-600 hover:bg-purple-50 border border-purple-200'
                    }`}
                    onClick={() => setShowWritingStyleModal(true)}
                  >
                    <Plus className="w-3 h-3" />
                    Add Writing Rules
                  </button>
                </div>

                <div className="space-y-2.5">
                  {writingStylesArray.map((style) => (
                    <label
                      key={style.id}
                      className={`relative flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${selectedStyle === style.id
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
                        <div className={`absolute -inset-1 rounded-xl blur-lg opacity-20 transition-opacity ${isDarkMode ? 'bg-purple-600' : 'bg-purple-500'
                          }`} />
                      )}

                      {/* Pulse ring on hover */}
                      <div className={`absolute -inset-1 rounded-xl border-2 opacity-0 hover:opacity-100 transition-opacity duration-300 ${selectedStyle === style.id
                        ? isDarkMode ? 'border-purple-400/40' : 'border-purple-500/40'
                        : isDarkMode ? 'border-purple-500/30' : 'border-purple-400/30'
                        }`} />

                      <div className="relative">
                        <input
                          type="radio"
                          name="writing-style"
                          value={style.id}
                          checked={selectedStyle === style.id}
                          onChange={(e) => setSelectedStyle(e.target.value as WritingStyleId)}
                          className="mt-1 w-4 h-4 text-purple-600 focus:ring-purple-500 focus:ring-2 transition-all cursor-pointer"
                        />
                        {/* Radio button glow when selected */}
                        {selectedStyle === style.id && (
                          <div className={`absolute inset-0 rounded-full blur-md ${isDarkMode ? 'bg-purple-400/40' : 'bg-purple-500/30'
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
                          <CheckCircle2 className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'
                            }`} />
                        </div>
                      )}
                    </label>
                  ))}

                  {/* Add/Replace Writing Style Button */}
                  {availableStyles.length > 0 && (
                    <button
                      onClick={() => {
                        setNewStyleToAdd(null);
                        setShowAddStyleModal(true);
                      }}
                      className={`w-full p-4 rounded-xl border-2 border-dashed text-sm transition-all flex items-center justify-center gap-2 ${isDarkMode
                        ? 'border-white/20 text-gray-400 hover:border-purple-500/40 hover:bg-purple-950/30 hover:text-purple-300'
                        : 'border-gray-300 text-gray-600 hover:border-purple-400 hover:bg-purple-50/60 hover:text-purple-700'
                        }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>{activeStyleIds.length >= MAX_ACTIVE_STYLES ? 'Replace Writing Style' : 'Add Writing Style'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Add/Replace Writing Style Modal */}
              {showAddStyleModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className={`rounded-xl p-5 max-w-md w-full border ${isDarkMode
                    ? 'bg-[#0a0515] border-white/10'
                    : 'bg-white border-purple-200'
                    }`}>
                    <h3 className={`text-lg font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {newStyleToAdd
                        ? 'Which style to replace?'
                        : activeStyleIds.length >= MAX_ACTIVE_STYLES
                          ? 'Add a New Style'
                          : 'Add Writing Style'}
                    </h3>
                    <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {newStyleToAdd
                        ? `Select which current style to replace with "${WRITING_STYLES[newStyleToAdd].name}"`
                        : activeStyleIds.length >= MAX_ACTIVE_STYLES
                          ? 'Select the new style you want to add, then choose which current style to replace.'
                          : `Select a writing style to add (${activeStyleIds.length}/${MAX_ACTIVE_STYLES})`
                      }
                    </p>

                    {/* Step 2: After selecting new style, show current styles to pick which to replace */}
                    {newStyleToAdd ? (
                      <div className="space-y-2 mb-4">
                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Click a style to replace it with "{WRITING_STYLES[newStyleToAdd].name}":</p>
                        {activeStyleIds.map((styleId) => {
                          const style = WRITING_STYLES[styleId];
                          return (
                            <button
                              key={styleId}
                              onClick={() => replaceWithNewStyle(styleId)}
                              className={`w-full px-3 py-2.5 rounded-lg border text-left transition-all ${isDarkMode
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-red-500/20 hover:border-red-500/30'
                                : 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-red-50 hover:border-red-300'
                                }`}
                            >
                              <div className="font-medium text-sm">{style.name}</div>
                              <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-purple-400/70' : 'text-purple-600/70'}`}>
                                {style.description}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      /* Step 1: Show available styles to add */
                      <div className="space-y-2 mb-4 max-h-[60vh] overflow-y-auto">
                        {availableStyles.map((styleId) => {
                          const style = WRITING_STYLES[styleId];
                          return (
                            <button
                              key={styleId}
                              onClick={() => selectNewStyle(styleId)}
                              className={`w-full px-3 py-2.5 rounded-lg border text-left transition-all ${isDarkMode
                                ? 'bg-white/5 text-gray-300 border-white/10 hover:bg-purple-500/20 hover:border-purple-500/30'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-purple-50 hover:border-purple-300'
                                }`}
                            >
                              <div className="font-medium text-sm">{style.name}</div>
                              <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                {style.description}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setShowAddStyleModal(false);
                        setNewStyleToAdd(null);
                      }}
                      className={`w-full px-4 py-2 rounded-lg text-sm transition-all ${isDarkMode
                        ? 'bg-white/10 text-gray-300 hover:bg-white/15'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!message.trim() || isGenerating}
                className={`relative w-full py-3 px-5 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden group/btn text-sm ${!message.trim() || isGenerating
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
                  {isGenerating ? 'Generating Variants...' : 'Generate 3 Email Variants'}
                </span>
              </button>

              {/* Info tip */}
              <div className={`mt-3 flex items-start gap-2 p-2.5 rounded-lg ${isDarkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
                }`}>
                <Info className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'
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
        )}

        {/* Email Variants Section */}
        {showVariants && (
          <EmailVariants
            isDarkMode={isDarkMode}
            selectedVariant={selectedVariant}
            setSelectedVariant={setSelectedVariant}
            feedback={feedback}
            setFeedback={setFeedback}
            variants={variants}
            onRegenerate={handleRegenerate}
            isRegenerating={isGenerating}
          />
        )}

        {/* Add Contacts Section - Shows after variant is selected */}
        {selectedVariant !== null && (
          <AddContacts isDarkMode={isDarkMode} />
        )}
      </div>

      {/* Writing Style Modal */}
      <WritingStyleModal
        isOpen={showWritingStyleModal}
        onClose={() => setShowWritingStyleModal(false)}
        isDarkMode={isDarkMode}
        activeStyleIds={activeStyleIds}
        onAddStyle={selectNewStyle}
        onRemoveStyle={removeStyle}
        maxStyles={MAX_ACTIVE_STYLES}
      />
    </div>
  );
}