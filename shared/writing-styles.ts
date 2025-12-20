// Writing style definitions for email composition
export const WRITING_STYLES = {
  // Default styles (always available initially)
  "professional-adult": {
    name: "Professional & Adult-like",
    description: "Confident, direct, assumes expertise",
    category: "default"
  },
  "professional-humble": {
    name: "Professional & Humble",
    description: "Learning-oriented, curious, asks questions",
    category: "default"
  },
  "friendly-conversational": {
    name: "Friendly & Conversational",
    description: "Warm, approachable tone like talking to a colleague",
    category: "default"
  },
  
  // Additional styles (available via "Add Writing Styles" button)
  "thoughtful-educated": {
    name: "Thoughtful & Educated",
    description: "Well-researched tone with thoughtful analysis",
    category: "additional"
  },
  "poetic-lyrical": {
    name: "Poetic & Lyrical",
    description: "Flowing, rhythmic language with vivid imagery",
    category: "additional"
  },
  "inspiring-uplifting": {
    name: "Inspiring & Uplifting",
    description: "Energizing language that focuses on possibilities",
    category: "additional"
  },
  "strong-confident": {
    name: "Strong & Confident",
    description: "Strong leadership voice with confident directives",
    category: "additional"
  },
  "precise-technical": {
    name: "Precise & Technical",
    description: "Engineering mindset with precise terminology",
    category: "additional"
  },
} as const;

export type WritingStyleId = keyof typeof WRITING_STYLES;

export interface WritingStyle {
  name: string;
  description: string;
  category: "default" | "additional";
}

// Default active styles (shown on initial load)
export const DEFAULT_ACTIVE_STYLES: WritingStyleId[] = [
  "professional-adult",
  "professional-humble",
  "friendly-conversational"
];

// Maximum number of active styles allowed
export const MAX_ACTIVE_STYLES = 4;
