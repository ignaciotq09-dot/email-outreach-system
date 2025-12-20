import { getGmailClient } from "../adapters/gmail-adapter";
import { withRetry } from "../retry";
import { processMessage } from './processor';
import { getOrInitializeSyncState, updateSyncState, updateTokenHealth, checkTokenHealth, getSyncStatus } from './sync-state';
import type { HistorySyncResult } from './types';

export { checkTokenHealth, getSyncStatus } from './sync-state';
export type { HistorySyncResult, MessageAnalysis } from './types';

export async function performIncrementalSync(userId: number): Promise<HistorySyncResult> {
  const startTime = Date.now();
  const result: HistorySyncResult = { success: false, messagesProcessed: 0, repliesFound: 0, autoRepliesFiltered: 0, bouncesFiltered: 0, duplicatesSkipped: 0, errors: [] };
  console.log(`[GmailHistorySync] Starting incremental sync for user ${userId}`);
  
  try {
    const gmail = await getGmailClient(userId);
    const syncState = await getOrInitializeSyncState(userId, gmail);
    if (syncState.isNew) { console.log(`[GmailHistorySync] Initialized new sync state with historyId ${syncState.historyId}`); result.success = true; result.newHistoryId = syncState.historyId; return result; }
    
    let pageToken: string | undefined;
    let latestHistoryId = syncState.historyId;
    const processedMessageIds = new Set<string>();
    
    do {
      const historyResponse = await withRetry(() => gmail.users.history.list({ userId: 'me', startHistoryId: syncState.historyId, historyTypes: ['messageAdded'], pageToken }), 'Gmail history list', { maxRetries: 3, initialDelay: 1000 });
      if (!historyResponse?.data) break;
      if (historyResponse.data.historyId) latestHistoryId = historyResponse.data.historyId;
      const history = historyResponse.data.history || [];
      
      for (const entry of history) {
        const messagesAdded = entry.messagesAdded || [];
        for (const added of messagesAdded) {
          const messageId = added.message?.id;
          if (!messageId || processedMessageIds.has(messageId)) continue;
          processedMessageIds.add(messageId);
          try {
            const processed = await processMessage(userId, gmail, messageId);
            result.messagesProcessed++;
            if (processed.wasDuplicate) result.duplicatesSkipped++;
            else if (processed.wasReply) result.repliesFound++;
            else if (processed.wasAutoReply) result.autoRepliesFiltered++;
            else if (processed.wasBounce) result.bouncesFiltered++;
          } catch (error: any) { console.error(`[GmailHistorySync] Error processing message ${messageId}:`, error); result.errors.push(`Message ${messageId}: ${error.message}`); }
        }
      }
      pageToken = historyResponse.data.nextPageToken || undefined;
    } while (pageToken);
    
    await updateSyncState(userId, latestHistoryId, true);
    result.success = true; result.newHistoryId = latestHistoryId;
    console.log(`[GmailHistorySync] Sync completed for user ${userId}: ${result.messagesProcessed} messages, ${result.repliesFound} replies in ${Date.now() - startTime}ms`);
  } catch (error: any) {
    console.error(`[GmailHistorySync] Sync failed for user ${userId}:`, error);
    result.errors.push(error.message);
    if (error.message?.includes('Invalid history') || error.code === 404) {
      console.log(`[GmailHistorySync] History ID invalid, will reinitialize on next sync`);
      await updateSyncState(userId, '', false, 'History ID expired');
    } else { await updateSyncState(userId, '', false, error.message); }
  }
  await updateTokenHealth(userId, 'gmail', result.success, result.errors[0]);
  return result;
}

export default { performIncrementalSync, checkTokenHealth, getSyncStatus };
