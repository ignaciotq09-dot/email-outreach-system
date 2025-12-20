import { describe, it, expect } from 'vitest';
import { safeOptimizeEmail } from '../ai/email-optim/safe-optimizer';

describe('Safe Email Optimizer', () => {
    it('should not fabricate content for vague inputs', async () => {
        const result = await safeOptimizeEmail(
            'Meeting',
            "hello how are you let's meet Tuesday",
            { name: 'John' }
        );

        // Check for fabrication in suggestions
        const hasFabrication = result.suggestions.some(s =>
            s.suggested.includes('noticed your') ||
            s.suggested.includes('congratulations') ||
            s.suggested.includes('impressive') ||
            s.suggested.includes('I recently came across') ||
            s.suggested.includes("I've been following")
        );

        expect(hasFabrication).toBe(false);
        expect(result.originalEmail.body).toBe("hello how are you let's meet Tuesday");
    });

    it('should provide valid suggestions for good inputs', async () => {
        const result = await safeOptimizeEmail(
            'Quick question about your Series B',
            'Hi John, noticed your company just raised Series B - congrats! Would 15 minutes this week make sense to discuss how we help similar companies scale?',
            { name: 'John', company: 'Acme Inc' }
        );

        expect(result.suggestions).toBeDefined();
        expect(Array.isArray(result.suggestions)).toBe(true);

        // If it has suggestions, they should be valid
        if (result.suggestions.length > 0) {
            result.suggestions.forEach(s => {
                expect(s.isValid).toBe(true);
                expect(s.original).toBeDefined();
                expect(s.suggested).toBeDefined();
            });
        }
    });
});
