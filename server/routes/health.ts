/**
 * Health Check Endpoints
 * Provides system health and capacity information
 */

import { Router, Request, Response } from "express";
import { getPoolMetrics } from "../db";
import { getCapacityMetrics } from "../services/capacity-monitor";
import { cacheService } from "../services/cache-service";
import { followUpEngine } from "../services/follow-up-engine";
import { getSchedulerStatus } from "../services/workflow-scheduler";
import { SequenceAutomationService } from "../sequence-automation";

export const healthRouter = Router();

/**
 * Basic health check
 * GET /api/health
 */
healthRouter.get("/", async (req: Request, res: Response) => {
    try {
        // Quick pool check
        const poolMetrics = getPoolMetrics();
        const isHealthy = poolMetrics.errors < 10 && poolMetrics.active < poolMetrics.max;

        res.status(isHealthy ? 200 : 503).json({
            status: isHealthy ? "healthy" : "degraded",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    } catch (error) {
        res.status(503).json({
            status: "error",
            message: "Health check failed",
        });
    }
});

/**
 * Database health check
 * GET /api/health/db
 */
healthRouter.get("/db", async (req: Request, res: Response) => {
    try {
        const metrics = getPoolMetrics();

        res.json({
            status: "ok",
            pool: {
                active: metrics.active,
                max: metrics.max,
                idle: metrics.idle,
                waiting: metrics.waiting,
                utilization: metrics.utilizationPercent,
            },
            errors: metrics.errors,
        });
    } catch (error: any) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * Capacity metrics
 * GET /api/health/capacity
 */
healthRouter.get("/capacity", async (req: Request, res: Response) => {
    try {
        const metrics = getCapacityMetrics();

        res.json({
            status: metrics.system.healthy ? "healthy" : "warning",
            ...metrics,
        });
    } catch (error: any) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * Detailed system diagnostics (admin only)
 * GET /api/health/detailed
 */
healthRouter.get("/detailed", async (req: Request, res: Response) => {
    try {
        // In production, you'd want to add authentication here
        // For now, it's open for testing purposes

        const poolMetrics = getPoolMetrics();
        const cacheStats = cacheService.getStats();
        const capacityMetrics = getCapacityMetrics();

        res.json({
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            process: {
                memoryUsage: process.memoryUsage(),
                pid: process.pid,
                nodeVersion: process.version,
            },
            database: {
                pool: poolMetrics,
            },
            cache: cacheStats,
            capacity: capacityMetrics,
        });
    } catch (error: any) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * Cache management endpoints (admin only)
 */

// Clear cache
healthRouter.post("/cache/clear", async (req: Request, res: Response) => {
    try {
        cacheService.clear();
        res.json({
            status: "ok",
            message: "Cache cleared successfully",
        });
    } catch (error: any) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

// Get cache stats
healthRouter.get("/cache/stats", async (req: Request, res: Response) => {
    try {
        const stats = cacheService.getStats();
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

/**
 * Automation Agents Status
 * GET /api/health/agents
 * Returns the status of all background automation agents
 */
healthRouter.get("/agents", async (req: Request, res: Response) => {
    try {
        // Follow-up Engine status
        const followUpStats = await followUpEngine.getStats();
        const followUpStatus = {
            running: followUpEngine.isActive(),
            activeJobs: followUpEngine.getActiveJobCount(),
            stats: followUpStats,
        };

        // Workflow Scheduler status
        const workflowStatus = await getSchedulerStatus();

        // Sequence Automation status
        const sequenceStatus = SequenceAutomationService.getStatus();

        res.json({
            timestamp: new Date().toISOString(),
            agents: {
                followUpEngine: {
                    name: "Follow-Up Engine",
                    description: "Processes follow-up email sequences",
                    ...followUpStatus,
                },
                workflowScheduler: {
                    name: "Workflow Scheduler",
                    description: "Executes scheduled workflows",
                    ...workflowStatus,
                },
                sequenceAutomation: {
                    name: "Sequence Automation",
                    description: "Processes sequence steps",
                    ...sequenceStatus,
                },
            },
        });
    } catch (error: any) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});
