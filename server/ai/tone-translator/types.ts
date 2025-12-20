export interface ToneGuidance {
  formality: string | null;
  warmth: string | null;
  directness: string | null;
}

export interface ToneValues {
  formality: number;
  warmth: number;
  directness: number;
}

export interface ConflictResolution {
  hasConflict: boolean;
  conflictType: string | null;
  resolutionGuidance: string | null;
}
