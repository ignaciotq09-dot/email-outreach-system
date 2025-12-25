// Run this script to create the company_profiles table
// Usage: npx tsx run-migration.ts

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function runMigration() {
    console.log('Creating company_profiles table...');

    await sql`
    CREATE TABLE IF NOT EXISTS company_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      
      has_online_presence BOOLEAN DEFAULT false,
      website_url VARCHAR(500),
      instagram_handle VARCHAR(100),
      
      company_name VARCHAR(255),
      business_type VARCHAR(50),
      industry VARCHAR(100),
      industry_other VARCHAR(100),
      years_in_business VARCHAR(50),
      employee_count VARCHAR(50),
      tagline VARCHAR(500),
      mission_statement TEXT,
      
      business_description TEXT,
      products_services JSONB,
      pricing_model JSONB,
      typical_deal_size VARCHAR(100),
      
      ideal_customer_description TEXT,
      target_job_titles JSONB,
      target_industries JSONB,
      target_company_sizes JSONB,
      target_geographies JSONB,
      
      problem_solved TEXT,
      unique_differentiator TEXT,
      typical_results TEXT,
      notable_clients TEXT,
      
      sales_cycle_length VARCHAR(50),
      common_objections JSONB,
      current_challenges TEXT,
      
      brand_personality JSONB,
      formality_level VARCHAR(50),
      phrases_to_use TEXT,
      phrases_to_avoid TEXT,
      
      desired_lead_action JSONB,
      additional_notes TEXT,
      
      data_source VARCHAR(50) DEFAULT 'manual',
      extraction_confidence INTEGER,
      validated_fields JSONB,
      
      onboarding_step VARCHAR(50) DEFAULT 'not_started',
      onboarding_complete BOOLEAN DEFAULT false,
      completed_at TIMESTAMP,
      
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

    console.log('Creating indexes...');

    await sql`CREATE INDEX IF NOT EXISTS company_profiles_user_id_idx ON company_profiles(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS company_profiles_onboarding_complete_idx ON company_profiles(onboarding_complete)`;

    console.log('✅ Migration complete! company_profiles table created.');
}

runMigration().catch(err => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
});
