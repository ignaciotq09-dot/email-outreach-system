// FiltersSidebar component - Main entry point

import { useState, useEffect } from 'react';
import {
    SlidersHorizontal,
    Briefcase,
    MapPin,
    Building,
    Building2,
    Users,
    Loader2
} from 'lucide-react';
import { Filters } from '../FindContacts';

import type { FiltersSidebarProps } from './types';
import { INDUSTRIES, COMPANY_SIZES } from './data';
import { FilterSection, FilterInput, FilterTags } from './components';

// Re-export types and components for backward compatibility
export type { FiltersSidebarProps, FilterSectionProps, FilterInputProps, FilterTagProps } from './types';
export { FilterSection, FilterInput, FilterTags } from './components';

export function FiltersSidebar({
    filters,
    onFiltersChange,
    onSearch,
    onClearFilters,
    isSearching,
    activeFilterCount,
}: FiltersSidebarProps) {
    const [jobTitleInput, setJobTitleInput] = useState('');
    const [locationInput, setLocationInput] = useState('');
    const [companyInput, setCompanyInput] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Detect dark mode changes
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

    // Generic add function
    const addFilterItem = (type: keyof Filters, value: string, setValue: (val: string) => void) => {
        if (!value.trim()) return;

        onFiltersChange({
            ...filters,
            [type]: [...filters[type] as string[], value.trim()],
        });
        setValue('');
    };

    // Generic toggle function for arrays
    const toggleArrayItem = (type: keyof Filters, item: string) => {
        const currentArray = filters[type] as string[];
        const isSelected = currentArray.includes(item);

        onFiltersChange({
            ...filters,
            [type]: isSelected
                ? currentArray.filter(i => i !== item)
                : [...currentArray, item],
        });
    };

    // Generic remove function
    const removeItem = (type: keyof Filters, value: string) => {
        onFiltersChange({
            ...filters,
            [type]: (filters[type] as string[]).filter(v => v !== value),
        });
    };

    return (
        <div
            style={{ backgroundColor: isDarkMode ? '#3b0764' : 'white' }}
            className={`relative w-64 h-full border-r-[4px] flex flex-col shadow-2xl ${isDarkMode
                    ? 'border-purple-300/60 shadow-[0_0_60px_rgba(168,85,247,0.4)]'
                    : 'border-purple-400'
                }`}
        >
            {/* Decorative layers */}
            <div className={`absolute top-0 left-0 right-0 h-40 bg-gradient-to-b to-transparent pointer-events-none ${isDarkMode ? 'from-purple-300/20' : 'from-purple-300/30'
                }`} />
            <div className={`absolute top-0 right-0 bottom-0 w-[4px] bg-gradient-to-b from-purple-300/0 via-purple-300/70 to-purple-300/0 pointer-events-none shadow-[0_0_20px_rgba(216,180,254,0.6)] ${isDarkMode ? 'block' : 'hidden'
                }`} />
            <div className={`absolute inset-0 pointer-events-none ${isDarkMode ? 'bg-purple-300/8' : 'bg-purple-300/10'
                }`} />

            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${isDarkMode
                    ? 'border-purple-900/30 bg-gradient-to-br from-purple-900/60 to-purple-800/40'
                    : 'border-purple-200/50 bg-gradient-to-br from-purple-50/50 to-transparent'
                }`}>
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg shadow-lg shadow-purple-500/30">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h2
                        className="font-semibold"
                        style={{ color: isDarkMode ? '#bef264' : '#111827' }}
                    >
                        Filters
                    </h2>
                </div>
                {activeFilterCount > 0 && (
                    <button
                        onClick={onClearFilters}
                        className="text-xs px-2 py-1 rounded-full transition-colors font-semibold"
                        style={{
                            backgroundColor: isDarkMode ? '#a3e635' : '#f3e8ff',
                            color: isDarkMode ? '#581c87' : '#6b21a8'
                        }}
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Scrollable Filters */}
            <div className="flex-1 overflow-y-auto">
                {/* Job Titles */}
                <FilterSection icon={Briefcase} title="Job Titles" badgeCount={filters.jobTitles.length} isDarkMode={isDarkMode}>
                    <div className="space-y-2">
                        <FilterInput
                            value={jobTitleInput}
                            onChange={setJobTitleInput}
                            onAdd={() => addFilterItem('jobTitles', jobTitleInput, setJobTitleInput)}
                            placeholder="Add job title..."
                            gradientColors="bg-gradient-to-br from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                            isDarkMode={isDarkMode}
                        />
                        <FilterTags
                            items={filters.jobTitles}
                            onRemove={(item) => removeItem('jobTitles', item)}
                            icon={Briefcase}
                            colorClasses={{
                                bg: 'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-cyan-400/30 dark:to-cyan-500/20',
                                text: 'text-blue-700 dark:text-cyan-50',
                                border: 'border-blue-200 dark:border-cyan-400/50',
                                hoverText: 'hover:text-blue-900 dark:hover:text-cyan-100'
                            }}
                            isDarkMode={isDarkMode}
                        />
                    </div>
                </FilterSection>

                {/* Location */}
                <FilterSection icon={MapPin} title="Location" badgeCount={filters.locations.length} isDarkMode={isDarkMode}>
                    <div className="space-y-2">
                        <FilterInput
                            value={locationInput}
                            onChange={setLocationInput}
                            onAdd={() => addFilterItem('locations', locationInput, setLocationInput)}
                            placeholder="Add location..."
                            gradientColors="bg-gradient-to-br from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                            isDarkMode={isDarkMode}
                        />
                        <FilterTags
                            items={filters.locations}
                            onRemove={(item) => removeItem('locations', item)}
                            icon={MapPin}
                            colorClasses={{
                                bg: 'bg-gradient-to-br from-green-100 to-green-50 dark:from-green-400/30 dark:to-green-500/20',
                                text: 'text-green-700 dark:text-green-50',
                                border: 'border-green-200 dark:border-green-400/50',
                                hoverText: 'hover:text-green-900 dark:hover:text-green-100'
                            }}
                            isDarkMode={isDarkMode}
                        />
                    </div>
                </FilterSection>

                {/* Industry */}
                <FilterSection icon={Building} title="Industry" badgeCount={filters.industries.length} isDarkMode={isDarkMode}>
                    <div className="max-h-[200px] overflow-y-auto space-y-1.5 pr-1">
                        {INDUSTRIES.map((industry) => (
                            <label
                                key={industry}
                                className={`flex items-center gap-2 p-2 hover:bg-gradient-to-r rounded-lg cursor-pointer transition-all group ${isDarkMode
                                        ? 'hover:from-purple-400/20 hover:to-transparent'
                                        : 'hover:from-purple-50 hover:to-transparent'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={filters.industries.includes(industry)}
                                    onChange={() => toggleArrayItem('industries', industry)}
                                    className={`w-4 h-4 text-purple-600 rounded focus:ring-purple-500 focus:ring-2 transition-all ${isDarkMode ? 'border-purple-700' : 'border-purple-300'
                                        }`}
                                />
                                <span
                                    className="text-sm transition-colors"
                                    style={{ color: isDarkMode ? '#bef264' : '#374151' }}
                                >
                                    {industry}
                                </span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Companies */}
                <FilterSection icon={Building2} title="Companies" badgeCount={filters.companies.length} isDarkMode={isDarkMode}>
                    <div className="space-y-2">
                        <FilterInput
                            value={companyInput}
                            onChange={setCompanyInput}
                            onAdd={() => addFilterItem('companies', companyInput, setCompanyInput)}
                            placeholder="Company name or domain..."
                            gradientColors="bg-gradient-to-br from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                            isDarkMode={isDarkMode}
                        />
                        <p
                            className="text-xs italic"
                            style={{ color: isDarkMode ? '#fef08a' : '#6b7280' }}
                        >
                            e.g., Google, salesforce.com
                        </p>
                        <FilterTags
                            items={filters.companies}
                            onRemove={(item) => removeItem('companies', item)}
                            icon={Building2}
                            colorClasses={{
                                bg: 'bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-400/30 dark:to-teal-500/20',
                                text: 'text-teal-700 dark:text-teal-50',
                                border: 'border-teal-200 dark:border-teal-400/50',
                                hoverText: 'hover:text-teal-900 dark:hover:text-teal-100'
                            }}
                            isDarkMode={isDarkMode}
                        />
                    </div>
                </FilterSection>

                {/* Company Size */}
                <FilterSection icon={Users} title="Company Size" badgeCount={filters.companySizes.length} isDarkMode={isDarkMode}>
                    <div className="space-y-1.5">
                        {COMPANY_SIZES.map((size) => (
                            <label
                                key={size}
                                className={`flex items-center gap-2 p-2 hover:bg-gradient-to-r rounded-lg cursor-pointer transition-all group ${isDarkMode
                                        ? 'hover:from-purple-400/20 hover:to-transparent'
                                        : 'hover:from-purple-50 hover:to-transparent'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={filters.companySizes.includes(size)}
                                    onChange={() => toggleArrayItem('companySizes', size)}
                                    className={`w-4 h-4 text-purple-600 rounded focus:ring-purple-500 focus:ring-2 transition-all ${isDarkMode ? 'border-purple-700' : 'border-purple-300'
                                        }`}
                                />
                                <span
                                    className="text-sm transition-colors"
                                    style={{ color: isDarkMode ? '#bef264' : '#374151' }}
                                >
                                    {size} employees
                                </span>
                            </label>
                        ))}
                    </div>
                </FilterSection>
            </div>

            {/* Bottom Action */}
            <div className={`p-4 border-t ${isDarkMode
                    ? 'border-purple-900/30 bg-gradient-to-br from-purple-900/60 to-purple-800/40'
                    : 'border-purple-200/50 bg-gradient-to-br from-purple-50/30 to-transparent'
                }`}>
                <button
                    onClick={onSearch}
                    disabled={activeFilterCount === 0 || isSearching}
                    className={`relative w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg overflow-hidden group/btn ${activeFilterCount === 0 || isSearching
                            ? isDarkMode
                                ? 'bg-gray-700 cursor-not-allowed'
                                : 'bg-gray-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-700 shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                        } text-white`}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                    {isSearching ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Searching...
                        </>
                    ) : (
                        <>
                            Search {activeFilterCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                                    {activeFilterCount}
                                </span>
                            )}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
