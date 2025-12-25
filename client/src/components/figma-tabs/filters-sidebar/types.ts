// Type definitions for FiltersSidebar component

import type { Filters } from '../FindContacts';

export interface FiltersSidebarProps {
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
    onSearch: () => void;
    onClearFilters: () => void;
    isSearching: boolean;
    activeFilterCount: number;
}

export interface FilterSectionProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    badgeCount?: number;
    isDarkMode: boolean;
}

export interface FilterInputProps {
    value: string;
    onChange: (value: string) => void;
    onAdd: () => void;
    placeholder: string;
    gradientColors: string;
    isDarkMode: boolean;
}

export interface FilterTagProps {
    items: string[];
    onRemove: (item: string) => void;
    icon: React.ComponentType<{ className?: string }>;
    colorClasses: {
        bg: string;
        text: string;
        border: string;
        hoverText: string;
    };
    isDarkMode: boolean;
}
