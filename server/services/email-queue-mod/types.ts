import type { Contact } from '@shared/schema';
export interface QueuedEmail { id: string; contact: Contact; variant: { subject: string; body: string; approach?: string }; campaignId?: number; priority: number; retries: number; createdAt: Date; userId: number; }
export interface QueueStats { pending: number; processing: number; completed: number; failed: number; rate: number; estimatedTimeRemaining: number; }
