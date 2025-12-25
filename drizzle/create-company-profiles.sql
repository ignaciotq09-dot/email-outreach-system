-- Create company_profiles table for onboarding
-- Run this manually or through your migration system

CREATE TABLE IF NOT EXISTS company_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Online presence detection
  has_online_presence BOOLEAN DEFAULT false,
  website_url VARCHAR(500),
  instagram_handle VARCHAR(100),
  
  -- Business Identity
  company_name VARCHAR(255),
  business_type VARCHAR(50),
  industry VARCHAR(100),
  industry_other VARCHAR(100),
  years_in_business VARCHAR(50),
  employee_count VARCHAR(50),
  tagline VARCHAR(500),
  mission_statement TEXT,
  
  -- Products & Services
  business_description TEXT,
  products_services JSONB,
  pricing_model JSONB,
  typical_deal_size VARCHAR(100),
  
  -- Target Customers
  ideal_customer_description TEXT,
  target_job_titles JSONB,
  target_industries JSONB,
  target_company_sizes JSONB,
  target_geographies JSONB,
  
  -- Value Proposition
  problem_solved TEXT,
  unique_differentiator TEXT,
  typical_results TEXT,
  notable_clients TEXT,
  
  -- Sales Process
  sales_cycle_length VARCHAR(50),
  common_objections JSONB,
  current_challenges TEXT,
  
  -- Brand Voice
  brand_personality JSONB,
  formality_level VARCHAR(50),
  phrases_to_use TEXT,
  phrases_to_avoid TEXT,
  
  -- Call to Action
  desired_lead_action JSONB,
  additional_notes TEXT,
  
  -- Metadata
  data_source VARCHAR(50) DEFAULT 'manual',
  extraction_confidence INTEGER,
  validated_fields JSONB,
  
  -- Onboarding status
  onboarding_step VARCHAR(50) DEFAULT 'not_started',
  onboarding_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS company_profiles_user_id_idx ON company_profiles(user_id);
CREATE INDEX IF NOT EXISTS company_profiles_onboarding_complete_idx ON company_profiles(onboarding_complete);
