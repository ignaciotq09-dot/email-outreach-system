// Reusable sub-components for FiltersSidebar

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import type { FilterSectionProps, FilterInputProps, FilterTagProps } from './types';

export function FilterSection({ icon: Icon, title, children, defaultExpanded = true, badgeCount, isDarkMode }: FilterSectionProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const ChevronIcon = isExpanded ? ChevronUp : ChevronDown;

    return (
        <div className={`border-b ${isDarkMode ? 'border-lime-300/40' : 'border-gray-200'}`}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full flex items-center justify-between p-4 transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-50'
                    }`}
            >
                <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isDarkMode ? 'text-lime-300' : 'text-gray-500'}`} />
                    <span
                        className="text-sm font-medium"
                        style={{ color: isDarkMode ? '#bef264' : '#111827' }}
                    >
                        {title}
                    </span>
                    {badgeCount !== undefined && badgeCount > 0 && (
                        <span
                            className="px-1.5 py-0.5 rounded text-xs font-semibold"
                            style={{
                                backgroundColor: isDarkMode ? '#a3e635' : '#f3e8ff',
                                color: isDarkMode ? '#581c87' : '#6b21a8'
                            }}
                        >
                            {badgeCount}
                        </span>
                    )}
                </div>
                <ChevronIcon className={`w-4 h-4 ${isDarkMode ? 'text-lime-300' : 'text-gray-400'}`} />
            </button>
            {isExpanded && (
                <div className="px-4 pb-4">
                    {children}
                </div>
            )}
        </div>
    );
}

export function FilterInput({ value, onChange, onAdd, placeholder, gradientColors, isDarkMode }: FilterInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') onAdd();
    };

    return (
        <div className="flex gap-2">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={`flex-1 px-3 py-1.5 text-sm border-2 rounded-lg backdrop-blur-sm focus:outline-none focus:border-purple-500 focus:ring-4 transition-all ${isDarkMode
                        ? 'border-purple-900/50 bg-gray-900/80 focus:ring-purple-900/30'
                        : 'border-purple-200 bg-white/80 focus:ring-purple-100'
                    }`}
                style={{
                    color: isDarkMode ? '#ffffff' : '#111827',
                }}
            />
            <button
                onClick={onAdd}
                className={`p-1.5 text-white rounded-lg transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 ${gradientColors}`}
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
}

export function FilterTags({ items, onRemove, icon: Icon, colorClasses, isDarkMode }: FilterTagProps) {
    if (items.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1.5">
            {items.map((item) => (
                <span
                    key={item}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 ${isDarkMode ? colorClasses.bg.split(' ')[1] : colorClasses.bg.split(' ')[0]
                        } ${isDarkMode ? colorClasses.text.split(' ')[1] : colorClasses.text.split(' ')[0]
                        } rounded-lg text-xs border ${isDarkMode ? colorClasses.border.split(' ')[1] : colorClasses.border.split(' ')[0]
                        } shadow-sm`}
                >
                    <Icon className="w-3 h-3" />
                    {item}
                    <button
                        onClick={() => onRemove(item)}
                        className={`ml-0.5 hover:scale-110 transition-transform ${isDarkMode ? colorClasses.hoverText.split(' ')[1] : colorClasses.hoverText.split(' ')[0]
                            }`}
                    >
                        <X className="w-3 h-3" />
                    </button>
                </span>
            ))}
        </div>
    );
}
