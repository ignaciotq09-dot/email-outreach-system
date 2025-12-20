export interface IndustryRule { emphasis: string[]; metrics: string[]; tone: string; avoidTerms?: string[]; conversionRate?: string; specialConsiderations?: string[]; }
export interface SeniorityRule { wordCount: { max: number }; focusOn: string[]; avoid: string[]; proof: string; tone: string; sendTime?: string; cta?: string; }
