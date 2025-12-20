import type { TrackingConfig, TrackingResult } from "./types";
import { getTrackingBaseUrl, validateTrackingConfiguration, validateOnStartup } from "./url-utils";
import { embedTrackingPixel, wrapLinksForTracking } from "./pixel-embed";
import { prepareTrackedEmail, finalizeTracking, markTrackingFailed } from "./prepare";
import { getTrackingStats } from "./stats";
import { sendTrackedEmail, sendTrackedReply } from "./send";

export class EmailTrackingService {
  static getTrackingBaseUrl = getTrackingBaseUrl;
  static validateTrackingConfiguration = validateTrackingConfiguration;
  static validateOnStartup = validateOnStartup;
  static embedTrackingPixel = embedTrackingPixel;
  static wrapLinksForTracking = wrapLinksForTracking;
  static prepareTrackedEmail = prepareTrackedEmail;
  static finalizeTracking = finalizeTracking;
  static markTrackingFailed = markTrackingFailed;
  static getTrackingStats = getTrackingStats;
  static sendTrackedEmail = sendTrackedEmail;
  static sendTrackedReply = sendTrackedReply;
}
