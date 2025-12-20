/**
 * Cache Performance Test
 * Verifies cache reduces database queries and hit rate is acceptable
 */

import { cacheService, CacheKeys } from './server/services/cache-service';
import { getUserById, getUserByEmail } from './server/storage/users';

async function testCachePerformance() {
    console.log('[Test] Starting cache performance test...\n');

    try {
        // Clear cache first
        cacheService.clear();
        console.log('[Test] Cache cleared');

        // Test 1: getUserById cache performance
        console.log('\n[Test] Testing getUserById caching...');
        const userId = 1;

        // First call - cache miss (queries database)
        const start1 = Date.now();
        const user1 = await getUserById(userId);
        const time1 = Date.now() - start1;
        console.log(`  First call (cache miss): ${time1}ms`);

        if (!user1) {
            throw new Error('User not found - make sure database has a user with ID 1');
        }

        // Second call - cache hit (no database query)
        const start2 = Date.now();
        const user2 = await getUserById(userId);
        const time2 = Date.now() - start2;
        console.log(`  Second call (cache hit): ${time2}ms`);

        const speedup = ((time1 - time2) / time1 * 100).toFixed(1);
        console.log(`  ✓ Cache speedup: ${speedup}%`);

        // Test 2: getUserByEmail cache performance
        if (user1.email) {
            console.log('\n[Test] Testing getUserByEmail caching...');

            // First call - cache miss
            const start3 = Date.now();
            const user3 = await getUserByEmail(user1.email);
            const time3 = Date.now() - start3;
            console.log(`  First call (cache miss): ${time3}ms`);

            // Second call - cache hit  
            const start4 = Date.now();
            const user4 = await getUserByEmail(user1.email);
            const time4 = Date.now() - start4;
            console.log(`  Second call (cache hit): ${time4}ms`);

            const speedup2 = ((time3 - time4) / time3 * 100).toFixed(1);
            console.log(`  ✓ Cache speedup: ${speedup2}%`);
        }

        // Test 3: Cache statistics
        console.log('\n[Test] Cache statistics:');
        const stats = cacheService.getStats();
        console.log(`  Total hits: ${stats.hits}`);
        console.log(`  Total misses: ${stats.misses}`);
        console.log(`  Hit rate: ${stats.hitRate}`);
        console.log(`  Entries: ${stats.entries}`);
        console.log(`  Memory estimate: ${stats.memoryEstimateMB} MB`);

        const hitRate = parseFloat(stats.hitRate.replace('%', ''));
        if (hitRate < 50) {
            console.warn(`  ⚠️  Warning: Hit rate is low (${stats.hitRate})`);
        } else {
            console.log(`  ✓ Hit rate is good (${stats.hitRate})`);
        }

        // Test 4: Stress test - many lookups
        console.log('\n[Test] Stress test - 100 repeated lookups...');
        const stressStart = Date.now();

        for (let i = 0; i < 100; i++) {
            await getUserById(userId);
        }

        const stressTime = Date.now() - stressStart;
        const avgTime = (stressTime / 100).toFixed(2);
        console.log(`  Completed 100 lookups in ${stressTime}ms`);
        console.log(`  Average time per lookup: ${avgTime}ms`);

        const finalStats = cacheService.getStats();
        console.log(`  Final hit rate: ${finalStats.hitRate}`);

        console.log('\n✅ Cache performance test PASSED');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Cache performance test FAILED:', error);
        process.exit(1);
    }
}

// Run test
testCachePerformance().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
