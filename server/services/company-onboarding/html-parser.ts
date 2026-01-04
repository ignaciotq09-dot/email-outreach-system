// HTML Content Parser - Extract and prioritize website sections
// Part of production-quality extraction system

import * as cheerio from 'cheerio';

export interface ParsedSection {
    label: string;
    priority: number;
    content: string;
    source: string;  // URL or section identifier
}

export interface ParsedWebContent {
    sections: ParsedSection[];
    prioritizedContent: string;  // Ready for AI consumption
    metadata: {
        totalSections: number;
        pagesAnalyzed: string[];
        contentLength: number;
    };
}

// Section priority weights (higher = more important for core business info)
const SECTION_PRIORITIES: Record<string, number> = {
    // HIGH PRIORITY - Core business information
    'hero': 10,
    'services': 9,
    'solutions': 9,
    'products': 9,
    'what-we-do': 9,
    'offerings': 9,
    'portfolio': 8,
    'projects': 8,
    'capabilities': 8,
    'industries': 7,
    'expertise': 7,

    // MEDIUM PRIORITY - Supporting context
    'about': 5,
    'about-us': 5,
    'company': 5,
    'who-we-are': 5,
    'clients': 6,
    'customers': 6,
    'case-studies': 6,
    'testimonials': 6,

    // LOW PRIORITY - Usually NOT core business
    'team': 3,
    'leadership': 3,
    'careers': 2,
    'jobs': 2,
    'culture': 2,
    'values': 2,
    'safety': 1,  // Often irrelevant for business description
    'sustainability': 2,
    'csr': 2,
    'community': 2,
    'news': 2,
    'blog': 2,
    'press': 2,
    'contact': 3,
    'footer': 1,
};

/**
 * Parse HTML and extract sections with priority labels
 */
export function parseHtmlSections(html: string, sourceUrl: string): ParsedSection[] {
    const $ = cheerio.load(html);
    const sections: ParsedSection[] = [];

    // Remove unwanted elements
    $('script, style, noscript, iframe, svg').remove();

    // 1. Extract hero section (usually first major section)
    const heroSection = extractHeroSection($);
    if (heroSection) {
        sections.push({
            label: 'hero',
            priority: SECTION_PRIORITIES['hero'],
            content: heroSection,
            source: sourceUrl,
        });
    }

    // 2. Extract sections by ID/class patterns
    const sectionPatterns = [
        { selector: '[id*="service"], [class*="service"]', label: 'services' },
        { selector: '[id*="solution"], [class*="solution"]', label: 'solutions' },
        { selector: '[id*="product"], [class*="product"]', label: 'products' },
        { selector: '[id*="about"], [class*="about"]', label: 'about' },
        { selector: '[id*="portfolio"], [class*="portfolio"]', label: 'portfolio' },
        { selector: '[id*="project"], [class*="project"]', label: 'projects' },
        { selector: '[id*="client"], [class*="client"]', label: 'clients' },
        { selector: '[id*="testimonial"], [class*="testimonial"]', label: 'testimonials' },
        { selector: '[id*="industries"], [class*="industries"]', label: 'industries' },
        { selector: '[id*="safety"], [class*="safety"]', label: 'safety' },
        { selector: '[id*="culture"], [class*="culture"]', label: 'culture' },
        { selector: '[id*="values"], [class*="values"]', label: 'values' },
        { selector: '[id*="team"], [class*="team"]', label: 'team' },
        { selector: '[id*="career"], [class*="career"]', label: 'careers' },
    ];

    for (const pattern of sectionPatterns) {
        const elements = $(pattern.selector);
        if (elements.length > 0) {
            const content = elements.first().text().trim();
            if (content.length > 50) {  // Minimum content threshold
                sections.push({
                    label: pattern.label,
                    priority: SECTION_PRIORITIES[pattern.label] || 5,
                    content: cleanText(content).slice(0, 3000),  // Limit per section
                    source: `${sourceUrl}#${pattern.label}`,
                });
            }
        }
    }

    // 3. Extract main content as fallback if no sections found
    if (sections.length === 0) {
        const mainContent = $('main, article, [role="main"]').first().text().trim();
        if (mainContent.length > 100) {
            sections.push({
                label: 'main-content',
                priority: 5,
                content: cleanText(mainContent).slice(0, 5000),
                source: sourceUrl,
            });
        }
    }

    // 4. Extract body text as last resort
    if (sections.length === 0) {
        const bodyText = $('body').text().trim();
        sections.push({
            label: 'body',
            priority: 3,
            content: cleanText(bodyText).slice(0, 5000),
            source: sourceUrl,
        });
    }

    return sections;
}

/**
 * Extract hero section (first major content block)
 */
function extractHeroSection($: cheerio.CheerioAPI): string | null {
    // Common hero selectors
    const heroSelectors = [
        'header section:first-of-type',
        '[class*="hero"]',
        '[id*="hero"]',
        '.banner',
        '#banner',
        'section:first-of-type',
        'header + section',
        'main > section:first-of-type',
    ];

    for (const selector of heroSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
            const text = element.text().trim();
            if (text.length > 30 && text.length < 2000) {
                return cleanText(text);
            }
        }
    }

    // Fallback: First 500 chars of body
    const bodyText = $('body').text().trim();
    return cleanText(bodyText).slice(0, 500);
}

/**
 * Determine section label from URL path
 */
export function labelFromPath(path: string): string {
    const cleanPath = path.toLowerCase().replace(/^\//, '').replace(/\/$/, '');

    if (!cleanPath || cleanPath === '') return 'homepage';

    // Check for known patterns
    for (const [label, _priority] of Object.entries(SECTION_PRIORITIES)) {
        if (cleanPath.includes(label.replace('-', ''))) {
            return label;
        }
    }

    return cleanPath.split('/')[0] || 'unknown';
}

/**
 * Combine and prioritize sections for AI consumption
 */
export function prioritizeContent(sections: ParsedSection[]): string {
    // Sort by priority (highest first)
    const sorted = [...sections].sort((a, b) => b.priority - a.priority);

    // Build prioritized content with labels
    const parts: string[] = [];
    let totalLength = 0;
    const maxLength = 20000;  // Max content for AI

    for (const section of sorted) {
        if (totalLength >= maxLength) break;

        const header = `\n=== ${section.label.toUpperCase()} (Priority: ${getPriorityLabel(section.priority)}) ===\n`;
        const content = section.content.slice(0, maxLength - totalLength - header.length);

        parts.push(header + content);
        totalLength += header.length + content.length;
    }

    return parts.join('\n');
}

/**
 * Get human-readable priority label
 */
function getPriorityLabel(priority: number): string {
    if (priority >= 8) return 'HIGH - Core Business Info';
    if (priority >= 5) return 'MEDIUM - Supporting Context';
    return 'LOW - Background Info';
}

/**
 * Clean text content
 */
function cleanText(text: string): string {
    return text
        .replace(/\s+/g, ' ')           // Collapse whitespace
        .replace(/\n{3,}/g, '\n\n')     // Limit newlines
        .replace(/[^\x20-\x7E\n]/g, '') // ASCII only
        .trim();
}

/**
 * Parse multiple pages and combine results
 */
export function parseMultiplePages(
    pages: Array<{ url: string; html: string }>
): ParsedWebContent {
    const allSections: ParsedSection[] = [];

    for (const page of pages) {
        const label = labelFromPath(new URL(page.url).pathname);
        const sections = parseHtmlSections(page.html, page.url);

        // Boost homepage hero priority
        if (label === 'homepage') {
            sections.forEach(s => {
                if (s.label === 'hero') s.priority = 10;
            });
        }

        // Set priority based on page type
        const pageBoost = SECTION_PRIORITIES[label] || 5;
        sections.forEach(s => {
            s.priority = Math.max(s.priority, pageBoost);
        });

        allSections.push(...sections);
    }

    // Deduplicate similar content
    const uniqueSections = deduplicateSections(allSections);

    return {
        sections: uniqueSections,
        prioritizedContent: prioritizeContent(uniqueSections),
        metadata: {
            totalSections: uniqueSections.length,
            pagesAnalyzed: pages.map(p => p.url),
            contentLength: uniqueSections.reduce((sum, s) => sum + s.content.length, 0),
        },
    };
}

/**
 * Remove duplicate/similar content sections
 */
function deduplicateSections(sections: ParsedSection[]): ParsedSection[] {
    const seen = new Set<string>();
    const unique: ParsedSection[] = [];

    for (const section of sections) {
        // Create fingerprint from first 100 chars
        const fingerprint = section.content.slice(0, 100).toLowerCase();
        if (!seen.has(fingerprint)) {
            seen.add(fingerprint);
            unique.push(section);
        }
    }

    return unique;
}
