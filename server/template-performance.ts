import { db } from "./db";
import { emailTemplates, campaigns, sentEmails, campaignContacts } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Template Performance Tracking Service
 * 
 * Tracks usage and performance metrics for email templates
 */

export class TemplatePerformanceService {
  /**
   * Increment times used counter when template is selected
   */
  static async recordTemplateUsage(templateId: number): Promise<void> {
    try {
      await db
        .update(emailTemplates)
        .set({
          timesUsed: sql`${emailTemplates.timesUsed} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(emailTemplates.id, templateId));

      console.log(`[TemplatePerformance] Template ${templateId} usage recorded`);
    } catch (error) {
      console.error(`[TemplatePerformance] Error recording usage:`, error);
    }
  }

  /**
   * Update template performance metrics based on campaign results
   * Called periodically or after campaign completion
   */
  static async updateTemplateMetrics(templateId: number): Promise<void> {
    try {
      // Get all campaigns using this template
      const campaignStats = await db
        .select({
          totalSent: sql<number>`COUNT(DISTINCT ${sentEmails.id})`,
          totalOpened: sql<number>`COUNT(DISTINCT CASE WHEN ${sentEmails.opened} = true THEN ${sentEmails.id} END)`,
          totalReplied: sql<number>`COUNT(DISTINCT CASE WHEN ${sentEmails.replyReceived} = true THEN ${sentEmails.id} END)`,
        })
        .from(campaigns)
        .leftJoin(campaignContacts, eq(campaignContacts.campaignId, campaigns.id))
        .leftJoin(sentEmails, eq(sentEmails.id, campaignContacts.sentEmailId))
        .where(eq(campaigns.templateId, templateId))
        .groupBy(campaigns.templateId);

      if (campaignStats.length > 0) {
        const stats = campaignStats[0];
        const totalSent = stats.totalSent || 0;
        const totalOpened = stats.totalOpened || 0;
        const totalReplied = stats.totalReplied || 0;

        const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
        const avgReplyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0;

        await db
          .update(emailTemplates)
          .set({
            totalSent,
            totalOpened,
            totalReplied,
            avgOpenRate,
            avgReplyRate,
            updatedAt: new Date(),
          })
          .where(eq(emailTemplates.id, templateId));

        console.log(
          `[TemplatePerformance] Template ${templateId} metrics updated: ` +
          `${totalSent} sent, ${avgOpenRate}% open, ${avgReplyRate}% reply`
        );
      }
    } catch (error) {
      console.error(`[TemplatePerformance] Error updating metrics:`, error);
    }
  }

  /**
   * Update metrics for all templates
   * Can be called periodically via cron job
   */
  static async updateAllTemplateMetrics(): Promise<void> {
    try {
      const templates = await db.select({ id: emailTemplates.id }).from(emailTemplates);

      for (const template of templates) {
        await this.updateTemplateMetrics(template.id);
      }

      console.log(`[TemplatePerformance] Updated metrics for ${templates.length} templates`);
    } catch (error) {
      console.error(`[TemplatePerformance] Error updating all metrics:`, error);
    }
  }

  /**
   * Get top performing templates by open rate for a specific user
   */
  static async getTopTemplates(limit: number = 10, userId?: number) {
    try {
      let query = db
        .select()
        .from(emailTemplates)
        .where(sql`${emailTemplates.totalSent} > 0`);
      
      // Multi-tenant: Filter by userId if provided
      if (userId) {
        query = db
          .select()
          .from(emailTemplates)
          .where(sql`${emailTemplates.totalSent} > 0 AND ${emailTemplates.userId} = ${userId}`);
      }

      const topTemplates = await query
        .orderBy(sql`${emailTemplates.avgOpenRate} DESC`)
        .limit(limit);

      return topTemplates;
    } catch (error) {
      console.error(`[TemplatePerformance] Error fetching top templates:`, error);
      return [];
    }
  }
}
