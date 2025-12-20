import type { LinkedInMessageParams, LinkedInSendResult, MessageStats, ConnectionStatus } from "./types";
import { isConnected, getConnectionStatus, checkAndResetDailyLimits, canSendConnectionRequest, canSendDirectMessage } from "./status";
import { sendConnectionRequest, sendDirectMessage, sendMessage } from "./messaging";
import { updateMessageStatus, getSentMessages, getMessageStats } from "./stats";
import { connectAccount, disconnectAccount, updateSettings } from "./account";

export class LinkedInService {
  static isConnected = isConnected;
  static getConnectionStatus = getConnectionStatus;
  static checkAndResetDailyLimits = checkAndResetDailyLimits;
  static canSendConnectionRequest = canSendConnectionRequest;
  static canSendDirectMessage = canSendDirectMessage;
  static sendConnectionRequest = sendConnectionRequest;
  static sendDirectMessage = sendDirectMessage;
  static sendMessage = sendMessage;
  static updateMessageStatus = updateMessageStatus;
  static getSentMessages = getSentMessages;
  static getMessageStats = getMessageStats;
  static connectAccount = connectAccount;
  static disconnectAccount = disconnectAccount;
  static updateSettings = updateSettings;
}
