import { useState, useEffect } from 'react';
import {
  Sparkles,
  Check,
  Save,
  Plus
} from 'lucide-react';
import { WRITING_STYLES, DEFAULT_ACTIVE_STYLES, MAX_ACTIVE_STYLES, type WritingStyleId } from '@shared/writing-styles';

export function Personalize() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAIActive, setIsAIActive] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'writing-style' | 'email-examples'>('writing-style');
  const [writingStyle, setWritingStyle] = useState("Example: Write casually like 'I'm talking to a friend'. Keep sentences clear. Never use corporate buzzwords. Start with something personal before getting to the point.");
  const [characterCount, setCharacterCount] = useState(164);

  // Tone settings
  const [formality, setFormality] = useState(5);
  const [warmth, setWarmth] = useState(5);
  const [directness, setDirectness] = useState(5);
  const [variantDiversity, setVariantDiversity] = useState(5);

  // Writing styles state
  const [activeStyles, setActiveStyles] = useState<WritingStyleId[]>(DEFAULT_ACTIVE_STYLES);
  const [showAddStylesModal, setShowAddStylesModal] = useState(false);

  // Load active styles from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('activeWritingStyles');
      if (saved) {
        setActiveStyles(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load active writing styles:', e);
    }
  }, []);

  // Save active styles to localStorage
  const saveActiveStyles = (styles: WritingStyleId[]) => {
    setActiveStyles(styles);
    localStorage.setItem('activeWritingStyles', JSON.stringify(styles));
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

  const handleWritingStyleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setWritingStyle(text);
    setCharacterCount(text.length);
  };

  const toggleWritingStyle = (styleId: WritingStyleId) => {
    if (activeStyles.includes(styleId)) {
      // Remove style
      saveActiveStyles(activeStyles.filter(id => id !== styleId));
    } else {
      // Add style (if under max limit)
      if (activeStyles.length < MAX_ACTIVE_STYLES) {
        saveActiveStyles([...activeStyles, styleId]);
      }
    }
  };

  const addAdditionalStyle = (styleId: WritingStyleId) => {
    if (activeStyles.length < MAX_ACTIVE_STYLES && !activeStyles.includes(styleId)) {
      saveActiveStyles([...activeStyles, styleId]);
      setShowAddStylesModal(false);
    }
  };

  // Get available additional styles (not currently active)
  const availableAdditionalStyles = (Object.keys(WRITING_STYLES) as WritingStyleId[])
    .filter(id => WRITING_STYLES[id].category === 'additional' && !activeStyles.includes(id));

  const getFormalityLabel = (value: number) => {
    if (value <= 3) return 'Casual';
    if (value <= 7) return 'Balanced';
    return 'Formal';
  };

  const getWarmthLabel = (value: number) => {
    if (value <= 3) return 'Cool';
    if (value <= 7) return 'Warm';
    return 'Very warm';
  };

  const getDirectnessLabel = (value: number) => {
    if (value <= 3) return 'Subtle';
    if (value <= 7) return 'Balanced';
    return 'Direct';
  };

  const getVariantLabel = (value: number) => {
    if (value <= 3) return 'Same';
    if (value <= 7) return 'Moderate variety';
    return 'Different';
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

      <div className="max-w-4xl mx-auto p-4 space-y-3 relative z-10">

        {/* Page Header with AI Toggle */}
        <div className={`rounded-xl p-4 border ${isDarkMode
          ? 'bg-white/5 backdrop-blur-xl border-white/10'
          : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
          }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-500/10' : 'bg-purple-100'
                }`}>
                <Sparkles className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <div>
                <h1 className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  AI Personalization
                </h1>
                <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Tell the AI how you want your emails written
                </p>
              </div>
            </div>

            {/* AI Toggle */}
            <button
              onClick={() => setIsAIActive(!isAIActive)}
              className={`relative w-14 h-7 rounded-full transition-all ${isAIActive
                ? isDarkMode
                  ? 'bg-purple-500/30 border-2 border-purple-500/50'
                  : 'bg-purple-500 border-2 border-purple-500'
                : isDarkMode
                  ? 'bg-white/10 border-2 border-white/20'
                  : 'bg-gray-300 border-2 border-gray-300'
                }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-lg flex items-center justify-center ${isAIActive ? 'translate-x-7' : 'translate-x-0'
                  }`}
              >
                {isAIActive && (
                  <Check className="w-3 h-3 text-purple-600" />
                )}
              </div>
            </button>
          </div>

          {isAIActive && (
            <div className={`mt-2.5 px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${isDarkMode
              ? 'bg-green-500/10 text-green-300 border border-green-500/30'
              : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
              <Check className="w-3.5 h-3.5" />
              <span>Active</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className={`rounded-xl p-3 border ${isDarkMode
          ? 'bg-white/5 backdrop-blur-xl border-white/10'
          : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
          }`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTab('writing-style')}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${selectedTab === 'writing-style'
                ? isDarkMode
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-purple-100 text-purple-700 border border-purple-300'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              Your Writing Style
            </button>

            <button
              onClick={() => setSelectedTab('email-examples')}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${selectedTab === 'email-examples'
                ? isDarkMode
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-purple-100 text-purple-700 border border-purple-300'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              Email Examples (Optional)
            </button>
          </div>
        </div>

        {/* Writing Style Section */}
        {selectedTab === 'writing-style' && (
          <>
            {/* Writing Style Text Area */}
            <div className={`rounded-xl p-4 border ${isDarkMode
              ? 'bg-white/5 backdrop-blur-xl border-white/10'
              : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
              }`}>
              <div className="mb-2.5">
                <h2 className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Describe how you want your emails to sound
                </h2>
              </div>

              <textarea
                value={writingStyle}
                onChange={handleWritingStyleChange}
                rows={5}
                className={`w-full p-3 rounded-lg text-sm border outline-none resize-none ${isDarkMode
                  ? 'bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                  }`}
                placeholder="Example: Write casually like 'I'm talking to a friend'. Keep sentences clear. Never use corporate buzzwords. Start with something personal before getting to the point."
              />

              <div className={`mt-1.5 text-xs text-right ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {characterCount}/2500 characters
              </div>
            </div>

            {/* Active Writing Styles */}
            <div className={`rounded-xl p-4 border ${isDarkMode
                ? 'bg-white/5 backdrop-blur-xl border-white/10'
                : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
              }`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Active Writing Styles
                </h2>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {activeStyles.length}/{MAX_ACTIVE_STYLES}
                </span>
              </div>

              <div className="space-y-2">
                {activeStyles.map((styleId) => {
                  const style = WRITING_STYLES[styleId];
                  return (
                    <div
                      key={styleId}
                      className={`px-3 py-2.5 rounded-lg border ${isDarkMode
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-purple-100 text-purple-700 border-purple-300'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{style.name}</div>
                          <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-purple-400/70' : 'text-purple-600/70'}`}>
                            {style.description}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleWritingStyle(styleId)}
                          className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors ${isDarkMode
                              ? 'hover:bg-purple-500/30'
                              : 'hover:bg-purple-200'
                            }`}
                          title="Remove style"
                        >
                          <span className="text-lg leading-none">×</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add Writing Styles Button */}
                {activeStyles.length < MAX_ACTIVE_STYLES && availableAdditionalStyles.length > 0 && (
                  <button
                    onClick={() => setShowAddStylesModal(true)}
                    className={`w-full px-3 py-2.5 rounded-lg border-2 border-dashed text-sm transition-all flex items-center justify-center gap-2 ${isDarkMode
                        ? 'border-white/20 text-gray-400 hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300'
                        : 'border-gray-300 text-gray-600 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700'
                      }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Writing Styles</span>
                  </button>
                )}
              </div>

              {/* Add Styles Modal */}
              {showAddStylesModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className={`rounded-xl p-5 max-w-md w-full border ${isDarkMode
                      ? 'bg-[#0a0515] border-white/10'
                      : 'bg-white border-purple-200'
                    }`}>
                    <h3 className={`text-lg font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Add Writing Styles
                    </h3>
                    <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Select writing styles to add (maximum {MAX_ACTIVE_STYLES} active styles)
                    </p>

                    <div className="space-y-2 mb-4 max-h-[60vh] overflow-y-auto">
                      {availableAdditionalStyles.map((styleId) => {
                        const style = WRITING_STYLES[styleId];
                        return (
                          <button
                            key={styleId}
                            onClick={() => addAdditionalStyle(styleId)}
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

                    <button
                      onClick={() => setShowAddStylesModal(false)}
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
            </div>

            {/* Tone Settings */}
            <div className={`rounded-xl p-4 border ${isDarkMode
              ? 'bg-white/5 backdrop-blur-xl border-white/10'
              : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
              }`}>
              <div className="mb-3">
                <h2 className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Tone Settings
                </h2>
                <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Fine-tune your email creativity
                </p>
              </div>

              <div className="space-y-4">
                {/* Formality */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Formality
                    </label>
                    <span className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      {getFormalityLabel(formality)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Casual
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={formality}
                      onChange={(e) => setFormality(Number(e.target.value))}
                      className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${isDarkMode ? '#7C3AED' : '#7C3AED'} 0%, ${isDarkMode ? '#7C3AED' : '#7C3AED'} ${formality * 10}%, ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'} ${formality * 10}%, ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'} 100%)`
                      }}
                    />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Formal
                    </span>
                  </div>
                </div>

                {/* Warmth */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Warmth
                    </label>
                    <span className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      {getWarmthLabel(warmth)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Cool
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={warmth}
                      onChange={(e) => setWarmth(Number(e.target.value))}
                      className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${isDarkMode ? '#7C3AED' : '#7C3AED'} 0%, ${isDarkMode ? '#7C3AED' : '#7C3AED'} ${warmth * 10}%, ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'} ${warmth * 10}%, ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'} 100%)`
                      }}
                    />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Very warm
                    </span>
                  </div>
                </div>

                {/* Directness */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Directness
                    </label>
                    <span className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      {getDirectnessLabel(directness)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Subtle
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={directness}
                      onChange={(e) => setDirectness(Number(e.target.value))}
                      className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${isDarkMode ? '#7C3AED' : '#7C3AED'} 0%, ${isDarkMode ? '#7C3AED' : '#7C3AED'} ${directness * 10}%, ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'} ${directness * 10}%, ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'} 100%)`
                      }}
                    />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Direct
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Variant Diversity */}
            <div className={`rounded-xl p-4 border ${isDarkMode
              ? 'bg-white/5 backdrop-blur-xl border-white/10'
              : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
              }`}>
              <div className="mb-3">
                <h2 className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Variant Diversity
                </h2>
                <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  How different should the 3 generated email variants be from each other?
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Variety
                  </label>
                  <span className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {getVariantLabel(variantDiversity)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Same
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={variantDiversity}
                    onChange={(e) => setVariantDiversity(Number(e.target.value))}
                    className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${isDarkMode ? '#7C3AED' : '#7C3AED'} 0%, ${isDarkMode ? '#7C3AED' : '#7C3AED'} ${variantDiversity * 10}%, ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'} ${variantDiversity * 10}%, ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'} 100%)`
                    }}
                  />
                  <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Different
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button className={`w-full px-5 py-2.5 rounded-lg text-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 ${isDarkMode
              ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30 hover:border-purple-500/50'
              : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600'
              }`}>
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </>
        )}

        {/* Email Examples Tab (Placeholder) */}
        {selectedTab === 'email-examples' && (
          <div className={`rounded-xl p-8 border text-center ${isDarkMode
            ? 'bg-white/5 backdrop-blur-xl border-white/10'
            : 'bg-white/80 backdrop-blur-xl border-purple-200/50'
            }`}>
            <Sparkles className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <h2 className={`text-xl mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Email Examples (Coming Soon)
            </h2>
            <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Upload example emails to help AI learn your writing style
            </p>
          </div>
        )}
      </div>
    </div>
  );
}