import { db } from "../../../db";
import { replyDetectionJobs, type ReplyDetectionJob, type InsertReplyDetectionJob, type ReplyDetectionJobStatus, type ReplyDetectionJobType } from "@shared/schema";

export async function createDetectionJob(jobData: InsertReplyDetectionJob): Promise<ReplyDetectionJob> {
  const [job] = await db.insert(replyDetectionJobs).values({ ...jobData, status: "pending" as ReplyDetectionJobStatus, jobType: jobData.jobType as ReplyDetectionJobType, attempts: 0, errorCount: 0 } as any).returning();
  console.log(`[ReplyDetectionQueue] Created job ${job.id} for sent_email ${job.sentEmailId}`);
  return job;
}

export async function createBulkDetectionJobs(jobsData: InsertReplyDetectionJob[]): Promise<ReplyDetectionJob[]> {
  if (jobsData.length === 0) return [];
  const jobs = await db.insert(replyDetectionJobs).values(jobsData.map(j => ({ ...j, status: "pending" as ReplyDetectionJobStatus, jobType: j.jobType as ReplyDetectionJobType, attempts: 0, errorCount: 0 } as any))).returning();
  console.log(`[ReplyDetectionQueue] Created ${jobs.length} bulk detection jobs`);
  return jobs;
}
