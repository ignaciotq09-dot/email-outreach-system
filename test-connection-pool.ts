/**
 * Database Connection Pool Test
 * Verifies that the pool can handle 50 concurrent connections
 */

import { pool } from './server/db';

async function testConnectionPool() {
    console.log('[Test] Starting connection pool test...\n');

    const connections: any[] = [];
    const connectionCount = 50;

    try {
        console.log(`[Test] Acquiring ${connectionCount} connections...`);
        const startTime = Date.now();

        // Acquire all connections
        for (let i = 0; i < connectionCount; i++) {
            const client = await pool.connect();
            connections.push(client);

            if ((i + 1) % 10 === 0) {
                console.log(`  Acquired ${i + 1}/${connectionCount} connections`);
            }
        }

        const acquireTime = Date.now() - startTime;
        console.log(`✓ Successfully acquired ${connectionCount} connections in ${acquireTime}ms\n`);

        // Test query execution
        console.log('[Test] Executing test queries...');
        const queryStart = Date.now();

        const queries = connections.map((client, i) => {
            return client.query('SELECT 1 + 1 AS result')
                .then(() => {
                    if ((i + 1) % 10 === 0) {
                        console.log(`  Executed ${i + 1}/${connectionCount} queries`);
                    }
                });
        });

        await Promise.all(queries);
        const queryTime = Date.now() - queryStart;
        console.log(`✓ Executed ${connectionCount} concurrent queries in ${queryTime}ms\n`);

        // Release connections
        console.log('[Test] Releasing connections...');
        connections.forEach(client => client.release());
        console.log(`✓ Released all connections\n`);

        // Verify pool stats
        console.log('[Test] Final pool stats:');
        console.log(`  Total count: ${pool.totalCount}`);
        console.log(`  Idle count: ${pool.idleCount}`);
        console.log(`  Waiting count: ${pool.waitingCount}`);

        console.log('\n✅ Connection pool test PASSED');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Connection pool test FAILED:', error);
        connections.forEach(client => client.release());
        process.exit(1);
    }
}

// Run test
testConnectionPool().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
