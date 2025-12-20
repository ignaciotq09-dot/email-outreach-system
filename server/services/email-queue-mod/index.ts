import { EventEmitter } from 'events';
import type { Contact } from '@shared/schema';
import type { QueuedEmail, QueueStats } from './types';
import { RateLimiter } from './rate-limiter';
import { processEmail } from './processor';
export * from './types';

export class EmailQueueService extends EventEmitter {
  private queue: QueuedEmail[] = []; private processing = new Set<string>(); private completed = 0; private failed = 0; private startTime: Date | null = null; private readonly MAX_CONCURRENT = 2; private readonly BATCH_SIZE = 50; private rateLimiter = new RateLimiter();
  constructor() { super(); this.startProcessing(); }
  async addBatch(contacts: Contact[], variant: any, userId: number, campaignId?: number, priority: number = 5): Promise<string[]> { const ids: string[] = []; for (const contact of contacts) { const id = `${Date.now()}-${contact.id}`; this.queue.push({ id, contact, variant, campaignId, priority, retries: 0, createdAt: new Date(), userId }); ids.push(id); } this.queue.sort((a, b) => b.priority - a.priority); if (!this.startTime) this.startTime = new Date(); this.emit('batch-added', { count: contacts.length, ids }); console.log(`[EmailQueue] Added ${contacts.length} emails to queue`); return ids; }
  private async startProcessing() { setInterval(async () => { await this.processNext(); }, 400); }
  private async processNext() { if (!this.rateLimiter.canSend()) return; const toProcess = this.getNextEmails(); if (toProcess.length === 0) return; await Promise.all(toProcess.map(email => this.executeProcessEmail(email))); }
  private getNextEmails(): QueuedEmail[] { const available = this.queue.filter(e => !this.processing.has(e.id)); const batch = available.slice(0, this.MAX_CONCURRENT - this.processing.size); batch.forEach(e => this.processing.add(e.id)); return batch; }
  private async executeProcessEmail(email: QueuedEmail) { await processEmail(email, { onSuccess: (result) => { this.completed++; this.rateLimiter.incrementSendCount(); this.queue = this.queue.filter(e => e.id !== email.id); this.processing.delete(email.id); this.emit('email-sent', { id: email.id, contactId: email.contact.id, ...result }); }, onFailure: (error, retries) => { email.retries++; if (email.retries < 3) { this.queue = this.queue.filter(e => e.id !== email.id); this.queue.push(email); } else { this.failed++; this.queue = this.queue.filter(e => e.id !== email.id); this.emit('email-failed', { id: email.id, contactId: email.contact.id, error: error.message, retries: email.retries }); } this.processing.delete(email.id); } }); }
  getStats(): QueueStats { const elapsedMinutes = this.startTime ? (Date.now() - this.startTime.getTime()) / 60000 : 0; const rate = elapsedMinutes > 0 ? Math.round(this.completed / elapsedMinutes) : 0; const estimatedTimeRemaining = rate > 0 ? Math.round((this.queue.length / rate) * 60) : 0; return { pending: this.queue.length, processing: this.processing.size, completed: this.completed, failed: this.failed, rate, estimatedTimeRemaining }; }
  clear() { this.queue = []; this.processing.clear(); this.completed = 0; this.failed = 0; this.startTime = null; this.rateLimiter.resetSendCount(); this.emit('queue-cleared'); }
}

export const emailQueue = new EmailQueueService();
