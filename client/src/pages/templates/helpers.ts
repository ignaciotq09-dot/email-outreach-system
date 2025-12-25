// Helper functions for Templates page

import type { EmailTemplate } from "./types";

export function filterTemplates(
    templates: EmailTemplate[],
    searchQuery: string,
    categoryFilter: string
): EmailTemplate[] {
    return templates.filter((template) => {
        const matchesSearch =
            template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
            categoryFilter === "all" ||
            template.category === categoryFilter;

        return matchesSearch && matchesCategory;
    });
}

export function formatCategoryLabel(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1).replace("-", " ");
}
