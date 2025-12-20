import 'dotenv/config';

/**
 * Comprehensive API Integration Test Suite
 * Tests all major API functions in the email outreach system
 */

console.log('========================');
console.log('API INTEGRATION TEST SUITE');
console.log('========================\n');

// Test results tracking
const results = {
    passed: [] as string[],
    failed: [] as { test: string; error: string }[],
    skipped: [] as string[]
};

// Helper to log test results
function logTest(name: string, status: 'PASS' | 'FAIL' | 'SKIP', message?: string) {
    const symbols = { PASS: '✅', FAIL: '❌', SKIP: '⚠️' };
    const colors = { PASS: '\x1b[32m', FAIL: '\x1b[31m', SKIP: '\x1b[33m' };
    const reset = '\x1b[0m';

    console.log(`${colors[status]}${symbols[status]} ${name}${reset}`);
    if (message) console.log(`   ${message}`);

    if (status === 'PASS') results.passed.push(name);
    else if (status === 'FAIL') results.failed.push({ test: name, error: message || 'Unknown error' });
    else results.skipped.push(name);
}

// ===== 1. TEST DATABASE CONNECTION =====
async function testDatabase() {
    console.log('\n--- Testing Database Connection ---');
    try {
        const { Pool } = await import('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });

        const result = await pool.query('SELECT NOW()');
        await pool.end();

        logTest('Database Connection', 'PASS', `Connected successfully at ${result.rows[0].now}`);
        return true;
    } catch (error: any) {
        logTest('Database Connection', 'FAIL', error.message);
        return false;
    }
}

// ===== 2. TEST APOLLO.IO API =====
async function testApolloAPI() {
    console.log('\n--- Testing Apollo.io API ---');
    const apiKey = process.env.APOLLO_API_KEY;

    if (!apiKey || apiKey === 'your_apollo_api_key_here') {
        logTest('Apollo.io API', 'SKIP', 'API key not configured');
        return false;
    }

    try {
        const response = await fetch('https://api.apollo.io/v1/auth/health', {
            headers: {
                'X-Api-Key': apiKey
            }
        });

        if (response.ok) {
            logTest('Apollo.io API', 'PASS', 'API key validated successfully');
            return true;
        } else {
            const errorText = await response.text();
            logTest('Apollo.io API', 'FAIL', `HTTP ${response.status}: ${errorText}`);
            return false;
        }
    } catch (error: any) {
        logTest('Apollo.io API', 'FAIL', error.message);
        return false;
    }
}

// ===== 3. TEST OPENAI API =====
async function testOpenAI() {
    console.log('\n--- Testing OpenAI API ---');
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

    if (!apiKey || apiKey === 'your_openai_api_key_here') {
        logTest('OpenAI API', 'SKIP', 'API key not configured');
        return false;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            logTest('OpenAI API', 'PASS', `Authenticated successfully, ${data.data?.length || 0} models available`);
            return true;
        } else {
            const errorData = await response.json();
            logTest('OpenAI API', 'FAIL', `HTTP ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
            return false;
        }
    } catch (error: any) {
        logTest('OpenAI API', 'FAIL', error.message);
        return false;
    }
}

// ===== 4. TEST GOOGLE OAUTH CONFIGURATION =====
async function testGoogleOAuth() {
    console.log('\n--- Testing Google OAuth Configuration ---');
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret || clientId === 'your_google_client_id' || clientSecret === 'your_google_client_secret') {
        logTest('Google OAuth Config', 'SKIP', 'OAuth credentials not configured');
        return false;
    }

    // Just validate that credentials are set (can't test OAuth without full flow)
    if (clientId.includes('.apps.googleusercontent.com') && clientSecret.startsWith('GOCSPX-')) {
        logTest('Google OAuth Config', 'PASS', 'Credentials appear valid (format check only)');
        return true;
    } else {
        logTest('Google OAuth Config', 'FAIL', 'Credentials format invalid');
        return false;
    }
}

// ===== 5. TEST TWILIO API =====
async function testTwilio() {
    console.log('\n--- Testing Twilio API ---');
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken || accountSid === 'your_twilio_account_sid') {
        logTest('Twilio API', 'SKIP', 'Credentials not configured');
        return false;
    }

    try {
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            logTest('Twilio API', 'PASS', `Account status: ${data.status}`);
            return true;
        } else {
            const errorText = await response.text();
            logTest('Twilio API', 'FAIL', `HTTP ${response.status}: ${errorText}`);
            return false;
        }
    } catch (error: any) {
        logTest('Twilio API', 'FAIL', error.message);
        return false;
    }
}

// ===== 6. TEST AZURE/MICROSOFT OAUTH CONFIGURATION =====
async function testAzureOAuth() {
    console.log('\n--- Testing Azure/Microsoft OAuth Configuration ---');
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    if (!clientId || !clientSecret || clientId === 'your_azure_client_id') {
        logTest('Azure OAuth Config', 'SKIP', 'OAuth credentials not configured');
        return false;
    }

    // Validate UUID format for Azure client ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(clientId) && clientSecret.length > 10) {
        logTest('Azure OAuth Config', 'PASS', 'Credentials appear valid (format check only)');
        return true;
    } else {
        logTest('Azure OAuth Config', 'FAIL', 'Credentials format invalid');
        return false;
    }
}

// ===== 7. TEST ENVIRONMENT VARIABLES =====
async function testEnvironmentVariables() {
    console.log('\n--- Testing Environment Variables ---');
    const required = [
        'DATABASE_URL',
        'SESSION_SECRET',
        'APOLLO_API_KEY',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN',
        'AZURE_CLIENT_ID',
        'AZURE_CLIENT_SECRET',
        'AI_INTEGRATIONS_OPENAI_API_KEY'
    ];

    const missing: string[] = [];
    const present: string[] = [];

    for (const key of required) {
        if (process.env[key] && process.env[key] !== `your_${key.toLowerCase()}`) {
            present.push(key);
        } else {
            missing.push(key);
        }
    }

    if (missing.length === 0) {
        logTest('Environment Variables', 'PASS', `All ${present.length} required variables are set`);
        return true;
    } else {
        logTest('Environment Variables', 'FAIL', `Missing: ${missing.join(', ')}`);
        return false;
    }
}

// ===== 8. TEST SERVER STARTUP SERVICES =====
async function testServerServices() {
    console.log('\n--- Testing Server Services Configuration ---');

    try {
        // Check if services are importable
        const services = [
            { name: 'Job Scheduler', path: './server/scheduler' },
            { name: 'Follow-up Engine', path: './server/services/follow-up-engine' },
            { name: 'Reply Detection Engine', path: './server/services/reply-detection-engine' },
            { name: 'Email Tracking', path: './server/services/email-tracking' },
            { name: 'LinkedIn Job Processor', path: './server/services/linkedin-job-processor' }
        ];

        let passed = 0;
        let failed = 0;

        for (const service of services) {
            try {
                await import(service.path);
                passed++;
            } catch (error) {
                failed++;
                console.log(`   ⚠️  ${service.name}: Could not import`);
            }
        }

        if (failed === 0) {
            logTest('Server Services', 'PASS', `All ${passed} services are importable`);
            return true;
        } else {
            logTest('Server Services', 'FAIL', `${failed}/${services.length} services failed to import`);
            return false;
        }
    } catch (error: any) {
        logTest('Server Services', 'FAIL', error.message);
        return false;
    }
}

// ===== RUN ALL TESTS =====
async function runAllTests() {
    console.log('Starting comprehensive API integration tests...\n');

    await testEnvironmentVariables();
    await testDatabase();
    await testApolloAPI();
    await testOpenAI();
    await testGoogleOAuth();
    await testTwilio();
    await testAzureOAuth();
    await testServerServices();

    // Print summary
    console.log('\n========================');
    console.log('TEST SUMMARY');
    console.log('========================');
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`⚠️  Skipped: ${results.skipped.length}`);

    if (results.failed.length > 0) {
        console.log('\n--- FAILED TESTS ---');
        results.failed.forEach(({ test, error }) => {
            console.log(`\n${test}:`);
            console.log(`  ${error}`);
        });
    }

    console.log('\n========================\n');

    // Exit with appropriate code
    process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
