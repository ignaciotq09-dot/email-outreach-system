import type { AnomalyEntry } from "./types";
import { addToReviewQueue } from "../manual-review";

const anomalyLedger: AnomalyEntry[] = [];

export function logAnomaly(entry: AnomalyEntry, contactEmail?: string, subject?: string, sentAt?: Date): void {
  anomalyLedger.push(entry);
  console.warn(`[Reconciliation] ANOMALY: ${entry.type} for sent_email ${entry.sentEmailId} - ${entry.details}`);
  if (entry.requiresManualReview && contactEmail && sentAt) {
    addToReviewQueue({ sentEmailId: entry.sentEmailId, contactId: entry.contactId, contactEmail, contactName: null, subject: subject || 'Unknown Subject', sentAt, reason: `Reconciliation: ${entry.type} - ${entry.details}`, layersChecked: 0, healthyLayers: 0, foundLayers: [], failedLayers: [] });
  }
}

export function getRecentAnomalies(limit: number = 50): AnomalyEntry[] { return anomalyLedger.slice(-limit).reverse(); }
export function getAnomaliesRequiringReview(): AnomalyEntry[] { return anomalyLedger.filter(a => a.requiresManualReview); }
export function clearResolvedAnomalies(sentEmailIds: number[]): void {
  const idsSet = new Set(sentEmailIds);
  for (let i = anomalyLedger.length - 1; i >= 0; i--) { if (idsSet.has(anomalyLedger[i].sentEmailId)) anomalyLedger.splice(i, 1); }
}
