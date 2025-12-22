import { X } from 'lucide-react';
import { WRITING_STYLES, type WritingStyleId } from '@shared/writing-styles';

interface WritingStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  activeStyleIds: WritingStyleId[];
  onAddStyle: (styleId: WritingStyleId) => void;
  onRemoveStyle: (styleId: WritingStyleId) => void;
  maxStyles: number;
}

export function WritingStyleModal({
  isOpen,
  onClose,
  isDarkMode,
  activeStyleIds,
  onAddStyle,
  maxStyles
}: WritingStyleModalProps) {

  if (!isOpen) return null;

  // Get all available styles (not currently active)
  const availableStyles = (Object.keys(WRITING_STYLES) as WritingStyleId[])
    .filter(id => !activeStyleIds.includes(id));

  const handleAdd = (styleId: WritingStyleId) => {
    onAddStyle(styleId);
    onClose(); // Close modal immediately after adding
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
      >
        <div
          className={`rounded-2xl border shadow-2xl overflow-hidden ${isDarkMode
            ? 'bg-[#0a0515] border-purple-500/30'
            : 'bg-white border-purple-200'
            }`}
        >
          {/* Header */}
          <div
            className={`px-5 py-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'
              }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2
                  className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                >
                  {activeStyleIds.length < maxStyles ? 'Add Writing Style' : 'Add a New Style'}
                </h2>
                <p
                  className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                  {activeStyleIds.length < maxStyles
                    ? `Click to add (${activeStyleIds.length}/${maxStyles})`
                    : 'Select a style, then choose which to replace'
                  }
                </p>
              </div>
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-all ${isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-white/10'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Available Styles */}
          <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              {availableStyles.map((styleId) => {
                const style = WRITING_STYLES[styleId];
                return (
                  <div
                    key={styleId}
                    className={`p-3 rounded-xl border transition-all ${isDarkMode
                      ? 'bg-white/5 border-white/10'
                      : 'bg-white border-gray-200'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm" style={{ color: isDarkMode ? '#f3e8ff' : '#1f2937' }}>
                          {style.name}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: isDarkMode ? '#a78bfa' : '#6b7280' }}>
                          {style.description}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAdd(styleId)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 ${isDarkMode
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
                          : 'bg-purple-500 text-white hover:bg-purple-600'
                          }`}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                );
              })}

              {availableStyles.length === 0 && (
                <p className={`text-sm text-center py-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  All styles are already active
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            className={`px-5 py-3 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'
              }`}
          >
            <button
              onClick={onClose}
              className={`w-full px-4 py-2 rounded-lg text-sm transition-all ${isDarkMode
                ? 'bg-white/10 text-gray-300 hover:bg-white/15'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
