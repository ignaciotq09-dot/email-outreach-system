// Compose Message Section Component

import { Wand2, Sparkles, CheckCircle2, Plus } from 'lucide-react';
import type { WritingStyleId } from '@shared/writing-styles';

interface WritingStyle {
    id: WritingStyleId;
    name: string;
    description: string;
}

interface ComposeMessageSectionProps {
    message: string;
    onMessageChange: (value: string) => void;
    selectedStyle: WritingStyleId;
    onStyleChange: (style: WritingStyleId) => void;
    writingStyles: WritingStyle[];
    onAddStyleClick: () => void;
    onGenerate: () => void;
    isGenerating: boolean;
    isDarkMode: boolean;
    maxStyles: number;
    activeStyleCount: number;
}

export function ComposeMessageSection({
    message,
    onMessageChange,
    selectedStyle,
    onStyleChange,
    writingStyles,
    onAddStyleClick,
    onGenerate,
    isGenerating,
    isDarkMode,
    maxStyles,
    activeStyleCount
}: ComposeMessageSectionProps) {
    return (
        <div className={`relative rounded-xl overflow-hidden ${isDarkMode
            ? 'bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-purple-900/40 border border-purple-500/20'
            : 'bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 border border-purple-200/50'
            } backdrop-blur-xl shadow-xl ${isDarkMode ? 'shadow-purple-500/10' : 'shadow-purple-500/5'}`}>

            {/* Decorative gradient overlay */}
            <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none ${isDarkMode ? 'bg-indigo-600/10' : 'bg-indigo-300/20'
                }`} />

            <div className="relative p-6">
                <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 rounded-lg ${isDarkMode
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-500'
                        : 'bg-gradient-to-br from-purple-600 to-indigo-600'
                        } shadow-lg shadow-purple-500/30`}>
                        <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <h2
                        className="font-semibold text-lg"
                        style={{ color: isDarkMode ? '#e9d5ff' : '#1f2937' }}
                    >
                        Step 1: Compose Your Message
                    </h2>
                </div>

                <p
                    className="text-sm mb-5 ml-12"
                    style={{ color: isDarkMode ? '#a78bfa' : '#6b7280' }}
                >
                    Write your message here. AI will generate 3 different variants.
                </p>

                {/* Base Message */}
                <div className="mb-5">
                    <label
                        className="block text-sm font-medium mb-2.5"
                        style={{ color: isDarkMode ? '#e9d5ff' : '#374151' }}
                    >
                        Base Message
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => onMessageChange(e.target.value)}
                        placeholder="Write your message here. AI will generate 3 different variants..."
                        rows={8}
                        className={`w-full px-4 py-3 text-base rounded-xl border-2 focus:outline-none focus:ring-2 transition-all resize-none ${isDarkMode
                            ? 'bg-gray-900/60 border-purple-500/30 focus:border-purple-400 focus:ring-purple-900/30 text-white placeholder:text-gray-500'
                            : 'bg-white border-purple-200 focus:border-purple-400 focus:ring-purple-100 text-gray-900 placeholder:text-gray-400'
                            } backdrop-blur-sm`}
                    />
                </div>

                {/* Writing Style */}
                <div className="mb-5">
                    <div className="flex items-center justify-between mb-3">
                        <label
                            className="text-sm font-medium"
                            style={{ color: isDarkMode ? '#e9d5ff' : '#374151' }}
                        >
                            Writing Style
                        </label>
                        <button className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors ${isDarkMode
                            ? 'text-purple-300 hover:bg-purple-500/20 border border-purple-500/30'
                            : 'text-purple-600 hover:bg-purple-50 border border-purple-200'
                            }`}
                            onClick={onAddStyleClick}
                        >
                            <Plus className="w-3 h-3" />
                            {activeStyleCount >= maxStyles ? 'Replace Writing Style' : 'Add Writing Style'}
                        </button>
                    </div>

                    <div className="space-y-3">
                        {writingStyles.map((style) => (
                            <label
                                key={style.id}
                                className={`relative flex items-start gap-4 p-5 rounded-xl cursor-pointer transition-all duration-300 border-2 ${selectedStyle === style.id
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
                                        onChange={(e) => onStyleChange(e.target.value as WritingStyleId)}
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
                                        className="font-semibold mb-1.5 text-base"
                                        style={{ color: isDarkMode ? '#f3e8ff' : '#1f2937' }}
                                    >
                                        {style.name}
                                    </div>
                                    <div
                                        className="text-sm leading-relaxed"
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


                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={onGenerate}
                    disabled={!message.trim() || isGenerating}
                    className={`relative w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden group/btn text-base ${!message.trim() || isGenerating
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

                    <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span className="relative z-10">
                        {isGenerating ? 'Generating Variants...' : 'Generate 3 Email Variants'}
                    </span>
                </button>


            </div>
        </div>
    );
}
