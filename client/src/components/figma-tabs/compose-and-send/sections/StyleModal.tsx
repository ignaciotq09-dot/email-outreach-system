// Style Modal Component for adding/replacing writing styles

import { WRITING_STYLES } from '@shared/writing-styles';
import type { WritingStyleId } from '@shared/writing-styles';

interface StyleModalProps {
    isOpen: boolean;
    onClose: () => void;
    newStyleToAdd: WritingStyleId | null;
    activeStyleIds: WritingStyleId[];
    availableStyles: WritingStyleId[];
    onSelectNewStyle: (styleId: WritingStyleId) => void;
    onReplaceStyle: (oldStyleId: WritingStyleId) => void;
    isDarkMode: boolean;
    maxStyles: number;
}

export function StyleModal({
    isOpen,
    onClose,
    newStyleToAdd,
    activeStyleIds,
    availableStyles,
    onSelectNewStyle,
    onReplaceStyle,
    isDarkMode,
    maxStyles
}: StyleModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50">
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4">
                <div className={`rounded-2xl p-5 border shadow-2xl ${isDarkMode
                    ? 'bg-[#0a0515] border-purple-500/30'
                    : 'bg-white border-purple-200'
                    }`}>
                    <h3 className={`text-lg font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {newStyleToAdd
                            ? 'Which style to replace?'
                            : activeStyleIds.length >= maxStyles
                                ? 'Add a New Style'
                                : 'Add Writing Style'}
                    </h3>
                    <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {newStyleToAdd
                            ? `Select which current style to replace with "${WRITING_STYLES[newStyleToAdd].name}"`
                            : activeStyleIds.length >= maxStyles
                                ? 'Select the new style you want to add, then choose which current style to replace.'
                                : `Select a writing style to add (${activeStyleIds.length}/${maxStyles})`
                        }
                    </p>

                    {/* Step 2: After selecting new style, show current styles to pick which to replace */}
                    {newStyleToAdd ? (
                        <div className="space-y-2 mb-4">
                            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Click a style to replace it with "{WRITING_STYLES[newStyleToAdd].name}":</p>
                            {activeStyleIds.map((styleId) => {
                                const style = WRITING_STYLES[styleId];
                                return (
                                    <div
                                        key={styleId}
                                        className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-all ${isDarkMode
                                            ? 'bg-purple-500/20 border-purple-500/30'
                                            : 'bg-purple-100 border-purple-300'
                                            }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-medium text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>{style.name}</div>
                                            <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-purple-400/70' : 'text-purple-600/70'}`}>
                                                {style.description}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onReplaceStyle(styleId)}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 ${isDarkMode
                                                ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                                                : 'bg-red-500 text-white hover:bg-red-600'
                                                }`}
                                        >
                                            Replace
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Step 1: Show available styles to add */
                        <div className="space-y-2 mb-4 max-h-[60vh] overflow-y-auto">
                            {availableStyles.map((styleId) => {
                                const style = WRITING_STYLES[styleId];
                                return (
                                    <div
                                        key={styleId}
                                        className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-all ${isDarkMode
                                            ? 'bg-white/5 border-white/10'
                                            : 'bg-white border-gray-200'
                                            }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-medium text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{style.name}</div>
                                            <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                {style.description}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onSelectNewStyle(styleId)}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 ${isDarkMode
                                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
                                                : 'bg-purple-500 text-white hover:bg-purple-600'
                                                }`}
                                        >
                                            Add
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

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
    );
}
