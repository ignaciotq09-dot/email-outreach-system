/**
 * Personalization presets for quick configuration
 * Each preset provides a starting point for common use cases
 */

export interface PersonalizationPreset {
    id: string;
    name: string;
    description: string;
    icon: string;
    toneFormality: number;
    toneWarmth: number;
    toneDirectness: number;
    variantDiversity: number;
    suggestedInstructions: string;
}

export const PERSONALIZATION_PRESETS: PersonalizationPreset[] = [
    {
        id: "friendly-sales",
        name: "Friendly Sales",
        description: "Warm and approachable, great for initial outreach",
        icon: "😊",
        toneFormality: 4,
        toneWarmth: 7,
        toneDirectness: 6,
        variantDiversity: 6,
        suggestedInstructions: "Sound like a helpful friend, not a salesperson. Be genuine and avoid sales-y language. Ask questions that show real interest."
    },
    {
        id: "enterprise-b2b",
        name: "Enterprise B2B",
        description: "Professional and polished for corporate buyers",
        icon: "🏢",
        toneFormality: 7,
        toneWarmth: 5,
        toneDirectness: 7,
        variantDiversity: 5,
        suggestedInstructions: "Keep it professional and crisp. Lead with value and respect their time. No slang or overly casual language."
    },
    {
        id: "startup-casual",
        name: "Startup Casual",
        description: "Relaxed and energetic for tech/startup audience",
        icon: "🚀",
        toneFormality: 3,
        toneWarmth: 6,
        toneDirectness: 8,
        variantDiversity: 7,
        suggestedInstructions: "Keep it short and punchy. Use contractions. Be direct about what you want. Add personality and energy."
    },
    {
        id: "executive-outreach",
        name: "Executive Outreach",
        description: "Concise and respectful for C-suite contacts",
        icon: "👔",
        toneFormality: 8,
        toneWarmth: 4,
        toneDirectness: 9,
        variantDiversity: 4,
        suggestedInstructions: "Respect their time above all. One clear point per email. Lead with the ask. No fluff. Under 5 sentences."
    },
    {
        id: "relationship-builder",
        name: "Relationship Builder",
        description: "Warm nurture for long-term prospects",
        icon: "🤝",
        toneFormality: 5,
        toneWarmth: 8,
        toneDirectness: 4,
        variantDiversity: 5,
        suggestedInstructions: "Focus on building genuine connection. Ask about them, not just your pitch. No hard sells - this is about trust."
    },
    {
        id: "recruiting",
        name: "Recruiting",
        description: "Personable and exciting for talent outreach",
        icon: "🎯",
        toneFormality: 4,
        toneWarmth: 7,
        toneDirectness: 6,
        variantDiversity: 6,
        suggestedInstructions: "Be excited about them specifically. Reference their work or background. Make the opportunity sound interesting, not desperate."
    },
    {
        id: "quick-follow-up",
        name: "Quick Follow-Up",
        description: "Brief check-ins that don't annoy",
        icon: "⚡",
        toneFormality: 4,
        toneWarmth: 5,
        toneDirectness: 9,
        variantDiversity: 3,
        suggestedInstructions: "Super short. 2-3 sentences max. Don't re-explain everything. Just ask if they had a chance to look."
    },
    {
        id: "re-engagement",
        name: "Re-engagement",
        description: "Win back cold or dormant leads",
        icon: "🔄",
        toneFormality: 5,
        toneWarmth: 6,
        toneDirectness: 7,
        variantDiversity: 8,
        suggestedInstructions: "Acknowledge time has passed. Offer new value or reason to reconnect. Don't guilt-trip. Give them an easy out."
    }
];

export function getPresetById(id: string): PersonalizationPreset | undefined {
    return PERSONALIZATION_PRESETS.find(p => p.id === id);
}
