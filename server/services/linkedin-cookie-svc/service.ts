import type { LinkedInCookies, LinkedInApiResponse } from "./types";
import { getSessionCookies, buildCookieHeader, getCsrfToken, buildHeaders, storeSessionCookies } from "./cookies";
import { extractProfileId, getProfileUrn, fetchProfileData, getConnectionStatus } from "./profile";
import { sendConnectionRequest, sendDirectMessage } from "./messaging";
import { generateExtensionToken, createExtensionToken, validateExtensionToken, disconnectExtension, getExtensionStatus } from "./extension";

export class LinkedInCookieApiService {
  static getSessionCookies = getSessionCookies;
  static buildCookieHeader = buildCookieHeader;
  static getCsrfToken = getCsrfToken;
  static buildHeaders = buildHeaders;
  static storeSessionCookies = storeSessionCookies;
  static extractProfileId = extractProfileId;
  static getProfileUrn = getProfileUrn;
  static fetchProfileData = fetchProfileData;
  static getConnectionStatus = getConnectionStatus;
  static sendConnectionRequest = sendConnectionRequest;
  static sendDirectMessage = sendDirectMessage;
  static generateExtensionToken = generateExtensionToken;
  static createExtensionToken = createExtensionToken;
  static validateExtensionToken = validateExtensionToken;
  static disconnectExtension = disconnectExtension;
  static getExtensionStatus = getExtensionStatus;
}
