import type { ScheduledJob } from "@shared/schema";
export type JobHandler = (job: ScheduledJob) => Promise<JobResult>;
export interface JobResult { success: boolean; message: string; data?: any; }
