import { PHANTOMBUSTER_API_BASE, type PhantombusterLaunchResult, type PhantombusterAgentStatus } from "./types";
import { getConfig } from "./config";

export async function verifyApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try { const response = await fetch(`${PHANTOMBUSTER_API_BASE}/user`, { method: 'GET', headers: { 'X-Phantombuster-Key-1': apiKey, 'Content-Type': 'application/json' } }); if (response.ok) return { valid: true }; if (response.status === 401) return { valid: false, error: 'Invalid API key' }; return { valid: false, error: `API returned status ${response.status}` }; } catch (error: any) { console.error('[Phantombuster] API key verification error:', error); return { valid: false, error: error.message || 'Connection failed' }; }
}

export async function verifyAgentId(apiKey: string, agentId: string): Promise<{ valid: boolean; agentName?: string; error?: string }> {
  try { const response = await fetch(`${PHANTOMBUSTER_API_BASE}/agents/fetch?id=${agentId}`, { method: 'GET', headers: { 'X-Phantombuster-Key-1': apiKey, 'Content-Type': 'application/json' } }); if (response.ok) { const data = await response.json(); return { valid: true, agentName: data.name }; } if (response.status === 404) return { valid: false, error: 'Agent not found' }; return { valid: false, error: `API returned status ${response.status}` }; } catch (error: any) { console.error('[Phantombuster] Agent verification error:', error); return { valid: false, error: error.message || 'Connection failed' }; }
}

export async function launchAutoConnect(userId: number, profileUrls: string[], personalizedMessages: Array<{ profileUrl: string; message: string; }>, options: { numberOfProfilesPerLaunch?: number; } = {}): Promise<PhantombusterLaunchResult> {
  try { const config = await getConfig(userId); if (!config?.apiKey) return { success: false, error: 'Phantombuster API key not configured' }; if (!config.autoConnectAgentId) return { success: false, error: 'LinkedIn Auto Connect agent not configured' };
  const argument = { spreadsheetUrl: profileUrls, personalizedMessages, numberOfProfilesPerLaunch: options.numberOfProfilesPerLaunch || 10 };
  console.log('[Phantombuster] Launching Auto Connect agent:', { agentId: config.autoConnectAgentId, profileCount: profileUrls.length });
  const response = await fetch(`${PHANTOMBUSTER_API_BASE}/agents/launch`, { method: 'POST', headers: { 'X-Phantombuster-Key-1': config.apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: config.autoConnectAgentId, argument }) });
  if (!response.ok) { const errorText = await response.text(); console.error('[Phantombuster] Auto Connect launch failed:', response.status, errorText); return { success: false, error: `Launch failed: ${response.status} - ${errorText}` }; }
  const data = await response.json(); console.log('[Phantombuster] Auto Connect launch successful:', data); return { success: true, containerId: data.containerId, message: 'Agent launched successfully' }; } catch (error: any) { console.error('[Phantombuster] Launch error:', error); return { success: false, error: error.message || 'Launch failed' }; }
}

export async function launchMessageSender(userId: number, profileUrls: string[], message: string, options: { numberOfProfilesPerLaunch?: number; } = {}): Promise<PhantombusterLaunchResult> {
  try { const config = await getConfig(userId); if (!config?.apiKey) return { success: false, error: 'Phantombuster API key not configured' }; if (!config.messageSenderAgentId) return { success: false, error: 'LinkedIn Message Sender agent not configured' };
  const argument = { spreadsheetUrl: profileUrls, message, numberOfProfilesPerLaunch: options.numberOfProfilesPerLaunch || 10 };
  console.log('[Phantombuster] Launching Message Sender agent:', { agentId: config.messageSenderAgentId, profileCount: profileUrls.length, messageLength: message.length });
  const response = await fetch(`${PHANTOMBUSTER_API_BASE}/agents/launch`, { method: 'POST', headers: { 'X-Phantombuster-Key-1': config.apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: config.messageSenderAgentId, argument }) });
  if (!response.ok) { const errorText = await response.text(); console.error('[Phantombuster] Message Sender launch failed:', response.status, errorText); return { success: false, error: `Launch failed: ${response.status} - ${errorText}` }; }
  const data = await response.json(); console.log('[Phantombuster] Message Sender launch successful:', data); return { success: true, containerId: data.containerId, message: 'Agent launched successfully' }; } catch (error: any) { console.error('[Phantombuster] Message Sender launch error:', error); return { success: false, error: error.message || 'Launch failed' }; }
}

export async function getAgentStatus(userId: number, containerId: string): Promise<PhantombusterAgentStatus | null> {
  try { const config = await getConfig(userId); if (!config?.apiKey) { console.error('[Phantombuster] API key not configured'); return null; }
  const response = await fetch(`${PHANTOMBUSTER_API_BASE}/containers/fetch?id=${containerId}`, { method: 'GET', headers: { 'X-Phantombuster-Key-1': config.apiKey, 'Content-Type': 'application/json' } });
  if (!response.ok) { console.error('[Phantombuster] Status fetch failed:', response.status); return null; }
  const data = await response.json(); let status: 'running' | 'finished' | 'error' | 'unknown' = 'unknown'; if (data.exitCode === 0) status = 'finished'; else if (data.exitCode === 1) status = 'error'; else if (data.exitCode === undefined || data.exitCode === null) status = 'running';
  return { agentId: data.agentId, containerId, status, exitCode: data.exitCode, exitMessage: data.exitMessage, resultObject: data.resultObject, runDuration: data.runDuration }; } catch (error) { console.error('[Phantombuster] Status fetch error:', error); return null; }
}

export async function getAgentOutput(userId: number, containerId: string): Promise<any[] | null> {
  try { const config = await getConfig(userId); if (!config?.apiKey) return null; const response = await fetch(`${PHANTOMBUSTER_API_BASE}/containers/fetch-output?id=${containerId}`, { method: 'GET', headers: { 'X-Phantombuster-Key-1': config.apiKey, 'Content-Type': 'application/json' } }); if (!response.ok) return null; const data = await response.json(); return data.output || []; } catch (error) { console.error('[Phantombuster] Output fetch error:', error); return null; }
}
