import { z } from "zod";
export const updateCampaignSchema = z.object({ subject: z.string().optional(), body: z.string().optional(), writingStyle: z.string().optional(), status: z.enum(['draft', 'active', 'paused', 'completed']).optional() });
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
