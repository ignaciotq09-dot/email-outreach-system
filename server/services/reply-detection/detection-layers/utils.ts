import type { DetectionResult } from "../types";

export function emailsMatchLoose(email1: string, email2: string): boolean {
  if (!email1 || !email2) return false;
  const e1 = email1.toLowerCase().trim();
  const e2 = email2.toLowerCase().trim();
  if (e1 === e2) return true;
  const [local1, domain1] = e1.split('@');
  const [local2, domain2] = e2.split('@');
  if (domain1 !== domain2) return false;
  const base1 = local1.split('+')[0];
  const base2 = local2.split('+')[0];
  return base1 === base2;
}

export function mergeDetectionResults(results: DetectionResult[]): DetectionResult {
  const repliesMap = new Map();
  let totalPagesChecked = 0, totalMessagesScanned = 0;
  const allQueries: string[] = [], allNotes: string[] = [];
  for (const result of results) {
    if (result.replies) { for (const reply of result.replies) { if (!repliesMap.has(reply.gmailMessageId)) repliesMap.set(reply.gmailMessageId, reply); } }
    if (result.searchMetadata) {
      totalPagesChecked += result.searchMetadata.pagesChecked || 0;
      totalMessagesScanned += result.searchMetadata.messagesScanned || 0;
      allQueries.push(...(result.searchMetadata.queriesRun || []));
      if (result.searchMetadata.notes) allNotes.push(`${result.searchMetadata.layer}: ${result.searchMetadata.notes}`);
    }
  }
  const mergedReplies = Array.from(repliesMap.values());
  return { found: mergedReplies.length > 0, replies: mergedReplies, searchMetadata: { layer: "parallel-all", queriesRun: allQueries, pagesChecked: totalPagesChecked, messagesScanned: totalMessagesScanned, notes: allNotes.length > 0 ? allNotes.join('; ') : undefined } };
}
