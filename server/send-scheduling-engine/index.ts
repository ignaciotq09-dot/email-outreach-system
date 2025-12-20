import { scheduleCampaign } from "./scheduling";
import { executeCampaignBatch, cancelScheduledCampaign, getCampaignSchedulePreview } from "./execution";
export type { SendOptions } from "./types";

export class SendSchedulingEngine {
  static scheduleCampaign = scheduleCampaign;
  static executeCampaignBatch = executeCampaignBatch;
  static cancelScheduledCampaign = cancelScheduledCampaign;
  static getCampaignSchedulePreview = getCampaignSchedulePreview;
}
