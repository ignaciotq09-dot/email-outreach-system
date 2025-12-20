/**
 * SMS Optimization Routes
 * POST /api/sms/optimize - Optimize a message for SMS
 */

import { Express } from "express";
import { z } from "zod";
import { requireAuth } from "./schemas";
import { optimizeSms, quickOptimize } from "../../ai/sms-optim";

const optimizeRequestSchema = z.object({
    baseMessage: z.string().min(1, "Message is required"),
    recipientFirstName: z.string().optional(),
    recipientCompany: z.string().optional(),
    recipientPosition: z.string().optional(),
    context: z.enum(['sales', 'non-sales', 'reminder', 'follow-up']).optional(),
    urgency: z.enum(['low', 'medium', 'high']).optional(),
    useAI: z.boolean().optional().default(true),
    // Personalization signals
    hasTriggerEvent: z.boolean().optional(),
    hasMutualConnection: z.boolean().optional(),
    hasRecentActivity: z.boolean().optional(),
});

export function registerOptimizeRoutes(app: Express) {
    /**
     * Optimize a base message for SMS
     * Uses AI to compress and optimize for high engagement
     * Dynamic rules based on context, recipient, and personalization data
     */
    app.post("/api/sms/optimize", requireAuth, async (req: any, res: any) => {
        try {
            const validated = optimizeRequestSchema.parse(req.body);

            if (validated.useAI) {
                // Full AI optimization with dynamic rules
                const result = await optimizeSms({
                    baseMessage: validated.baseMessage,
                    recipientFirstName: validated.recipientFirstName,
                    recipientCompany: validated.recipientCompany,
                    recipientPosition: validated.recipientPosition,
                    context: validated.context,
                    urgency: validated.urgency,
                    hasTriggerEvent: validated.hasTriggerEvent,
                    hasMutualConnection: validated.hasMutualConnection,
                    hasRecentActivity: validated.hasRecentActivity,
                });

                console.log(`[SMS] Optimized: ${result.charCount}/${result.maxChars} chars, hook score: ${result.hookScore}/100`);

                return res.json(result);
            } else {
                // Quick rule-based optimization (no AI call)
                const optimized = quickOptimize(validated.baseMessage, validated.recipientFirstName);

                return res.json({
                    optimizedMessage: optimized,
                    charCount: optimized.length,
                    segmentCount: Math.ceil(optimized.length / 160),
                    hookPreview: optimized.slice(0, 40),
                    warnings: [],
                    suggestions: [],
                });
            }

        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: "Invalid request", details: error.errors });
            }

            console.error("[SMS] Error optimizing message:", error);
            return res.status(500).json({ error: "Failed to optimize SMS message" });
        }
    });

    /**
     * Batch optimize multiple messages (for multi-contact campaigns)
     */
    app.post("/api/sms/optimize-batch", requireAuth, async (req: any, res: any) => {
        try {
            const { messages, context } = req.body;

            if (!Array.isArray(messages) || messages.length === 0) {
                return res.status(400).json({ error: "messages array is required" });
            }

            if (messages.length > 25) {
                return res.status(400).json({ error: "Maximum 25 messages per batch" });
            }

            const results = await Promise.all(
                messages.map(async (msg: { baseMessage: string; recipientFirstName?: string; recipientCompany?: string }) => {
                    try {
                        return await optimizeSms({
                            baseMessage: msg.baseMessage,
                            recipientFirstName: msg.recipientFirstName,
                            recipientCompany: msg.recipientCompany,
                            context,
                        });
                    } catch (error) {
                        return {
                            optimizedMessage: quickOptimize(msg.baseMessage, msg.recipientFirstName),
                            charCount: msg.baseMessage.length,
                            segmentCount: 1,
                            hookPreview: msg.baseMessage.slice(0, 40),
                            warnings: ['Optimization failed - used fallback'],
                            suggestions: [],
                            error: true,
                        };
                    }
                })
            );

            return res.json({ results });

        } catch (error) {
            console.error("[SMS] Error in batch optimization:", error);
            return res.status(500).json({ error: "Failed to optimize messages" });
        }
    });
}
