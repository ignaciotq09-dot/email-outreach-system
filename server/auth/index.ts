/**
 * Auth Index
 * Re-exports authentication utilities
 * 
 * Note: Auth routes are registered separately in server/routes.ts
 * This file only exports reusable auth utilities
 */

export { requireAuth } from './middleware';
export { createSessionMiddleware } from './session';
