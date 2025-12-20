import { Request, Response } from 'express';
import { z } from 'zod';
import * as calendarService from '../../services/calendar-service';

export async function checkAvailability(req: Request, res: Response) { try { if (!req.user) return res.status(401).json({ error: 'Unauthorized' }); const querySchema = z.object({ timeMin: z.string(), timeMax: z.string() }); const { timeMin, timeMax } = querySchema.parse(req.query); const busySlots = await calendarService.checkAvailability(req.user.id, timeMin, timeMax); res.json({ busySlots }); } catch (error: any) { console.error('Error checking availability:', error); res.status(400).json({ error: error.message || 'Failed to check availability' }); } }

export async function findAvailableSlots(req: Request, res: Response) { try { if (!req.user) return res.status(401).json({ error: 'Unauthorized' }); const querySchema = z.object({ startDate: z.string(), endDate: z.string(), duration: z.string().optional() }); const { startDate, endDate, duration } = querySchema.parse(req.query); const durationMinutes = parseInt(duration || '30'); const slots = await calendarService.findAvailableSlots(req.user.id, startDate, endDate, durationMinutes); res.json({ slots }); } catch (error: any) { console.error('Error finding available slots:', error); res.status(400).json({ error: error.message || 'Failed to find available slots' }); } }
