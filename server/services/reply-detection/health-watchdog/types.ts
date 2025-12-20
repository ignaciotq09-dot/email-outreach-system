import type { EmailProvider, LayerHealthStatus, QuorumConfig, DetectionResult } from "../types";
export type { EmailProvider, LayerHealthStatus, QuorumConfig, DetectionResult };
export const DEFAULT_QUORUM_CONFIG: QuorumConfig = { minHealthyLayers: 3, minConfirmingLayers: 2, markPendingOnQuorumFailure: true };
