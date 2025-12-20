import { Router, Request, Response } from "express";
import { FOLLOW_UP_STRATEGIES } from "../ai/follow-up";

const router = Router();

/**
 * Get AI-recommended follow-up timing based on best practices.
 * Always returns recommended next follow-up times based on the sequence.
 */
router.get("/api/follow-up/recommendations", async (req: Request, res: Response) => {
    try {
        const { sequenceNumber = 1, lastSentAt } = req.query;
        const seqNum = parseInt(sequenceNumber as string, 10) || 1;

        const timing = FOLLOW_UP_STRATEGIES.timing;
        const sequence = timing.sequence;
        const currentStep = sequence[Math.min(seqNum - 1, sequence.length - 1)];

        // Calculate recommended follow-up date
        const baseDate = lastSentAt ? new Date(lastSentAt as string) : new Date();
        const recommendedDate = new Date(baseDate);
        recommendedDate.setDate(recommendedDate.getDate() + currentStep.day);

        // Set optimal time (10 AM is the sweet spot based on strategies)
        const optimalHour = timing.optimalHours.morning[0] || 10;
        recommendedDate.setHours(optimalHour, 0, 0, 0);

        // Find the next best day (Tuesday or Thursday)
        const bestDays = timing.bestDays;
        const dayOfWeek = recommendedDate.getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        let daysToAdd = 0;
        for (let i = 0; i < 7; i++) {
            const checkDay = (dayOfWeek + i) % 7;
            if (bestDays.includes(dayNames[checkDay])) {
                daysToAdd = i;
                break;
            }
        }

        if (daysToAdd > 0 && daysToAdd <= 2) {
            recommendedDate.setDate(recommendedDate.getDate() + daysToAdd);
        }

        res.json({
            success: true,
            recommendation: {
                sequenceNumber: seqNum,
                type: currentStep.type,
                expectedResponseBoost: currentStep.responseBoost,
                recommendedDate: recommendedDate.toISOString(),
                recommendedTime: `${optimalHour}:00`,
                bestDays: timing.bestDays,
                bestHours: {
                    morning: timing.optimalHours.morning,
                    afternoon: timing.optimalHours.afternoon,
                },
                psychology: currentStep.cognitiveBias,
                message: `Send follow-up ${seqNum} around ${recommendedDate.toLocaleDateString()} at ${optimalHour}:00 AM for ${currentStep.responseBoost} higher response rate`,
            },
            nextSteps: sequence.map((step: any, index: number) => ({
                stepNumber: index + 1,
                daysAfterOriginal: step.day,
                type: step.type,
                responseBoost: step.responseBoost,
            })),
            autoFollowUpEnabled: true,
            stopOnReply: true,
        });
    } catch (error: any) {
        console.error("[API] Error getting follow-up recommendations:", error);
        res.status(500).json({
            success: false,
            error: error?.message || "Failed to get recommendations"
        });
    }
});

/**
 * Get the optimal follow-up schedule for a specific email/contact.
 */
router.get("/api/follow-up/schedule/:emailId", async (req: Request, res: Response) => {
    try {
        const emailId = parseInt(req.params.emailId, 10);
        if (isNaN(emailId)) {
            return res.status(400).json({ error: "Invalid email ID" });
        }

        const timing = FOLLOW_UP_STRATEGIES.timing;
        const sequence = timing.sequence;
        const now = new Date();

        const schedule = sequence.map((step: any, index: number) => {
            const followUpDate = new Date(now);
            followUpDate.setDate(followUpDate.getDate() + step.day);
            followUpDate.setHours(timing.optimalHours.morning[0] || 10, 0, 0, 0);

            return {
                stepNumber: index + 1,
                type: step.type,
                scheduledFor: followUpDate.toISOString(),
                responseBoost: step.responseBoost,
                cognitiveBias: step.cognitiveBias,
            };
        });

        res.json({
            emailId,
            autoEnabled: true,
            stopConditions: {
                onReply: true,
                onOpen: false,
                onClick: false,
                onMeeting: true,
            },
            schedule,
            message: "Follow-ups will automatically stop if the contact replies",
        });
    } catch (error: any) {
        console.error("[API] Error getting follow-up schedule:", error);
        res.status(500).json({ error: error?.message || "Failed to get schedule" });
    }
});

export default router;
