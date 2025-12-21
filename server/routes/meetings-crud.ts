import type { Express, Request, Response } from "express";
import { requireAuth } from "../auth/middleware";
import { z } from "zod";

// In-memory meetings storage (per-user session)
// In a production app, this would be stored in a database
const userMeetings: Map<number, any[]> = new Map();

const meetingSchema = z.object({
    title: z.string().min(1),
    attendeeName: z.string().optional().default('New Attendee'),
    company: z.string().optional().default('Company'),
    email: z.string().email().optional().default(''),
    date: z.string(),
    time: z.string(),
    duration: z.string().optional().default('30 min'),
    platform: z.enum(['zoom', 'google-meet', 'teams', 'phone', 'in-person']).optional().default('zoom'),
    meetingLink: z.string().optional(),
    notes: z.string().optional(),
});

export function registerMeetingsRoutes(app: Express): void {
    // Get all meetings for user
    app.get("/api/meetings", requireAuth, async (req: Request, res: Response) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const meetings = userMeetings.get(userId) || [];
            res.json({ meetings });
        } catch (error) {
            console.error('Error fetching meetings:', error);
            res.status(500).json({ error: 'Failed to fetch meetings' });
        }
    });

    // Create a new meeting
    app.post("/api/meetings", requireAuth, async (req: Request, res: Response) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const validation = meetingSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: 'Invalid meeting data', details: validation.error });
            }

            const meeting = {
                id: String(Date.now()),
                ...validation.data,
                status: 'upcoming' as const,
                createdAt: new Date().toISOString(),
            };

            const meetings = userMeetings.get(userId) || [];
            meetings.unshift(meeting);
            userMeetings.set(userId, meetings);

            console.log(`[Meetings] Created meeting "${meeting.title}" for user ${userId}`);
            res.status(201).json(meeting);
        } catch (error) {
            console.error('Error creating meeting:', error);
            res.status(500).json({ error: 'Failed to create meeting' });
        }
    });

    // Update meeting (reschedule, add notes, change status)
    app.put("/api/meetings/:id", requireAuth, async (req: Request, res: Response) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const meetingId = req.params.id;
            const meetings = userMeetings.get(userId) || [];
            const meetingIndex = meetings.findIndex(m => m.id === meetingId);

            if (meetingIndex === -1) {
                return res.status(404).json({ error: 'Meeting not found' });
            }

            const updatedMeeting = { ...meetings[meetingIndex], ...req.body };
            meetings[meetingIndex] = updatedMeeting;
            userMeetings.set(userId, meetings);

            console.log(`[Meetings] Updated meeting ${meetingId} for user ${userId}`);
            res.json(updatedMeeting);
        } catch (error) {
            console.error('Error updating meeting:', error);
            res.status(500).json({ error: 'Failed to update meeting' });
        }
    });

    // Cancel/delete meeting
    app.delete("/api/meetings/:id", requireAuth, async (req: Request, res: Response) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const meetingId = req.params.id;
            const meetings = userMeetings.get(userId) || [];
            const meetingIndex = meetings.findIndex(m => m.id === meetingId);

            if (meetingIndex === -1) {
                return res.status(404).json({ error: 'Meeting not found' });
            }

            // Mark as cancelled instead of deleting
            meetings[meetingIndex].status = 'cancelled';
            userMeetings.set(userId, meetings);

            console.log(`[Meetings] Cancelled meeting ${meetingId} for user ${userId}`);
            res.json({ success: true, message: 'Meeting cancelled' });
        } catch (error) {
            console.error('Error cancelling meeting:', error);
            res.status(500).json({ error: 'Failed to cancel meeting' });
        }
    });
}
