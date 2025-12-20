/**
 * Capacity Monitor - Track system resources for 1500+ concurrent users
 */

import { getPoolMetrics } from "../db";
import { cacheService } from "./cache-service";

export interface SystemCapacity {
    users: {
        estimated: number;
        activeConnections: number;
    };
    database: {
        connectionPool: {
            active: number;
            max: number;
            idle: number;
            waiting: number;
            utilizationPercent: string;
        };
        healthy: boolean;
        errors: number;
    };
    cache: {
        hits: number;
        misses: number;
        entries: number;
        hitRate: string;
        memoryEstimateMB: number;
    };
    system: {
        healthy: boolean;
        warnings: string[];
    };
}

/**
 * Get current system capacity metrics
 */
export function getCapacityMetrics(): SystemCapacity {
    const poolMetrics = getPoolMetrics();
    const cacheStats = cacheService.getStats();

    const warnings: string[] = [];

    // Check for capacity warnings
    const utilization = parseFloat(poolMetrics.utilizationPercent);
    if (utilization > 80) {
        warnings.push(`Database connection pool at ${utilization}% capacity`);
    }

    if (poolMetrics.errors > 10) {
        warnings.push(`Database has ${poolMetrics.errors} connection errors`);
    }

    const cacheHitRate = parseFloat(cacheStats.hitRate.replace('%', ''));
    if (cacheHitRate < 60) {
        warnings.push(`Cache hit rate low: ${cacheStats.hitRate}`);
    }

    const isHealthy = warnings.length === 0;

    return {
        users: {
            estimated: poolMetrics.active * 30, // Rough estimate: each connection serves ~30 users over time
            activeConnections: poolMetrics.active,
        },
        database: {
            connectionPool: {
                active: poolMetrics.active,
                max: poolMetrics.max,
                idle: poolMetrics.idle,
                waiting: poolMetrics.waiting,
                utilizationPercent: poolMetrics.utilizationPercent,
            },
            healthy: poolMetrics.errors < 10,
            errors: poolMetrics.errors,
        },
        cache: cacheStats,
        system: {
            healthy: isHealthy,
            warnings,
        },
    };
}

/**
 * Log capacity metrics (called periodically)
 */
export function logCapacityMetrics(): void {
    const metrics = getCapacityMetrics();
    console.log('[Capacity] System Metrics:', JSON.stringify(metrics, null, 2));

    if (!metrics.system.healthy) {
        console.warn('[Capacity] System warnings:', metrics.system.warnings);
    }
}

// Log capacity metrics every 10 minutes
setInterval(logCapacityMetrics, 10 * 60 * 1000);
