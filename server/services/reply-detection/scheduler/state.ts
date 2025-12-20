import type { SchedulerState, UserPushState } from "./types";

export const state: SchedulerState = {
  isRunning: false,
  intervalIds: []
};

export const userPushStates = new Map<number, UserPushState>();
export const alertCooldowns = new Map<string, Date>();
