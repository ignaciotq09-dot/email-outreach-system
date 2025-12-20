/**
 * Multi-User Load Test
 * Simulates 100 concurrent users to validate scaling improvements
 */

import { cacheService } from './server/services/cache-service';
import { getUserById, getUserByEmail } from './server/storage/users';
import { getPoolMetrics } from './server/db';

interface TestResult {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
}

async function simulateUser(userId: number, iterations: number): Promise<TestResult> {
    const responseTimes: number[] = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < iterations; i++) {
        const start = Date.now();

        try {
            // Simulate typical user operations
            await getUserById(userId);

            const elapsed = Date.now() - start;
            responseTimes.push(elapsed);
            successful++;

        } catch (error) {
            failed++;
            console.error(`User ${userId} request ${i} failed:`, error);
        }

        // Small delay between requests (10ms)
        await new Promise(resolve => setTimeout(resolve, 10));
    }

    return {
        totalRequests: iterations,
        successfulRequests: successful,
        failedRequests: failed,
        avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        maxResponseTime: Math.max(...responseTimes),
        minResponseTime: Math.min(...responseTimes),
    };
}

async function testMultiUser() {
    console.log('[Test] === Multi-User Load Test ===\n');
    console.log('[Test] Simulating 100 concurrent users with 50 requests each\n');

    try {
        // Clear cache for fair test
        cacheService.clear();

        // Get initial pool stats
        const initialPool = getPoolMetrics();
        console.log('[Test] Initial pool stats:', {
            active: initialPool.active,
            idle: initialPool.idle,
            errors: initialPool.errors,
        });
        console.log('');

        // Simulate 100 concurrent users
        const concurrentUsers = 100;
        const requestsPerUser = 50;
        const userId = 1; // All users query the same user for cache testing

        console.log(`[Test] Starting ${concurrentUsers} concurrent user simulations...`);
        const startTime = Date.now();

        // Create promises for all users
        const userPromises = Array.from({ length: concurrentUsers }, (_, i) =>
            simulateUser(userId, requestsPerUser)
        );

        // Wait for all to complete
        const results = await Promise.all(userPromises);
        const totalTime = Date.now() - startTime;

        // Aggregate results
        const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
        const totalSuccessful = results.reduce((sum, r) => sum + r.successfulRequests, 0);
        const totalFailed = results.reduce((sum, r) => sum + r.failedRequests, 0);
        const avgResponseTime = results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length;
        const maxResponseTime = Math.max(...results.map(r => r.maxResponseTime));
        const minResponseTime = Math.min(...results.map(r => r.minResponseTime));

        // Get final stats
        const finalPool = getPoolMetrics();
        const cacheStats = cacheService.getStats();

        // Print results
        console.log(`\n[Test] === Results ===`);
        console.log(`Total time: ${totalTime}ms`);
        console.log(`Total requests: ${totalRequests}`);
        console.log(`Successful: ${totalSuccessful} (${((totalSuccessful / totalRequests) * 100).toFixed(1)}%)`);
        console.log(`Failed: ${totalFailed} (${((totalFailed / totalRequests) * 100).toFixed(1)}%)`);
        console.log(`Requests per second: ${(totalRequests / (totalTime / 1000)).toFixed(1)}`);
        console.log('');
        console.log(`Response times:`);
        console.log(`  Average: ${avgResponseTime.toFixed(2)}ms`);
        console.log(`  Min: ${minResponseTime.toFixed(2)}ms`);
        console.log(`  Max: ${maxResponseTime.toFixed(2)}ms`);
        console.log('');
        console.log(`Database pool:`);
        console.log(`  Active connections: ${finalPool.active}`);
        console.log(`  Idle connections: ${finalPool.idle}`);
        console.log(`  Waiting: ${finalPool.waiting}`);
        console.log(`  Utilization: ${finalPool.utilizationPercent}`);
        console.log(`  Errors: ${finalPool.errors - initialPool.errors} (during test)`);
        console.log('');
        console.log(`Cache performance:`);
        console.log(`  Hit rate: ${cacheStats.hitRate}`);
        console.log(`  Total hits: ${cacheStats.hits}`);
        console.log(`  Total misses: ${cacheStats.misses}`);
        console.log(`  Entries: ${cacheStats.entries}`);
        console.log(`  Memory: ${cacheStats.memoryEstimateMB} MB`);

        // Validate results
        const errors = [];

        if (totalFailed > totalRequests * 0.01) { // More than 1% failures
            errors.push(`Too many failed requests: ${totalFailed}/${totalRequests}`);
        }

        if (avgResponseTime > 500) { // Average response > 500ms
            errors.push(`Average response time too high: ${avgResponseTime.toFixed(2)}ms`);
        }

        const hitRate = parseFloat(cacheStats.hitRate.replace('%', ''));
        if (hitRate < 70) {
            errors.push(`Cache hit rate too low: ${cacheStats.hitRate}`);
        }

        if (finalPool.errors > initialPool.errors + 5) {
            errors.push(`Too many database errors: ${finalPool.errors - initialPool.errors}`);
        }

        if (errors.length > 0) {
            console.log('\n⚠️  Test completed with warnings:');
            errors.forEach(err => console.log(`  - ${err}`));
            console.log('\n⚠️  Multi-user test completed with WARNINGS');
        } else {
            console.log('\n✅ All metrics within acceptable ranges');
            console.log('\n✅ Multi-user load test PASSED');
        }

        process.exit(errors.length > 0 ? 1 : 0);

    } catch (error) {
        console.error('\n❌ Multi-user load test FAILED:', error);
        process.exit(1);
    }
}

// Run test
testMultiUser().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
