import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db';
import { meetingPreferences } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

export async function getPreferences(req: Request, res: Response) { try { if (!req.user) return res.status(401).json({ error: 'Unauthorized' }); const [preferences] = await db.select().from(meetingPreferences).where(eq(meetingPreferences.userId, req.user.id)); res.json(preferences || { userId: req.user.id }); } catch (error: any) { console.error('Error getting meeting preferences:', error); res.status(400).json({ error: error.message || 'Failed to get preferences' }); } }

export async function updatePreferences(req: Request, res: Response) { try { if (!req.user) return res.status(401).json({ error: 'Unauthorized' }); const preferencesSchema = z.object({ defaultDuration: z.number().optional(), defaultLocation: z.string().optional(), defaultTimeZone: z.string().optional(), enableGoogleMeet: z.boolean().optional(), bufferBefore: z.number().optional(), bufferAfter: z.number().optional(), workingHours: z.any().optional() }); const data = preferencesSchema.parse(req.body); const [existing] = await db.select().from(meetingPreferences).where(eq(meetingPreferences.userId, req.user.id)); let preferences; if (existing) { [preferences] = await db.update(meetingPreferences).set({ ...data, updatedAt: new Date() }).where(eq(meetingPreferences.userId, req.user.id)).returning(); } else { [preferences] = await db.insert(meetingPreferences).values({ userId: req.user.id, ...data }).returning(); } res.json(preferences); } catch (error: any) { console.error('Error updating meeting preferences:', error); res.status(400).json({ error: error.message || 'Failed to update preferences' }); } }
