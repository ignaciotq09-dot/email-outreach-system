import type { Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { replies, sentEmails } from "@shared/schema";
import { getRepliesWithAppointments, calculateStats, filterReplies } from "./helpers";
import { z } from "zod";

// Strict validation schema for reply status
const replyStatusSchema = z.enum(['new', 'handled', 'archived']);

export async function getReplies(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const limit = parseInt(req.query.limit as string) || 10000; const offset = parseInt(req.query.offset as string) || 0;
    const filter = req.query.filter as string || 'all';
    console.log(`[InboxReplies] User ${userId}: Fetching replies with filter=${filter}, limit=${limit}`);
    const repliesWithAppointments = await getRepliesWithAppointments(userId);
    const stats = calculateStats(repliesWithAppointments);
    const filteredReplies = filterReplies(repliesWithAppointments, filter);
    const paginatedReplies = filteredReplies.slice(offset, offset + limit);
    console.log(`[InboxReplies] User ${userId}: Returning ${paginatedReplies.length} replies (filter=${filter}), stats:`, stats);
    res.json({ replies: paginatedReplies, stats, total: filteredReplies.length });
  } catch (error) { console.error('Error fetching replies:', error); res.status(500).json({ error: 'Failed to fetch replies' }); }
}

export async function getStats(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const repliesWithAppointments = await getRepliesWithAppointments(userId);
    const stats = calculateStats(repliesWithAppointments);
    console.log(`[InboxStats] User ${userId}: Stats calculated from ${repliesWithAppointments.length} replies:`, stats);
    res.json(stats);
  } catch (error) { console.error('Error fetching inbox stats:', error); res.status(500).json({ error: 'Failed to fetch inbox stats' }); }
}

export async function updateReplyStatus(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const replyId = parseInt(req.params.id);

    // Strict validation using Zod schema
    const validation = replyStatusSchema.safeParse(req.body.status);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: new, handled, archived' });
    }
    const status = validation.data;

    const [existingReply] = await db.select().from(replies).where(and(eq(replies.id, replyId), eq(replies.userId, userId)));
    if (!existingReply) return res.status(404).json({ error: 'Reply not found' });
    const [updatedReply] = await db.update(replies).set({ status }).where(eq(replies.id, replyId)).returning();
    console.log(`[Inbox] Updated reply ${replyId} status to ${status} for user ${userId}`);
    res.json(updatedReply);
  } catch (error) { console.error('Error updating reply status:', error); res.status(500).json({ error: 'Failed to update reply status' }); }
}

// Mark all replies as read/handled for a user
export async function markAllRead(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await db.update(replies)
      .set({ status: 'handled' })
      .where(and(eq(replies.userId, userId), eq(replies.status, 'new')));

    console.log(`[Inbox] Marked all replies as read for user ${userId}`);
    res.json({ success: true, message: 'All replies marked as read' });
  } catch (error) {
    console.error('Error marking all replies as read:', error);
    res.status(500).json({ error: 'Failed to mark all replies as read' });
  }
}

// Archive a specific reply
export async function archiveReply(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const replyId = parseInt(req.params.id);

    const [existingReply] = await db.select().from(replies)
      .where(and(eq(replies.id, replyId), eq(replies.userId, userId)));

    if (!existingReply) return res.status(404).json({ error: 'Reply not found' });

    const [archivedReply] = await db.update(replies)
      .set({ status: 'archived' })
      .where(eq(replies.id, replyId))
      .returning();

    console.log(`[Inbox] Archived reply ${replyId} for user ${userId}`);
    res.json(archivedReply);
  } catch (error) {
    console.error('Error archiving reply:', error);
    res.status(500).json({ error: 'Failed to archive reply' });
  }
}
