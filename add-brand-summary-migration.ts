// Quick migration script to add brand_summary column
// Usage: npx tsx add-brand-summary-migration.ts

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function addBrandSummaryColumn() {
    console.log('Adding brand_summary column to company_profiles table...');

    try {
        await sql`
            ALTER TABLE company_profiles 
            ADD COLUMN IF NOT EXISTS brand_summary TEXT;
        `;

        console.log('✅ Successfully added brand_summary column!');

        // Add comment for documentation
        await sql`
            COMMENT ON COLUMN company_profiles.brand_summary 
            IS 'AI-generated 2-3 sentence brand identity summary';
        `;

        console.log('✅ Added column comment');
        console.log('Migration complete!');
    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

addBrandSummaryColumn();
