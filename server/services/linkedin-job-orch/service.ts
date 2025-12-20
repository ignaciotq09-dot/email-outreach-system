import type { InsertLinkedinJobQueue, LinkedinJobQueue } from "@shared/schema";
import type { PreflightResult, SendResult, JobStats } from "./types";
import { runPreflightChecks } from "./preflight";
import { queueJob, getJobStats } from "./queue-ops";
import { processJob, processPendingJobs, processRetryQueue } from "./processor";
import { checkJobStatus, pollPendingJobs, getDeadLetterJobs, retryDeadLetterJob } from "./polling";

export class LinkedInJobOrchestrator {
  static runPreflightChecks = runPreflightChecks;
  static queueJob = queueJob;
  static processJob = processJob;
  static processPendingJobs = processPendingJobs;
  static processRetryQueue = processRetryQueue;
  static checkJobStatus = checkJobStatus;
  static pollPendingJobs = pollPendingJobs;
  static getJobStats = getJobStats;
  static getDeadLetterJobs = getDeadLetterJobs;
  static retryDeadLetterJob = retryDeadLetterJob;
}
