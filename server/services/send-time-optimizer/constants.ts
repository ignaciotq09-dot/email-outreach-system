export const INDUSTRY_PATTERNS: Record<string, { bestDays: number[]; bestHours: number[] }> = {
  'technology': { bestDays: [2, 3, 4], bestHours: [9, 10, 14, 15] },
  'finance': { bestDays: [2, 3, 4], bestHours: [8, 9, 10, 14] },
  'healthcare': { bestDays: [2, 3], bestHours: [7, 8, 11, 12] },
  'retail': { bestDays: [1, 2, 3], bestHours: [10, 11, 14, 15] },
  'real estate': { bestDays: [2, 3, 4], bestHours: [9, 10, 11, 14] },
  'construction': { bestDays: [1, 2, 3], bestHours: [7, 8, 9, 14] },
  'professional services': { bestDays: [2, 3, 4], bestHours: [9, 10, 11, 14] },
  'manufacturing': { bestDays: [2, 3, 4], bestHours: [8, 9, 10, 14] },
  'education': { bestDays: [2, 3, 4], bestHours: [10, 11, 14, 15] },
  'default': { bestDays: [2, 3, 4], bestHours: [9, 10, 14, 15] }
};

export const TIMEZONE_OFFSETS: Record<string, number> = {
  'America/New_York': -5, 'America/Chicago': -6, 'America/Denver': -7, 'America/Los_Angeles': -8, 'America/Phoenix': -7,
  'Europe/London': 0, 'Europe/Paris': 1, 'Europe/Berlin': 1, 'Asia/Tokyo': 9, 'Asia/Shanghai': 8, 'Asia/Singapore': 8,
  'Australia/Sydney': 11, 'Pacific/Auckland': 13,
};
