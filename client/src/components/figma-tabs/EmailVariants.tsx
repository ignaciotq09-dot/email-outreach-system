import { CheckCircle2, Edit3, RotateCcw, Loader2 } from 'lucide-react';
import { useRef } from 'react';
import type { EmailVariant } from './ComposeAndSend';

interface EmailVariantsProps {
  isDarkMode: boolean;
  selectedVariant: number | null;
  setSelectedVariant: (variant: number) => void;
  feedback: string;
  setFeedback: (feedback: string) => void;
  variants: EmailVariant[];
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export function EmailVariants({
  isDarkMode,
  selectedVariant,
  setSelectedVariant,
  feedback,
  setFeedback,
  variants,
  onRegenerate,
  isRegenerating,
}: EmailVariantsProps) {
  const contactsSectionRef = useRef<HTMLDivElement>(null);

  const handleSelectVariant = (variant: number) => {
    setSelectedVariant(variant);

    // Scroll to contacts section after a short delay
    setTimeout(() => {
      const contactsSection = document.querySelector('[data-contacts-section]');
      if (contactsSection) {
        contactsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  };

  return (
    <div
      className={`relative rounded-xl overflow-hidden ${isDarkMode
          ? 'bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-purple-900/40 border border-purple-500/20'
          : 'bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 border border-purple-200/50'
        } backdrop-blur-xl shadow-xl ${isDarkMode ? 'shadow-purple-500/10' : 'shadow-purple-500/5'}`}
      style={{ animation: 'slide-up 0.4s ease-out' }}
    >
      {/* Decorative gradient overlay */}
      <div
        className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none ${isDarkMode ? 'bg-purple-600/10' : 'bg-purple-300/20'
          }`}
      />

      <div className="relative p-5">
        <div className="mb-5">
          <h2
            className="text-base font-semibold mb-1"
            style={{ color: isDarkMode ? '#e9d5ff' : '#1f2937' }}
          >
            Step 2: Choose Your Favorite Email Variant
          </h2>
        </div>

        {/* Variant Cards - Dynamic rendering from API */}
        <div className="space-y-4">
          {variants.length === 0 ? (
            <div className={`p-8 text-center rounded-xl border ${isDarkMode ? 'bg-white/[0.05] border-white/10' : 'bg-gray-50 border-gray-200'
              }`}>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                No variants generated yet. Please go back and generate variants.
              </p>
            </div>
          ) : (
            variants.map((variant, index) => (
              <div
                key={index}
                className={`relative p-5 rounded-xl border-2 transition-all duration-300 ${selectedVariant === index + 1
                    ? isDarkMode
                      ? 'bg-gradient-to-br from-purple-700/30 to-indigo-700/20 border-purple-400/60 shadow-lg shadow-purple-500/20'
                      : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-400 shadow-lg shadow-purple-500/10'
                    : isDarkMode
                      ? 'bg-white/[0.05] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3
                      className={`text-base mb-0.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {variant.approach || `Variant ${index + 1}`}
                    </h3>
                    <p
                      className={`text-xs ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}
                    >
                      Variant {index + 1}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectVariant(index + 1)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 ${selectedVariant === index + 1
                        ? isDarkMode
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'bg-green-50 text-green-700 border border-green-500'
                        : isDarkMode
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 hover:shadow-lg hover:shadow-purple-500/30'
                          : 'bg-purple-500 text-white border border-purple-500 hover:bg-purple-600 hover:shadow-lg'
                      }`}
                  >
                    {selectedVariant === index + 1 && <CheckCircle2 className="w-4 h-4" />}
                    {selectedVariant === index + 1 ? 'Selected' : 'Select'}
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <p
                      className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Subject:
                    </p>
                    <p
                      className={`text-sm ${isDarkMode ? 'text-purple-200' : 'text-purple-900'}`}
                    >
                      {variant.subject}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Body:
                    </p>
                    <p
                      className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {variant.body}
                    </p>
                  </div>
                </div>

                <button
                  className={`mt-3 text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 ${isDarkMode
                      ? 'bg-white/5 text-purple-300 border border-white/10 hover:bg-white/10'
                      : 'bg-gray-100 text-purple-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                >
                  <Edit3 className="w-3 h-3" />
                  Edit This Variant
                </button>
              </div>
            ))
          )}
        </div>

        {/* Feedback Section */}
        <div
          className={`mt-5 p-4 rounded-xl border ${isDarkMode ? 'bg-white/[0.05] border-white/10' : 'bg-gray-50 border-gray-200'
            }`}
        >
          <p
            className={`text-sm mb-2.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Not happy with these? Give feedback and regenerate
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="E.g., 'Make it more casual', 'Add more details about benefits', 'Shorter subject lines'..."
            rows={3}
            className={`w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-all resize-none mb-2.5 ${isDarkMode
                ? 'bg-gray-900/60 border-white/10 focus:border-purple-400 focus:ring-purple-900/30 text-white placeholder:text-gray-500'
                : 'bg-white border-gray-200 focus:border-purple-400 focus:ring-purple-100 text-gray-900 placeholder:text-gray-400'
              }`}
          />
          <button
            onClick={onRegenerate}
            disabled={isRegenerating || !feedback.trim()}
            className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${isRegenerating || !feedback.trim()
                ? isDarkMode
                  ? 'bg-gray-700 text-gray-500 border border-gray-600 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 active:scale-95'
                  : 'bg-purple-500 text-white border border-purple-500 hover:bg-purple-600 hover:shadow-lg hover:scale-105 active:scale-95'
              }`}
          >
            {isRegenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Regenerate with feedback
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}