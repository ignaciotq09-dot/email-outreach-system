import type { EmailProvider } from "../types";
export interface ReconciliationResult { totalChecked: number; newRepliesFound: number; anomaliesLogged: number; errors: string[]; duration: number; }
export interface AnomalyEntry { type: 'missed_reply' | 'stale_detection' | 'quorum_failure'; sentEmailId: number; contactId: number; userId: number; provider: EmailProvider; timestamp: Date; details: string; requiresManualReview: boolean; }
export interface EmailToCheck { sentEmail: any; contact: { id: number; email: string; name: string | null; company: string | null }; }
