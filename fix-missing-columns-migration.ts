// Migration to add missing columns to company_profiles
// Usage: npx tsx fix-missing-columns-migration.ts

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function addMissingColumns() {
    console.log('Adding missing columns to company_profiles table...');

    try {
        // Add extraction_gaps column
        await sql`
            ALTER TABLE company_profiles 
            ADD COLUMN IF NOT EXISTS extraction_gaps JSONB;
        `;
        console.log('✅ Added extraction_gaps column');

        // Add other potentially missing metadata columns
        await sql`
            ALTER TABLE company_profiles 
            ADD COLUMN IF NOT EXISTS validated_fields JSONB;
        `;
        console.log('✅ Added validated_fields column');

        console.log('Migration complete!');
    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

addMissingColumns();
