export interface SpintaxVariation { subject: string; body: string; variationHash: string; variationIndex: number; }
export interface GenerateVariationsOptions { userId: number; campaignId?: number; originalSubject: string; originalBody: string; numVariations?: number; excludeHashes?: string[]; }
export interface GenerateUniqueVariationOptions extends GenerateVariationsOptions { contactId: number; contact?: import("@shared/schema").Contact; }
export const VARIATION_TYPES = ['synonym_swap', 'sentence_restructure', 'tone_shift', 'opener_variation', 'cta_variation'];
