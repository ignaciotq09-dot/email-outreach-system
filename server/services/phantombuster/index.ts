import { getConfig, saveConfig, disconnect, generateWebhookSecret, verifyWebhookSignature, addAuditLog } from "./config";
import { verifyApiKey, verifyAgentId, launchAutoConnect, launchMessageSender, getAgentStatus, getAgentOutput } from "./api";
export type { PhantombusterLaunchResult, PhantombusterAgentStatus, PhantombusterConfig } from "./types";

export class PhantombusterService {
  static getConfig = getConfig; static saveConfig = saveConfig; static disconnect = disconnect;
  static generateWebhookSecret = generateWebhookSecret; static verifyWebhookSignature = verifyWebhookSignature; static addAuditLog = addAuditLog;
  static verifyApiKey = verifyApiKey; static verifyAgentId = verifyAgentId;
  static launchAutoConnect = launchAutoConnect; static launchMessageSender = launchMessageSender;
  static getAgentStatus = getAgentStatus; static getAgentOutput = getAgentOutput;
}
