// Reference: blueprint:javascript_database
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Connection pool metrics
let activeConnections = 0;
let totalConnectionsCreated = 0;
let connectionErrors = 0;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // Scaled for 1500 concurrent users
  // Each user may hold a connection briefly during requests
  max: 50,

  // Minimum connections to keep in pool (always warm)
  min: 5,

  // Keep connections alive longer to reduce reconnection overhead  
  idleTimeoutMillis: 60000, // 1 minute

  // Faster connection timeout for quicker failover
  connectionTimeoutMillis: 5000, // 5 seconds

  // Maximum time a query can run before being terminated
  statement_timeout: 30000, // 30 seconds

  // Maximum lifetime of a connection before forced recreation
  maxLifetimeSeconds: 3600, // 1 hour
});

// Connection pool event monitoring
pool.on('connect', (client) => {
  activeConnections++;
  totalConnectionsCreated++;
  console.log(`[DB] Connection acquired. Active: ${activeConnections}/${pool.options.max}`);
});

pool.on('remove', (client) => {
  activeConnections--;
  console.log(`[DB] Connection released. Active: ${activeConnections}/${pool.options.max}`);
});

pool.on('error', (err, client) => {
  connectionErrors++;
  console.error('[DB] Unexpected database pool error:', err);
  console.error('[DB] Error count:', connectionErrors);
});

// Log pool statistics every 5 minutes
setInterval(() => {
  console.log('[DB] Pool Statistics:', {
    active: activeConnections,
    max: pool.options.max,
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
    totalCreated: totalConnectionsCreated,
    errors: connectionErrors,
  });
}, 5 * 60 * 1000);

// Export pool metrics for health checks
export function getPoolMetrics() {
  return {
    active: activeConnections,
    max: pool.options.max || 50,
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
    totalCreated: totalConnectionsCreated,
    errors: connectionErrors,
    utilizationPercent: ((activeConnections / (pool.options.max || 50)) * 100).toFixed(2),
  };
}

export const db = drizzle({ client: pool, schema });
