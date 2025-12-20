import type { Request, Response } from 'express';
import { checkSendingThrottle, getRandomizedDelay, getNextAvailableSendTime, calculateBatchSchedule } from '../../deliverability/sending-throttle';

export async function handleThrottleStatus(req: any, res: Response) {
  try { const userId = req.session.userId; const result = await checkSendingThrottle(userId); console.log(`[Deliverability] Throttle check: canSend=${result.canSend}, sentToday=${result.dailyCount}, limit=${result.dailyLimit}`); res.json({ canSend: result.canSend, sentToday: result.dailyCount || 0, dailyLimit: result.dailyLimit || 100, reason: result.reason, waitTimeMs: result.waitTimeMs }); } catch (error) { console.error('[Deliverability] Throttle check error:', error); res.status(500).json({ error: 'Failed to check sending throttle' }); }
}

export async function handleScheduleBatch(req: any, res: Response) {
  try { const { emailCount, config } = req.body; const userId = req.session.userId; if (!emailCount || emailCount <= 0) return res.status(400).json({ error: 'Valid emailCount is required' }); const schedule = await calculateBatchSchedule(emailCount, userId, config); console.log(`[Deliverability] Batch schedule: ${emailCount} emails, first at ${schedule[0]}, last at ${schedule[schedule.length - 1]}`); res.json({ schedule, totalDurationMs: schedule[schedule.length - 1].getTime() - schedule[0].getTime(), estimatedCompletionTime: schedule[schedule.length - 1] }); } catch (error) { console.error('[Deliverability] Batch schedule error:', error); res.status(500).json({ error: 'Failed to calculate batch schedule' }); }
}

export async function handleNextSendTime(req: any, res: Response) {
  try { const userId = req.session.userId; const nextTime = await getNextAvailableSendTime(userId); console.log(`[Deliverability] Next send time: ${nextTime}`); res.json({ nextAvailableTime: nextTime, waitTimeMs: nextTime.getTime() - Date.now() }); } catch (error) { console.error('[Deliverability] Next send time error:', error); res.status(500).json({ error: 'Failed to get next send time' }); }
}

export async function handleRandomDelay(req: any, res: Response) {
  try { const delay = getRandomizedDelay(); res.json({ delay, minDelay: 3000, maxDelay: 8000 }); } catch (error) { console.error('[Deliverability] Random delay error:', error); res.status(500).json({ error: 'Failed to get random delay' }); }
}
