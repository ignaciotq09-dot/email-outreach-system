export interface PhantombusterLaunchResult { success: boolean; containerId?: string; message?: string; error?: string; }
export interface PhantombusterAgentStatus { agentId: string; containerId: string; status: "running" | "finished" | "error" | "unknown"; exitCode?: number; exitMessage?: string; resultObject?: any; runDuration?: number; }
export interface PhantombusterConfig { apiKey: string; autoConnectAgentId?: string | null; messageSenderAgentId?: string | null; webhookSecret?: string | null; }
export const PHANTOMBUSTER_API_BASE = "https://api.phantombuster.com/api/v2";
