// Enhanced Website Fetching & Parsing
// Implements: Retry logic, sitemap parsing, link discovery, schema.org extraction
// Part of the extraction improvement initiative

import * as cheerio from 'cheerio';

// Enhanced strategic paths
const ENHANCED_PATHS = [
    '', '/about', '/about-us', '/services', '/what-we-do',
    '/solutions', '/products', '/offerings', '/industries',
    '/customers', '/clients', '/who-we-serve', '/case-studies',
    '/testimonials', '/pricing', '/contact',
];

interface FetchResult {
    url: string;
    html: string;
    text: string;
}

interface EnhancedWebContent {
    pages: FetchResult[];
    structuredData: StructuredData[];
    discoveredLinks: string[];
    sitemapUrls: string[];
    combinedText: string;
    testimonials: Testimonial[];
    pricingInfo: PricingData | null;
}

interface StructuredData {
    type: string;
    data: any;
}

interface Testimonial {
    quote: string;
    author?: string;
    title?: string;
    company?: string;
}

interface PricingData {
    tiers: PricingTier[];
}

interface PricingTier {
    name: string;
    price?: string;
    features?: string[];
    targetAudience?: string;
}

async function fetchWithRetry(url: string, maxRetries = 3, timeout = 5000): Promise<string | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const res = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
                redirect: 'follow',
            });
            clearTimeout(timeoutId);
            if (!res.ok) {
                if (attempt < maxRetries) { await sleep(500 * attempt); continue; }
                return null;
            }
            return await res.text();
        } catch {
            clearTimeout(timeoutId);
            if (attempt < maxRetries) { await sleep(500 * attempt); continue; }
            return null;
        }
    }
    return null;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function parseSitemap(baseUrl: string): Promise<string[]> {
    const sitemapUrls = [`${baseUrl}/sitemap.xml`, `${baseUrl}/sitemap_index.xml`];

    for (const sitemapUrl of sitemapUrls) {
        try {
            const html = await fetchWithRetry(sitemapUrl, 1, 3000);
            if (!html) continue;

            const urls: string[] = [];
            const locRegex = /<loc>([^<]+)<\/loc>/g;
            let match;
            while ((match = locRegex.exec(html)) !== null) {
                const url = match[1].trim();
                if (isImportantPage(url)) urls.push(url);
            }

            if (urls.length > 0) {
                console.log(`[EnhancedFetch] Found ${urls.length} URLs in sitemap`);
                return urls.slice(0, 15);
            }
        } catch { continue; }
    }
    return [];
}

function isImportantPage(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    const skip = ['/blog/', '/news/', '/careers/', '/jobs/', '/press/', '.pdf', '.jpg', '.png'];
    if (skip.some(p => lowerUrl.includes(p))) return false;

    const important = ['/about', '/services', '/products', '/solutions', '/pricing', '/industries', '/customers'];
    try {
        if (new URL(url).pathname === '/') return true;
    } catch { return false; }
    return important.some(p => lowerUrl.includes(p));
}

export function discoverLinks(html: string, baseUrl: string): string[] {
    const $ = cheerio.load(html);
    const links: string[] = [];

    const navSelectors = ['nav a', 'header a', '.navigation a', '.menu a'];
    for (const selector of navSelectors) {
        $(selector).each((_, el) => {
            const href = $(el).attr('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                const fullUrl = resolveUrl(href, baseUrl);
                if (fullUrl && isImportantPage(fullUrl) && !links.includes(fullUrl)) {
                    links.push(fullUrl);
                }
            }
        });
    }
    console.log(`[EnhancedFetch] Discovered ${links.length} navigation links`);
    return links.slice(0, 10);
}

export function extractStructuredData(html: string): StructuredData[] {
    const $ = cheerio.load(html);
    const structuredData: StructuredData[] = [];

    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const json = JSON.parse($(el).html() || '{}');
            if (json['@type']) {
                structuredData.push({ type: json['@type'], data: json });
                console.log(`[EnhancedFetch] Found JSON-LD: ${json['@type']}`);
            }
        } catch { /* skip invalid JSON */ }
    });

    // OpenGraph
    const ogData: Record<string, string> = {};
    $('meta[property^="og:"]').each((_, el) => {
        const prop = $(el).attr('property')?.replace('og:', '');
        const content = $(el).attr('content');
        if (prop && content) ogData[prop] = content;
    });
    if (Object.keys(ogData).length > 0) {
        structuredData.push({ type: 'OpenGraph', data: ogData });
    }

    return structuredData;
}

export function extractTestimonials(html: string): Testimonial[] {
    const $ = cheerio.load(html);
    const testimonials: Testimonial[] = [];

    // Expanded selectors for better coverage
    const selectors = [
        '[class*="testimonial"]',
        '[class*="quote"]',
        '[class*="review"]',
        '[class*="customer-story"]',
        '[class*="success-story"]',
        '[class*="case-study"]',
        '[data-testimonial]',
        '[role="testimonial"]',
        'blockquote',
        'cite',
        '.testimonial',
        '.customer-quote',
        '.client-feedback',
    ];
    for (const selector of selectors) {
        $(selector).each((_, el) => {
            const text = $(el).text().trim();
            if (text.length > 30 && text.length < 1000) {
                const testimonial: Testimonial = { quote: text };
                const cite = $(el).find('cite, .author, [class*="author"]').first().text().trim();
                if (cite) {
                    const parts = cite.split(/,|at|@|-/);
                    if (parts.length >= 1) testimonial.author = parts[0].trim();
                    if (parts.length >= 2) testimonial.title = parts[1].trim();
                    if (parts.length >= 3) testimonial.company = parts[2].trim();
                }
                testimonials.push(testimonial);
            }
        });
    }
    console.log(`[EnhancedFetch] Extracted ${testimonials.length} testimonials`);
    return testimonials.slice(0, 10);
}

export function extractPricing(html: string): PricingData | null {
    const $ = cheerio.load(html);
    const tiers: PricingTier[] = [];

    // Method 1: CSS selectors for pricing cards
    const selectors = [
        '[class*="pricing"] [class*="plan"]',
        '[class*="pricing"] [class*="card"]',
        '[class*="pricing"] [class*="tier"]',
        '[class*="plan-card"]',
        '[class*="price-card"]',
        'table[class*="pricing"] tr',
    ];

    for (const selector of selectors) {
        $(selector).each((_, el) => {
            const name = $(el).find('h2, h3, [class*="name"], th').first().text().trim();
            const price = $(el).find('[class*="price"], td:has($)').first().text().trim();
            const targetText = $(el).text().toLowerCase();
            let targetAudience: string | undefined;
            if (targetText.includes('enterprise')) targetAudience = 'Enterprise';
            else if (targetText.includes('startup')) targetAudience = 'Startups';
            else if (targetText.includes('small business') || targetText.includes('smb')) targetAudience = 'Small Business';
            else if (targetText.includes('team')) targetAudience = 'Teams';
            else if (targetText.includes('individual') || targetText.includes('personal')) targetAudience = 'Individual';

            if (name || price) tiers.push({ name: name || 'Unknown', price, targetAudience });
        });
    }

    // Method 2: Regex pattern matching for prices in text (fallback)
    if (tiers.length === 0) {
        const fullText = $('body').text();

        // Pattern: $XX or $XX/month or $XX per month
        const pricePatterns = [
            /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:\/|\s*per\s*)?(month|mo|year|yr|user|seat)?/gi,
            /starting\s+(?:at\s+)?\$(\d+)/gi,
            /from\s+\$(\d+)/gi,
            /(\$\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:-|to)\s*(\$\d+(?:,\d{3})*(?:\.\d{2})?)/gi, // Price ranges
        ];

        const prices: string[] = [];
        for (const pattern of pricePatterns) {
            const matches = fullText.match(pattern);
            if (matches) {
                prices.push(...matches.slice(0, 5)); // Limit to 5 matches per pattern
            }
        }

        // If we found prices, add them as tiers
        const uniquePrices = Array.from(new Set(prices));
        for (let i = 0; i < Math.min(uniquePrices.length, 4); i++) {
            tiers.push({
                name: `Tier ${i + 1}`,
                price: uniquePrices[i],
            });
        }
    }

    if (tiers.length > 0) {
        console.log(`[EnhancedFetch] Extracted ${tiers.length} pricing tiers`);
        return { tiers };
    }
    return null;
}

export async function fetchEnhancedWebContent(url: string): Promise<EnhancedWebContent> {
    const baseUrl = normalizeUrl(url);
    console.log('[EnhancedFetch] Starting enhanced fetch for:', baseUrl);

    const pages: FetchResult[] = [];
    const structuredData: StructuredData[] = [];
    let discoveredLinks: string[] = [];
    let sitemapUrls: string[] = [];
    let testimonials: Testimonial[] = [];
    let pricingInfo: PricingData | null = null;

    // Step 1: Homepage
    console.log('[EnhancedFetch] Step 1: Fetching homepage...');
    const homepageHtml = await fetchWithRetry(baseUrl, 3, 5000);
    if (homepageHtml) {
        pages.push({ url: baseUrl, html: homepageHtml, text: extractText(homepageHtml) });
        structuredData.push(...extractStructuredData(homepageHtml));
        discoveredLinks = discoverLinks(homepageHtml, baseUrl);
        testimonials.push(...extractTestimonials(homepageHtml));
    }

    // Step 2: Sitemap
    console.log('[EnhancedFetch] Step 2: Checking sitemap...');
    sitemapUrls = await parseSitemap(baseUrl);

    // Step 3: Build URL list
    const urlsToFetch: string[] = [];
    for (const path of ENHANCED_PATHS) {
        const fullUrl = `${baseUrl}${path}`;
        if (fullUrl !== baseUrl && !urlsToFetch.includes(fullUrl)) urlsToFetch.push(fullUrl);
    }
    for (const link of discoveredLinks) {
        if (!urlsToFetch.includes(link)) urlsToFetch.push(link);
    }
    for (const sitUrl of sitemapUrls) {
        if (!urlsToFetch.includes(sitUrl)) urlsToFetch.push(sitUrl);
    }

    const limitedUrls = urlsToFetch.slice(0, 12);
    console.log(`[EnhancedFetch] Step 3: Fetching ${limitedUrls.length} additional pages...`);

    // Step 4: Parallel fetch
    const results = await Promise.allSettled(
        limitedUrls.map(async (pageUrl) => {
            const html = await fetchWithRetry(pageUrl, 2, 4000);
            if (html && html.length > 500) {
                return { url: pageUrl, html, text: extractText(html) };
            }
            return null;
        })
    );

    for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
            pages.push(result.value);
            structuredData.push(...extractStructuredData(result.value.html));
            if (result.value.url.includes('testimonial') || result.value.url.includes('case-stud')) {
                testimonials.push(...extractTestimonials(result.value.html));
            }
            if (result.value.url.includes('pricing')) {
                pricingInfo = extractPricing(result.value.html);
            }
        }
    }

    console.log(`[EnhancedFetch] Fetched ${pages.length} pages, ${structuredData.length} structured data items`);

    const combinedText = buildPrioritizedContent(pages, structuredData, testimonials, pricingInfo);

    return { pages, structuredData, discoveredLinks, sitemapUrls, combinedText, testimonials, pricingInfo };
}

function buildPrioritizedContent(
    pages: FetchResult[], sd: StructuredData[], testimonials: Testimonial[], pricing: PricingData | null
): string {
    const parts: string[] = [];
    let len = 0;
    const max = 30000;

    // Schema.org data first
    const org = sd.find(s => s.type === 'Organization' || s.type === 'LocalBusiness');
    if (org) {
        const txt = `=== STRUCTURED DATA ===\nName: ${org.data.name || 'N/A'}\nDescription: ${org.data.description || 'N/A'}\n`;
        parts.push(txt);
        len += txt.length;
    }

    // Pricing
    if (pricing && pricing.tiers.length > 0) {
        let txt = '=== PRICING ===\n';
        for (const t of pricing.tiers) {
            txt += `${t.name}: ${t.price || 'N/A'} (${t.targetAudience || 'General'})\n`;
        }
        parts.push(txt);
        len += txt.length;
    }

    // Testimonials
    if (testimonials.length > 0) {
        let txt = '=== TESTIMONIALS ===\n';
        for (const t of testimonials.slice(0, 5)) {
            txt += `"${t.quote.slice(0, 150)}..." - ${t.author || 'Unknown'}`;
            if (t.title) txt += `, ${t.title}`;
            txt += '\n';
        }
        parts.push(txt);
        len += txt.length;
    }

    // Pages
    const sorted = [...pages].sort((a, b) => getPagePriority(a.url) - getPagePriority(b.url));
    for (const page of sorted) {
        if (len >= max) break;
        const label = getPageLabel(page.url).toUpperCase();
        const content = page.text.slice(0, Math.min(4000, max - len));
        const section = `\n=== ${label} ===\n${content}`;
        parts.push(section);
        len += section.length;
    }

    return parts.join('\n');
}

function getPagePriority(url: string): number {
    const lower = url.toLowerCase();
    try {
        if (new URL(url).pathname === '/') return 1;
    } catch { return 10; }
    if (lower.includes('services') || lower.includes('solutions')) return 2;
    if (lower.includes('products') || lower.includes('pricing')) return 3;
    if (lower.includes('about')) return 4;
    return 10;
}

function getPageLabel(url: string): string {
    try {
        const path = new URL(url).pathname;
        if (path === '/' || path === '') return 'Homepage';
        return path.replace(/^\//, '').replace(/-/g, ' ').split('/')[0] || 'Page';
    } catch { return 'Page'; }
}

function normalizeUrl(url: string): string {
    let n = url.startsWith('http') ? url : `https://${url}`;
    return n.replace(/\/$/, '');
}

function resolveUrl(href: string, baseUrl: string): string | null {
    try {
        if (href.startsWith('http')) return href;
        if (href.startsWith('//')) return 'https:' + href;
        if (href.startsWith('/')) return baseUrl + href;
        return baseUrl + '/' + href;
    } catch { return null; }
}

function extractText(html: string): string {
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
    text = text.replace(/\s+/g, ' ').trim();
    return text;
}

export function structuredDataToFields(data: StructuredData[]): Partial<{
    companyName: string;
    businessDescription: string;
    industry: string;
    employeeCount: string;
    headquarters: string;
}> {
    const fields: any = {};
    for (const item of data) {
        if (item.type === 'Organization' || item.type === 'LocalBusiness' || item.type === 'Corporation') {
            if (item.data.name) fields.companyName = item.data.name;
            if (item.data.description) fields.businessDescription = item.data.description;
            if (item.data.industry) fields.industry = item.data.industry;
            if (item.data.numberOfEmployees?.value) fields.employeeCount = String(item.data.numberOfEmployees.value);
            if (item.data.address?.addressLocality) {
                fields.headquarters = `${item.data.address.addressLocality}, ${item.data.address.addressRegion || ''}`.trim();
            }
        }
    }
    return fields;
}

export function extractJobTitlesFromTestimonials(testimonials: Testimonial[]): string[] {
    const titles: string[] = [];
    for (const t of testimonials) {
        if (t.title && t.title.length > 2 && t.title.length < 50 && !titles.includes(t.title)) {
            titles.push(t.title);
        }
    }
    return titles;
}
