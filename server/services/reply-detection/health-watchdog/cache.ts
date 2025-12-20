import type { EmailProvider, LayerHealthStatus } from "../types";
const healthCache = new Map<string, { status: LayerHealthStatus; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

export function getCacheKey(userId: number, provider: EmailProvider): string { return `${userId}:${provider}`; }
export function getCachedHealth(userId: number, provider: EmailProvider): LayerHealthStatus | null { const key = getCacheKey(userId, provider); const cached = healthCache.get(key); if (cached && cached.expiresAt > Date.now()) return cached.status; healthCache.delete(key); return null; }
export function cacheHealthStatus(userId: number, provider: EmailProvider, status: LayerHealthStatus): void { const key = getCacheKey(userId, provider); healthCache.set(key, { status, expiresAt: Date.now() + CACHE_TTL_MS }); }
export function clearHealthCache(userId: number, provider?: EmailProvider): void { if (provider) { healthCache.delete(getCacheKey(userId, provider)); } else { for (const key of healthCache.keys()) { if (key.startsWith(`${userId}:`)) healthCache.delete(key); } } }
export function getAllHealthStatuses(): Map<string, LayerHealthStatus> { const statuses = new Map<string, LayerHealthStatus>(); const now = Date.now(); for (const [key, cached] of healthCache.entries()) { if (cached.expiresAt > now) statuses.set(key, cached.status); } return statuses; }
