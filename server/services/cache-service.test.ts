import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheService } from './cache-service';

describe('CacheService', () => {
    let cache: CacheService;

    beforeEach(() => {
        // Create a small cache for testing
        // Max 3 entries, 100ms TTL
        cache = new CacheService(3, 0.0016); // 0.0016 mins ~= 100ms
    });

    it('should set and get values', () => {
        cache.set('key1', 'value1');
        expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for missing keys', () => {
        expect(cache.get('missing')).toBeNull();
    });

    it('should track hits and misses', () => {
        cache.set('key1', 'value1');

        cache.get('key1'); // Hit
        cache.get('missing'); // Miss

        const stats = cache.getStats();
        expect(stats.hits).toBe(1);
        expect(stats.misses).toBe(1);
    });

    it('should evict items when max size is exceeded (LRU)', () => {
        cache.set('1', 'one');
        cache.set('2', 'two');
        cache.set('3', 'three');

        // Use '1' to make it recently used
        cache.get('1');

        // Add 4th item, should evict least recently used (which is '2' now, since '1' was accessed, wait. 
        // 1 set, 2 set, 3 set. 
        // 1 accessed. Order: 2, 3, 1 (MRU). 
        // 4 set -> 2 should be evicted? LRU cache v5 behavior:
        // Cache is 2, 3, 1. Evict 2?
        // Let's verify.
        cache.set('4', 'four');

        expect(cache.get('2')).toBeNull(); // Should be evicted
        expect(cache.get('1')).toBe('one'); // Should be kept
        expect(cache.get('4')).toBe('four'); // Should be kept
        expect(cache.get('3')).toBe('three'); // Should be kept
    });

    it('should expire items after TTL', async () => {
        cache.set('key1', 'value1');
        expect(cache.get('key1')).toBe('value1');

        // Wait for >100ms
        await new Promise(resolve => setTimeout(resolve, 150));

        expect(cache.get('key1')).toBeNull();
    });

    it('should delete items by pattern', () => {
        cache.set('user:1', 'data');
        cache.set('user:2', 'data');
        cache.set('post:1', 'data');

        const deleted = cache.deletePattern('^user:');

        expect(deleted).toBe(2);
        expect(cache.get('user:1')).toBeNull();
        expect(cache.get('user:2')).toBeNull();
        expect(cache.get('post:1')).toBe('data');
    });
});
