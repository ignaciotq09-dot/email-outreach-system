export interface SendOptions {
  mode: "immediate" | "optimal" | "scheduled";
  scheduledTime?: Date;
  batchSize?: number;
}
