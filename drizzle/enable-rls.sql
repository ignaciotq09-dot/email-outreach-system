-- ============================================================================
-- Row-Level Security (RLS) Setup for Multi-Tenant Data Isolation
-- ============================================================================
-- 
-- This migration enables PostgreSQL Row-Level Security to ensure that
-- each user can only access their own data, even if the application
-- forgets to filter by user_id.
--
-- IMPORTANT: Run this migration manually after reviewing the changes.
-- RLS requires careful consideration of your security model.
--
-- To apply: psql -d your_database -f enable-rls.sql
-- ============================================================================

-- Step 1: Create a function to get the current user ID from session
CREATE OR REPLACE FUNCTION current_user_id() 
RETURNS INTEGER AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.current_user_id', TRUE), '')::INTEGER,
    0
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Step 2: Enable RLS on all user-scoped tables
ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_personalization ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_voice_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalization_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies for each table
-- Users can only see/modify their own records

-- Sent Emails
CREATE POLICY user_sent_emails ON sent_emails
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Replies
CREATE POLICY user_replies ON replies
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Follow-ups
CREATE POLICY user_follow_ups ON follow_ups
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Contacts
CREATE POLICY user_contacts ON contacts
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Campaigns
CREATE POLICY user_campaigns ON campaigns
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Workflows
CREATE POLICY user_workflows ON workflows
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Workflow Runs
CREATE POLICY user_workflow_runs ON workflow_runs
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Workflow Steps
CREATE POLICY user_workflow_steps ON workflow_steps
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Workflow Contacts
CREATE POLICY user_workflow_contacts ON workflow_contacts
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Analytics Events
CREATE POLICY user_analytics_events ON analytics_events
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Optimization Runs
CREATE POLICY user_optimization_runs ON optimization_runs
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- A/B Tests
CREATE POLICY user_ab_tests ON ab_tests
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- A/B Test Results
CREATE POLICY user_ab_test_results ON ab_test_results
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- User Email Personalization
CREATE POLICY user_email_personalization_policy ON user_email_personalization
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- User Voice Samples
CREATE POLICY user_voice_samples_policy ON user_voice_samples
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- User Email Personas
CREATE POLICY user_email_personas_policy ON user_email_personas
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Email Edit History
CREATE POLICY user_email_edit_history ON email_edit_history
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Personalization Analytics
CREATE POLICY user_personalization_analytics ON personalization_analytics
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- SMS Messages
CREATE POLICY user_sms_messages ON sms_messages
  FOR ALL
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- ============================================================================
-- VERIFICATION: Test that RLS is working
-- ============================================================================
-- 
-- To test RLS:
-- 1. Set a user context: SET app.current_user_id = '1';
-- 2. Query a table: SELECT * FROM sent_emails;
-- 3. Only user 1's emails should appear
-- 4. Switch context: SET app.current_user_id = '2';
-- 5. Query again: SELECT * FROM sent_emails;
-- 6. Only user 2's emails should appear
--
-- To disable RLS for admin operations:
-- SET ROLE postgres; -- or your superuser role
-- ============================================================================
