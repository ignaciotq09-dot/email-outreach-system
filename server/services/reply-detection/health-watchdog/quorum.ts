import type { QuorumConfig, DetectionResult } from "../types";
import { DEFAULT_QUORUM_CONFIG } from "./types";

export function validateQuorum(results: DetectionResult[], config: QuorumConfig = DEFAULT_QUORUM_CONFIG): { quorumMet: boolean; found: boolean; pendingReview: boolean; healthyLayers: string[]; foundLayers: string[]; failedLayers: string[]; } {
  const healthyLayers: string[] = []; const foundLayers: string[] = []; const failedLayers: string[] = [];
  for (const result of results) {
    const layerName = result.searchMetadata?.layer || 'unknown'; const isHealthy = result.layerHealth?.healthy !== false;
    if (isHealthy) { healthyLayers.push(layerName); if (result.found) foundLayers.push(layerName); } else { failedLayers.push(layerName); }
  }
  if (foundLayers.length > 0) return { quorumMet: true, found: true, pendingReview: false, healthyLayers, foundLayers, failedLayers };
  const hasEnoughHealthyLayers = healthyLayers.length >= config.minHealthyLayers; const hasEnoughConfirming = healthyLayers.length >= config.minConfirmingLayers;
  if (hasEnoughHealthyLayers && hasEnoughConfirming) return { quorumMet: true, found: false, pendingReview: false, healthyLayers, foundLayers, failedLayers };
  return { quorumMet: false, found: false, pendingReview: config.markPendingOnQuorumFailure, healthyLayers, foundLayers, failedLayers };
}
