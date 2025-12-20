import { Response } from "express";
import { getSeniorityOptions, getRevenueOptions, getAvailableTechnologies } from "../../services/ai-search/enhanced-apollo";
import { getAvailableIndustries, getCompanySizeOptions } from "../../services/apollo-service";

export async function handleGetFilterOptions(_req: any, res: Response) {
  try { res.json({ success: true, data: { industries: getAvailableIndustries(), companySizes: getCompanySizeOptions(), seniorities: getSeniorityOptions(), revenueRanges: getRevenueOptions(), technologies: getAvailableTechnologies() } }); } catch (error: any) { console.error("[AISearchRoutes] Filter options error:", error); res.status(400).json({ success: false, error: error.message || "Failed to get filter options" }); }
}
