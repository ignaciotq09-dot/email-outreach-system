/**
 * Test script for Safe Email Optimizer
 * Verifies that the optimizer doesn't fabricate content
 */

import { safeOptimizeEmail } from './server/ai/email-optim/safe-optimizer';

async function runTests() {
    console.log('=== Safe Email Optimizer Tests ===\n');

    // Test 1: Short vague email (should NOT fabricate)
    console.log('Test 1: Short vague email');
    console.log('Input: "hello how are you let\'s meet Tuesday"');
    console.log('-'.repeat(50));

    try {
        const result1 = await safeOptimizeEmail(
            'Meeting',
            'hello how are you let\'s meet Tuesday',
            { name: 'John' }
        );

        console.log('Original preserved:', result1.originalEmail.body);
        console.log('\nSuggestions:');
        for (const s of result1.suggestions) {
            console.log(`  [${s.element}] "${s.original}" → "${s.suggested}"`);
            console.log(`    Reason: ${s.reason}`);
            console.log(`    Valid: ${s.isValid}${s.validationWarning ? ` (Warning: ${s.validationWarning})` : ''}`);
        }
        console.log('\nWarnings:', result1.warnings);

        // Check for fabrication
        const hasFabrication = result1.suggestions.some(s =>
            s.suggested.includes('noticed your') ||
            s.suggested.includes('congratulations') ||
            s.suggested.includes('impressive') ||
            s.suggested.includes('I recently came across') ||
            s.suggested.includes('I\'ve been following')
        );

        console.log('\n❓ Contains fabrication:', hasFabrication ? '❌ YES (FAIL)' : '✅ NO (PASS)');

    } catch (error) {
        console.error('Test 1 failed:', error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Good sales email (should give minimal suggestions)
    console.log('Test 2: Good personalized email');
    console.log('-'.repeat(50));

    try {
        const result2 = await safeOptimizeEmail(
            'Quick question about your Series B',
            'Hi John, noticed your company just raised Series B - congrats! Would 15 minutes this week make sense to discuss how we help similar companies scale?',
            { name: 'John', company: 'Acme Inc' }
        );

        console.log('Score:', result2.analysis.overallScore);
        console.log('Suggestions count:', result2.suggestions.length);

        for (const s of result2.suggestions) {
            console.log(`  [${s.element}] "${s.original?.substring(0, 30)}..." → "${s.suggested.substring(0, 30)}..."`);
            console.log(`    Valid: ${s.isValid}`);
        }

    } catch (error) {
        console.error('Test 2 failed:', error);
    }

    console.log('\n=== Tests Complete ===');
}

runTests().catch(console.error);
