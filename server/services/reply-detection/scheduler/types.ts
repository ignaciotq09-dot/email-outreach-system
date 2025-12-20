export interface SchedulerState {
  isRunning: boolean;
  lastDeltaSweep?: Date;
  lastReconciliation?: Date;
  lastHealthCheck?: Date;
  intervalIds: NodeJS.Timeout[];
}

export interface UserPushState {
  mode: 'push' | 'polling';
  pushHealthy: boolean;
  lastPushSuccess?: Date;
  consecutivePushFailures: number;
  pollingStarted?: Date;
}

export type AlertType = 'token_expired' | 'sync_stale' | 'consecutive_failures' | 'token_expiring_soon';

export interface AlertDetails {
  subject: string;
  message: string;
  severity: 'warning' | 'critical';
}

export const PUSH_FAILURE_THRESHOLD = 2;
export const PUSH_RETRY_INTERVAL_MS = 30 * 60 * 1000;
export const DELTA_SWEEP_INTERVAL_MS = 10 * 60 * 1000;
export const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000;
export const DEAD_MAN_SWITCH_THRESHOLD_MS = 60 * 60 * 1000;
export const TOKEN_REFRESH_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
export const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000;
