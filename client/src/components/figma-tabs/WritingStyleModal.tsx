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
  onRemoveStyle,
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

  const handleRemove = (styleId: WritingStyleId) => {
    onRemoveStyle(styleId);
    onClose(); // Close modal immediately after removing
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
          className={`rounded-2xl border shadow-2xl overflow-hidden ${isDarkMode
              ? 'bg-[#1a0f2e]/95 backdrop-blur-xl border-purple-500/30 shadow-purple-500/20'
              : 'bg-white/95 backdrop-blur-xl border-purple-200/50 shadow-purple-500/10'
            }`}
        >
          {/* Header */}
          <div
            className={`px-6 py-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'
              }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2
                  className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                >
                  Writing Styles
                </h2>
                <p
                  className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                  {activeStyleIds.length < maxStyles
                    ? 'Click Add to add a style (closes automatically)'
                    : 'At maximum. Remove a style first, or click one to replace.'
                  }
                </p>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-all hover:scale-110 active:scale-95 ${isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-white/10'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active Styles */}
          {activeStyleIds.length > 0 && (
            <div className="px-6 py-4">
              <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Active Styles ({activeStyleIds.length}/{maxStyles})
              </h3>
              <div className="space-y-2">
                {activeStyleIds.map((styleId) => {
                  const style = WRITING_STYLES[styleId];
                  return (
                    <div
                      key={styleId}
                      className={`p-3 rounded-xl border transition-all duration-300 ${isDarkMode
                          ? 'bg-purple-500/20 border-purple-500/30'
                          : 'bg-purple-50 border-purple-200'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                            {style.name}
                          </h4>
                          <p className={`text-xs ${isDarkMode ? 'text-purple-400/70' : 'text-purple-600/70'}`}>
                            {style.description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemove(styleId)}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-all hover:scale-105 ${isDarkMode
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                              : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                            }`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Styles */}
          {availableStyles.length > 0 && activeStyleIds.length < maxStyles && (
            <div className={`px-6 py-4 ${activeStyleIds.length > 0 ? 'border-t ' + (isDarkMode ? 'border-white/10' : 'border-gray-200') : ''}`}>
              <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Add a Style
              </h3>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {availableStyles.map((styleId) => {
                  const style = WRITING_STYLES[styleId];
                  return (
                    <div
                      key={styleId}
                      className={`p-3 rounded-xl border transition-all duration-300 ${isDarkMode
                          ? 'bg-white/[0.05] border-white/10 hover:bg-white/[0.08]'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {style.name}
                          </h4>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {style.description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAdd(styleId)}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-all hover:scale-105 ${isDarkMode
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
              </div>
            </div>
          )}

          {/* Footer */}
          <div
            className={`px-6 py-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'
              }`}
          >
            <div className="flex items-center justify-end">
              <button
                onClick={onClose}
                className={`px-6 py-2 rounded-lg text-sm transition-all hover:scale-105 ${isDarkMode
                    ? 'bg-white/10 text-gray-300 hover:bg-white/15'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
