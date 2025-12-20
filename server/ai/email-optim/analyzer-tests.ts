import {
    sanitizeEmailInput,
    detectSpamTriggers,
    detectSuspiciousContent,
    detectComplianceIssues,
    enhancedIntentDetection,
    analyzeGreeting,
    analyzeSignature,
    analyzeLinks,
    analyzeTone,
    analyzeReadability,
    analyzeCTA,
    analyzeSubjectLineDeep,
    detectEmailContext,
    detectTemplateUsage,
    detectLanguage,
    performComprehensiveAnalysis
} from './analyzers.js';

console.log('===================================');
console.log('EMAIL ANALYZER COMPREHENSIVE TESTS');
console.log('===================================\n');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean) {
    try {
        if (fn()) {
            console.log(`✅ ${name}`);
            passed++;
        } else {
            console.log(`❌ ${name}`);
            failed++;
        }
    } catch (error: any) {
        console.log(`❌ ${name} - Error: ${error.message}`);
        failed++;
    }
}

// 1. INPUT VALIDATION TESTS
console.log('\n--- Input Validation Tests ---');

test('Sanitize null input', () => {
    const result = sanitizeEmailInput(null);
    return !result.isValid && result.errors.length > 0;
});

test('Sanitize empty input', () => {
    const result = sanitizeEmailInput('   ');
    return !result.isValid && result.errors.includes('Content is empty');
});

test('Sanitize long input (truncation)', () => {
    const longText = 'a'.repeat(60000);
    const result = sanitizeEmailInput(longText);
    return result.isValid && result.sanitizedContent.length === 50000;
});

test('Sanitize HTML entities', () => {
    const result = sanitizeEmailInput('Hello &amp; goodbye &lt;tag&gt;');
    return result.sanitizedContent.includes('& goodbye <tag>');
});

test('Sanitize excessive whitespace', () => {
    const result = sanitizeEmailInput('Hello     world\n\n\n\nNext');
    return !result.sanitizedContent.includes('     ') && !result.sanitizedContent.includes('\n\n\n');
});

// 2. SPAM DETECTION TESTS
console.log('\n--- Spam Detection Tests ---');

test('Detect spam words', () => {
    const result = detectSpamTriggers('FREE MONEY URGENT ACT NOW!!!');
    return result.triggers.length > 0 && result.score > 20;
});

test('Detect excessive caps', () => {
    const result = detectSpamTriggers('THIS IS ALL CAPS MESSAGE');
    return result.triggers.includes('Excessive capitalization');
});

test('Detect excessive punctuation', () => {
    const result = detectSpamTriggers('Amazing offer!!! Buy now???');
    return result.triggers.includes('Excessive punctuation (!!!, ???)');
});

test('Clean email has low spam score', () => {
    const result = detectSpamTriggers('Hi John, I wanted to follow up on our conversation.');
    return result.score < 10 && result.severity === 'low';
});

// 3. SUSPICIOUS CONTENT TESTS
console.log('\n--- Suspicious Content Tests ---');

test('Detect phishing patterns', () => {
    const result = detectSuspiciousContent('Please verify your account immediately');
    return result.isPhishing && result.issues.length > 0;
});

test('Detect IP address URLs', () => {
    const result = detectSuspiciousContent('Click here: http://192.168.1.1/login');
    return result.isPhishing && result.issues.some(i => i.includes('IP address'));
});

test('Detect shortened URLs', () => {
    const result = detectSuspiciousContent('Check this out: http://bit.ly/abc123');
    return result.issues.some(i => i.includes('Shortened URL'));
});

// 4. COMPLIANCE TESTS
console.log('\n--- Compliance Tests ---');

test('Detect missing unsubscribe', () => {
    const result = detectComplianceIssues('Newsletter', 'Check out our products!');
    return !result.isCompliant && result.issues.some(i => i.description.includes('unsubscribe'));
});

test('Pass with unsubscribe', () => {
    const result = detectComplianceIssues('Newsletter', 'Products! Unsubscribe at bottom. 123 Main Street');
    return result.isCompliant;
});

test('Detect misleading Re:', () => {
    const result = detectComplianceIssues('Re: Your order', 'New products available');
    return result.issues.some(i => i.description.includes('Re:'));
});

// 5. ENHANCED INTENT DETECTION TESTS
console.log('\n--- Enhanced Intent Detection Tests ---');

test('Detect follow-up intent', () => {
    const result = enhancedIntentDetection('Just following up on my previous email');
    return result.primary === 'follow_up' && result.confidence > 0;
});

test('Detect meeting request intent', () => {
    const result = enhancedIntentDetection('Would you be available for a call next week?');
    return result.primary === 'meeting_request';
});

test('Detect thank you intent', () => {
    const result = enhancedIntentDetection('Thank you so much for your help!');
    return result.primary === 'thank_you';
});

test('Detect multi-intent', () => {
    const result = enhancedIntentDetection('Following up to schedule a meeting');
    return result.secondary.length > 0;
});

// 6. GREETING TESTS
console.log('\n--- Greeting Analysis Tests ---');

test('Detect professional greeting', () => {
    const result = analyzeGreeting('Dear John,\n\nI hope this email finds you well.');
    return result.hasGreeting && result.type === 'professional';
});

test('Detect casual greeting', () => {
    const result = analyzeGreeting('Hey there!\n\nQuick question for you.');
    return result.hasGreeting && result.type === 'casual';
});

test('No greeting detected', () => {
    const result = analyzeGreeting('I wanted to reach out about...');
    return !result.hasGreeting && result.type === 'none';
});

// 7. SIGNATURE TESTS
console.log('\n--- Signature Analysis Tests ---');

test('Detect signature with contact info', () => {
    const result = analyzeSignature('Message\n\nBest regards,\nJohn Doe\n555-123-4567\njohn@example.com');
    return result.hasSignature && result.hasContactInfo;
});

test('Detect phone number', () => {
    const result = analyzeSignature('Cheers,\nJohn\n555-123-4567');
    return result.elements.includes('phone');
});

// 8. LINK ANALYSIS TESTS
console.log('\n--- Link Analysis Tests ---');

test('Count links', () => {
    const result = analyzeLinks('Check out http://example.com and http://test.com');
    return result.count === 2;
});

test('Detect suspicious links', () => {
    const result = analyzeLinks('Visit http://192.168.1.1 or http://bit.ly/test');
    return result.suspicious.length === 2;
});

// 9. TONE ANALYSIS TESTS
console.log('\n--- Tone Analysis Tests ---');

test('Detect positive sentiment', () => {
    const result = analyzeTone('Great work! I am so excited about this amazing opportunity.');
    return result.sentiment === 'positive';
});

test('Detect negative sentiment', () => {
    const result = analyzeTone('Sorry for the terrible mistake. This is disappointing.');
    return result.sentiment === 'negative';
});

test('Detect formal tone', () => {
    const result = analyzeTone('Regarding your inquiry, I would like to respectfully submit...');
    return result.formality === 'formal';
});

test('Detect casual tone', () => {
    const result = analyzeTone('Hey! Yeah, that sounds awesome. Gonna check it out.');
    return result.formality === 'casual';
});

test('Detect high urgency', () => {
    const result = analyzeTone('URGENT deadline expires today ASAP immediately');
    return result.urgency === 'high';
});

// 10. READABILITY TESTS
console.log('\n--- Readability Analysis Tests ---');

test('Easy to read text', () => {
    const result = analyzeReadability('This is a simple sentence. It is easy to read. Short words work well.');
    return result.score > 60 && result.assessment.includes('easy');
});

test('Calculate grade level', () => {
    const result = analyzeReadability('Complex multifaceted organizational paradigms require comprehensive evaluation.');
    return result.gradeLevel > 5;
});

// 11. CTA ANALYSIS TESTS
console.log('\n--- CTA Analysis Tests ---');

test('Detect CTA with question', () => {
    const result = analyzeCTA('Would you be interested in learning more?');
    return result.hasCTA && result.ctaCount > 0;
});

test('Detect strong CTA', () => {
    const result = analyzeCTA('Click here to schedule your demo now!');
    return result.ctaStrength === 'strong';
});

test('Detect weak CTA', () => {
    const result = analyzeCTA('Maybe you could check this out if you want.');
    return result.ctaStrength === 'weak';
});

test('No CTA detected', () => {
    const result = analyzeCTA('Just sharing some information with you.');
    return !result.hasCTA;
});

// 12. SUBJECT LINE DEEP ANALYSIS TESTS
console.log('\n--- Subject Line Analysis Tests ---');

test('Detect ALL CAPS subject', () => {
    const result = analyzeSubjectLineDeep('URGENT MUST READ NOW');
    return result.issues.includes('Subject is ALL CAPS');
});

test('Detect clickbait', () => {
    const result = analyzeSubjectLineDeep('You won\'t believe this shocking secret!');
    return result.issues.some(i => i.includes('Clickbait'));
});

test('Detect excessive punctuation in subject', () => {
    const result = analyzeSubjectLineDeep('Amazing offer!!!');
    return result.issues.includes('Excessive punctuation');
});

test('Optimal subject length', () => {
    const result = analyzeSubjectLineDeep('Quick question about your project');
    return result.score > 50;
});

// 13. EMAIL CONTEXT TESTS
console.log('\n--- Email Context Tests ---');

test('Detect reply chain', () => {
    const result = detectEmailContext('On Monday, John wrote:\n> Original message');
    return result.isReply && result.hasQuotedText;
});

test('Detect forward', () => {
    const result = detectEmailContext('------Forwarded Message------\nFrom: John');
    return result.isForward;
});

test('Detect sequence position', () => {
    const result = detectEmailContext('Following up on my previous email');
    return result.sequencePosition === 2;
});

// 14. TEMPLATE DETECTION TESTS
console.log('\n--- Template Detection Tests ---');

test('Detect unmerged tokens', () => {
    const result = detectTemplateUsage('Hi {{FIRST_NAME}}, welcome to {COMPANY}!');
    return result.isTemplate && result.unmergedTokens.length > 0;
});

test('Detect generic phrases', () => {
    const result = detectTemplateUsage('Dear Sir/Madam, We are writing...');
    return result.isTemplate;
});

test('Personalized email not flagged as template', () => {
    const result = detectTemplateUsage('Hi John, I noticed your work on project X.');
    return !result.isTemplate;
});

// 15. LANGUAGE DETECTION TESTS
console.log('\n--- Language Detection Tests ---');

test('Detect English', () => {
    const result = detectLanguage('The quick brown fox jumps over the lazy dog');
    return result.primary === 'english' && result.isEnglish;
});

test('Detect Spanish', () => {
    const result = detectLanguage('El gato está en la casa de los perros');
    return result.primary === 'spanish' && !result.isEnglish;
});

// 16. COMPREHENSIVE ANALYSIS TESTS
console.log('\n--- Comprehensive Analysis Tests ---');

test('Comprehensive analysis runs without errors', () => {
    const result = performComprehensiveAnalysis(
        'Quick question about your project',
        'Hi John,\n\nI noticed your recent work and wanted to discuss potential collaboration.\n\nBest,\nJane'
    );
    return result.overallScore > 0 && result.overallScore <= 100;
});

test('Invalid input returns low score', () => {
    const result = performComprehensiveAnalysis('', '');
    return result.overallScore === 0 && !result.validation.isValid;
});

test('Spammy email gets penalized', () => {
    const result = performComprehensiveAnalysis(
        'FREE MONEY!!!',
        'URGENT ACT NOW!!! Click here http://192.168.1.1 to claim your prize!'
    );
    return result.spam.score > 30 && result.overallScore < 50;
});

test('Quality email scores well', () => {
    const result = performComprehensiveAnalysis(
        'Collaboration opportunity',
        'Hi John,\n\nI hope this email finds you well. I noticed your work on project X and think there might be a great opportunity for collaboration.\n\nWould you be available for a brief call next week?\n\nBest regards,\nJane Doe\njane@example.com'
    );
    return result.overallScore > 50 && result.spam.score < 15;
});

// RESULTS SUMMARY
console.log('\n===================================');
console.log('TEST RESULTS');
console.log('===================================');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${passed + failed}`);
console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log('===================================\n');

if (failed === 0) {
    console.log('🎉 All tests passed!');
} else {
    console.log(`⚠️  ${failed} test(s) failed. Please review.`);
}
