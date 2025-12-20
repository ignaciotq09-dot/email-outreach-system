import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface WritingStyleOption {
  id: string;
  name: string;
  description: string;
  added: boolean;
}

interface WritingStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const PRESET_STYLES: WritingStyleOption[] = [
  {
    id: 'professional-humble',
    name: 'Professional & Humble',
    description: 'Learning, scientific, curious, asks questions',
    added: false,
  },
  {
    id: 'friendly-conversational',
    name: 'Friendly & Conversational',
    description: 'Warm, approachable tone like talking to a colleague',
    added: false,
  },
  {
    id: 'thoughtful-educated',
    name: 'Thoughtful & Educated',
    description: 'Well-researched tone with thoughtful analysis',
    added: false,
  },
  {
    id: 'strong-confident',
    name: 'Strong & Confident',
    description: 'Strong leadership voice with confident directives',
    added: false,
  },
];

export function WritingStyleModal({ isOpen, onClose, isDarkMode }: WritingStyleModalProps) {
  const [styles, setStyles] = useState(PRESET_STYLES);
  const [addedCount, setAddedCount] = useState(0);

  if (!isOpen) return null;

  const handleToggleStyle = (id: string) => {
    setStyles((prev) =>
      prev.map((style) => {
        if (style.id === id) {
          const newAddedState = !style.added;
          if (newAddedState && addedCount >= 4) {
            return style; // Don't add if already at max
          }
          setAddedCount((count) => (newAddedState ? count + 1 : count - 1));
          return { ...style, added: newAddedState };
        }
        return style;
      })
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        style={{ animation: 'fade-in 0.2s ease-out' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4"
        style={{ animation: 'scale-in 0.2s ease-out' }}
      >
        <div
          className={`rounded-2xl border shadow-2xl overflow-hidden ${
            isDarkMode
              ? 'bg-[#1a0f2e]/95 backdrop-blur-xl border-purple-500/30 shadow-purple-500/20'
              : 'bg-white/95 backdrop-blur-xl border-purple-200/50 shadow-purple-500/10'
          }`}
        >
          {/* Header */}
          <div
            className={`px-6 py-4 border-b ${
              isDarkMode ? 'border-white/10' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2
                  className={`text-xl ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Add Writing Styles
                </h2>
                <p
                  className={`text-sm mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Select writing styles to add (maximum 4 active styles)
                </p>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-all hover:scale-110 active:scale-95 ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-white/10'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Styles List */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-3">
              {styles.map((style) => (
                <div
                  key={style.id}
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    isDarkMode
                      ? 'bg-white/[0.05] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3
                        className={`text-base mb-1 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {style.name}
                      </h3>
                      <p
                        className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        {style.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleStyle(style.id)}
                      disabled={!style.added && addedCount >= 4}
                      className={`px-4 py-2 rounded-lg text-sm transition-all hover:scale-105 active:scale-95 whitespace-nowrap ${
                        style.added
                          ? isDarkMode
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:shadow-lg hover:shadow-red-500/20'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:shadow-md'
                          : !style.added && addedCount >= 4
                          ? isDarkMode
                            ? 'bg-gray-800/50 text-gray-600 border border-gray-700/50 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                          : isDarkMode
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 hover:shadow-lg hover:shadow-purple-500/30'
                          : 'bg-purple-500 text-white border border-purple-500 hover:bg-purple-600 hover:shadow-lg'
                      }`}
                    >
                      {style.added ? 'Remove' : 'Add'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            className={`px-6 py-4 border-t ${
              isDarkMode ? 'border-white/10' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <p
                className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {addedCount}/4 styles selected
              </p>
              <button
                onClick={onClose}
                className={`px-6 py-2.5 rounded-lg text-sm transition-all hover:scale-105 active:scale-95 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 hover:shadow-lg'
                }`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
