export interface SmsOverviewMetrics { totalSent: number; totalDelivered: number; responseRate: number; optOutRate: number; totalOptOuts: number; totalReplies: number; }
export interface SmsTrendData { date: string; sent: number; delivered: number; failed: number; }
export interface SmsResponseTrendData { date: string; sent: number; replied: number; responseRate: number; }
export interface SmsDeliverabilityMetrics { hasEnoughData: boolean; totalSent: number; deliveryRate: number; failureRate: number; pendingRate: number; errorBreakdown: { code: string; count: number; message: string }[]; }
export interface SmsDailyMetrics { days: number; data: { date: string; totalSent: number; totalDelivered: number; totalFailed: number }[]; }
export interface SmsCampaignMetrics { campaignId: number; subject: string; smsSent: number; smsDelivered: number; smsFailed: number; smsDeliveryRate: number; }
