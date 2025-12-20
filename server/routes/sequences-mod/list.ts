import type { Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { followUpSequences } from "@shared/schema";

export async function getSequences(req: Request, res: Response) { try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const sequences = await db.query.followUpSequences.findMany({ where: eq(followUpSequences.userId, userId), orderBy: (followUpSequences, { desc }) => [desc(followUpSequences.createdAt)], with: { sequenceSteps: { orderBy: (sequenceSteps, { asc }) => [asc(sequenceSteps.stepNumber)] } } }); res.json(sequences); } catch (error: any) { console.error('Error fetching sequences:', error); res.status(500).json({ error: 'Failed to fetch sequences' }); } }

export async function getSequenceById(req: Request, res: Response) { try { const userId = req.session.userId; if (!userId) return res.status(401).json({ error: 'Unauthorized' }); const { SequenceAutomationService } = await import("../../sequence-automation"); const sequenceId = parseInt(req.params.id); const [sequence] = await db.select().from(followUpSequences).where(and(eq(followUpSequences.id, sequenceId), eq(followUpSequences.userId, userId))).limit(1); if (!sequence) return res.status(404).json({ error: 'Sequence not found' }); const sequenceWithMetrics = await SequenceAutomationService.getSequenceMetrics(sequenceId); res.json(sequenceWithMetrics); } catch (error: any) { console.error('Error fetching sequence:', error); res.status(500).json({ error: 'Failed to fetch sequence' }); } }
