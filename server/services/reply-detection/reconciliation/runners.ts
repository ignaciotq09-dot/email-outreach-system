import type { EmailProvider } from "../types";
import type { ReconciliationResult } from "./types";
import { getEmailsNeedingCheck, getAllEmailsWithoutReplies } from "./queries";
import { processEmail } from "./processor";

export async function runHourlyReconciliation(userId: number, provider: EmailProvider): Promise<ReconciliationResult> {
  const startTime = Date.now();
  console.log(`[Reconciliation] Starting hourly scan for user ${userId} (${provider})`);
  const result: ReconciliationResult = { totalChecked: 0, newRepliesFound: 0, anomaliesLogged: 0, errors: [], duration: 0 };
  try {
    const emailsToCheck = await getEmailsNeedingCheck(24, 1);
    console.log(`[Reconciliation] Found ${emailsToCheck.length} emails to check`);
    for (const { sentEmail, contact } of emailsToCheck) {
      const processResult = await processEmail(sentEmail, contact, userId, provider);
      result.totalChecked++; if (processResult.found) result.newRepliesFound++; if (processResult.isAnomaly) result.anomaliesLogged++; if (processResult.error) result.errors.push(`Email ${sentEmail.id}: ${processResult.error}`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error: any) { result.errors.push(`Fatal error: ${error?.message}`); }
  result.duration = Date.now() - startTime; console.log(`[Reconciliation] Hourly scan complete:`, result);
  return result;
}

export async function runNightlyReconciliation(userId: number, provider: EmailProvider): Promise<ReconciliationResult> {
  const startTime = Date.now();
  console.log(`[Reconciliation] Starting nightly full sweep for user ${userId} (${provider})`);
  const result: ReconciliationResult = { totalChecked: 0, newRepliesFound: 0, anomaliesLogged: 0, errors: [], duration: 0 };
  try {
    const emailsToCheck = await getAllEmailsWithoutReplies();
    console.log(`[Reconciliation] Found ${emailsToCheck.length} emails without replies`);
    for (const { sentEmail, contact } of emailsToCheck) {
      const processResult = await processEmail(sentEmail, contact, userId, provider);
      result.totalChecked++; if (processResult.found) result.newRepliesFound++; if (processResult.isAnomaly) result.anomaliesLogged++; if (processResult.error) result.errors.push(`Email ${sentEmail.id}: ${processResult.error}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error: any) { result.errors.push(`Fatal error: ${error?.message}`); }
  result.duration = Date.now() - startTime; console.log(`[Reconciliation] Nightly sweep complete:`, result);
  return result;
}
