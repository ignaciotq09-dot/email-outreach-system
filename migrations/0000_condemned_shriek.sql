CREATE TABLE "contact_email_aliases" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"email_address" varchar(255) NOT NULL,
	"alias_type" varchar(50),
	"first_seen" timestamp DEFAULT now(),
	"last_seen" timestamp DEFAULT now(),
	"verified" boolean DEFAULT false,
	"source" varchar(100),
	"metadata" jsonb,
	CONSTRAINT "unique_contact_email" UNIQUE("contact_id","email_address")
);
--> statement-breakpoint
CREATE TABLE "contact_tag_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"added_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contact_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(100) NOT NULL,
	"color" varchar(50),
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"company" varchar(255),
	"position" varchar(255),
	"phone" varchar(50),
	"notes" text,
	"pronoun" varchar(10) DEFAULT '',
	"timezone" varchar(100),
	"optimal_send_time" varchar(50),
	"industry" varchar(255),
	"company_size" varchar(50),
	"company_revenue" varchar(100),
	"recent_news" text,
	"last_enriched" timestamp,
	"enrichment_source" varchar(100),
	"location" varchar(255),
	"linkedin_url" varchar(500),
	"linkedin_connection_status" varchar(30),
	"total_linkedin_replies" integer DEFAULT 0,
	"last_linkedin_engagement" timestamp,
	"engagement_score" integer DEFAULT 0,
	"total_opens" integer DEFAULT 0,
	"total_clicks" integer DEFAULT 0,
	"total_replies" integer DEFAULT 0,
	"total_sms_replies" integer DEFAULT 0,
	"sms_opted_out" integer DEFAULT 0,
	"sms_opted_out_at" timestamp,
	"last_engagement" timestamp,
	"created_at" timestamp DEFAULT now(),
	"source" varchar(50) DEFAULT 'unknown',
	"email_status" varchar(20) DEFAULT 'unverified',
	CONSTRAINT "contacts_user_id_email_idx" UNIQUE("user_id","email")
);
--> statement-breakpoint
CREATE TABLE "auth_providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" varchar(20) NOT NULL,
	"email" varchar(255) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp,
	"scope" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"can_send_emails" boolean DEFAULT true,
	"can_manage_contacts" boolean DEFAULT true,
	"can_manage_templates" boolean DEFAULT true,
	"can_manage_sequences" boolean DEFAULT true,
	"can_view_analytics" boolean DEFAULT true,
	"can_manage_team" boolean DEFAULT false,
	"can_manage_settings" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"password_hash" varchar(255),
	"name" varchar(255),
	"first_name" varchar(255),
	"last_name" varchar(255),
	"company_name" varchar(255),
	"position" varchar(255),
	"profile_image_url" varchar(500),
	"phone" varchar(50),
	"email_verified" boolean DEFAULT false,
	"verification_token" varchar(255),
	"reset_password_token" varchar(255),
	"reset_password_expires" timestamp,
	"role_id" integer,
	"active" boolean DEFAULT true,
	"email_provider" varchar(20),
	"gmail_connected" boolean DEFAULT false,
	"replit_auth_id" varchar(255),
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_replit_auth_id_unique" UNIQUE("replit_auth_id")
);
--> statement-breakpoint
CREATE TABLE "pending_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"position" varchar(255),
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "pending_users_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "follow_ups" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"original_email_id" integer NOT NULL,
	"follow_up_body" text,
	"sent_at" timestamp DEFAULT now(),
	"gmail_message_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"sent_email_id" integer NOT NULL,
	"reply_received_at" timestamp,
	"reply_content" text,
	"gmail_message_id" varchar(255),
	"status" varchar(20) DEFAULT 'new'
);
--> statement-breakpoint
CREATE TABLE "reply_detection_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"sent_email_id" integer,
	"contact_id" integer,
	"detection_layer" varchar(50) NOT NULL,
	"gmail_query" text,
	"query_timestamp" timestamp DEFAULT now(),
	"result_found" boolean DEFAULT false,
	"gmail_message_id" varchar(255),
	"gmail_thread_id" varchar(255),
	"sender_email" varchar(255),
	"match_reason" text,
	"headers" jsonb,
	"error_message" text,
	"processing_time_ms" integer,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "sent_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"contact_id" integer NOT NULL,
	"subject" varchar(500),
	"body" text,
	"gmail_message_id" varchar(255),
	"gmail_thread_id" varchar(255),
	"sent_at" timestamp DEFAULT now(),
	"reply_received" boolean DEFAULT false,
	"last_reply_check" timestamp,
	"writing_style" varchar(50),
	"tracking_pixel_id" varchar(100),
	"opened" boolean DEFAULT false,
	"first_opened_at" timestamp,
	"open_count" integer DEFAULT 0,
	"last_opened_at" timestamp,
	"clicked" boolean DEFAULT false,
	"click_count" integer DEFAULT 0,
	"last_clicked_at" timestamp,
	"reply_sentiment" varchar(50),
	"reply_confidence" integer,
	"tracking_enabled" boolean DEFAULT true,
	"archived" boolean DEFAULT false,
	"archived_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "campaign_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"contact_id" integer NOT NULL,
	"added_at" timestamp DEFAULT now(),
	"sent_email_id" integer
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"subject" varchar(500),
	"body" text,
	"writing_style" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"sent_at" timestamp,
	"status" varchar(50) DEFAULT 'draft',
	"scheduled_for" timestamp,
	"send_time_policy" varchar(50),
	"batch_size" integer DEFAULT 30,
	"template_id" integer,
	"follow_up_sequence_id" integer,
	"total_sent" integer DEFAULT 0,
	"total_opened" integer DEFAULT 0,
	"total_clicked" integer DEFAULT 0,
	"total_replied" integer DEFAULT 0,
	"open_rate" integer DEFAULT 0,
	"click_rate" integer DEFAULT 0,
	"reply_rate" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(255) NOT NULL,
	"category" varchar(100),
	"subject" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"writing_style" varchar(50),
	"description" text,
	"times_used" integer DEFAULT 0,
	"total_sent" integer DEFAULT 0,
	"total_opened" integer DEFAULT 0,
	"total_replied" integer DEFAULT 0,
	"avg_open_rate" integer DEFAULT 0,
	"avg_reply_rate" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "follow_up_sequences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(255) NOT NULL,
	"description" text,
	"active" boolean DEFAULT true,
	"stop_on_reply" boolean DEFAULT true,
	"stop_on_open" boolean DEFAULT false,
	"stop_on_click" boolean DEFAULT false,
	"stop_on_meeting" boolean DEFAULT true,
	"total_enrolled" integer DEFAULT 0,
	"total_completed" integer DEFAULT 0,
	"total_replies" integer DEFAULT 0,
	"avg_reply_rate" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sequence_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"sequence_id" integer NOT NULL,
	"contact_id" integer NOT NULL,
	"sent_email_id" integer,
	"current_step" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'active',
	"stopped_reason" varchar(100),
	"enrolled_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"last_step_sent" timestamp
);
--> statement-breakpoint
CREATE TABLE "sequence_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"sequence_id" integer NOT NULL,
	"step_number" integer NOT NULL,
	"delay_days" integer NOT NULL,
	"subject" varchar(500),
	"body" text NOT NULL,
	"variant_name" varchar(100),
	"variant_percentage" integer DEFAULT 100,
	"total_sent" integer DEFAULT 0,
	"total_opened" integer DEFAULT 0,
	"total_replied" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ab_test_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"experiment_id" varchar(100) NOT NULL,
	"variant_key" varchar(50) NOT NULL,
	"sent_email_id" integer,
	"opens" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"replies" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"total_sent" integer DEFAULT 0,
	"statistical_significance" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ab_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"experiment_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"intent_scope" varchar(50),
	"industry_scope" varchar(100),
	"test_dimension" varchar(50),
	"traffic_split" jsonb,
	"status" varchar(20) DEFAULT 'active',
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ab_tests_experiment_id_unique" UNIQUE("experiment_id")
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"event_type" varchar(50) NOT NULL,
	"contact_id" integer,
	"sent_email_id" integer,
	"campaign_id" integer,
	"metadata" jsonb,
	"user_agent" varchar(500),
	"ip_address" varchar(100),
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "optimization_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"email_id" integer,
	"sent_email_id" integer,
	"variant_id" varchar(100),
	"rules_applied" jsonb,
	"scores" jsonb,
	"predictions" jsonb,
	"suggestions" jsonb,
	"intent" varchar(50),
	"industry" varchar(100),
	"company_size" varchar(50),
	"seniority_level" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_reply_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reply_id" integer NOT NULL,
	"contact_id" integer NOT NULL,
	"original_reply_content" text,
	"intent_confidence" integer,
	"intent_type" varchar(50),
	"auto_reply_content" text,
	"sent_at" timestamp DEFAULT now(),
	"status" varchar(30) DEFAULT 'sent',
	"pass1_result" text,
	"pass2_result" text,
	"pattern_validation" text,
	"audit_trail" text,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "email_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"tone_preference" varchar(100),
	"length_preference" varchar(50),
	"style_notes" text,
	"default_signature" text,
	"sender_name" varchar(255),
	"sender_phone" varchar(50),
	"booking_link" varchar(500),
	"auto_reply_enabled" boolean DEFAULT false,
	"auto_reply_message" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "email_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "monitoring_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"enabled" boolean DEFAULT true,
	"sms_phone_number" varchar(20),
	"last_scan_time" timestamp,
	"scan_interval_minutes" integer DEFAULT 30,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "monitoring_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "warmup_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) DEFAULT 'default',
	"enabled" boolean DEFAULT true,
	"current_stage" integer DEFAULT 1,
	"start_date" timestamp,
	"last_progress_check" timestamp,
	"manual_override" boolean DEFAULT false,
	"custom_daily_limit" integer,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "warmup_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "unsubscribes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"email" varchar(255) NOT NULL,
	"reason" varchar(500),
	"unsubscribed_at" timestamp DEFAULT now(),
	"active" boolean DEFAULT true,
	CONSTRAINT "unsubscribes_user_id_email_idx" UNIQUE("user_id","email")
);
--> statement-breakpoint
CREATE TABLE "appointment_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"reply_id" integer NOT NULL,
	"contact_id" integer NOT NULL,
	"detected_at" timestamp DEFAULT now(),
	"appointment_type" varchar(50),
	"suggested_date" timestamp,
	"suggested_time" varchar(50),
	"duration" integer,
	"location" text,
	"notes" text,
	"status" varchar(50) DEFAULT 'pending',
	"google_calendar_event_id" varchar(500),
	"ai_confidence" integer,
	"raw_email_text" text,
	"platform" varchar(100),
	"detection_reason" text,
	"red_flags" jsonb
);
--> statement-breakpoint
CREATE TABLE "reply_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"reply_id" integer NOT NULL,
	"contact_id" integer NOT NULL,
	"sms_sent" boolean DEFAULT false,
	"sms_delivered" boolean DEFAULT false,
	"sms_error" text,
	"sent_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"contact_id" integer,
	"google_event_id" varchar(500),
	"summary" varchar(500) NOT NULL,
	"description" text,
	"location" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"time_zone" varchar(100) DEFAULT 'America/New_York',
	"attendees" jsonb,
	"conference_link" text,
	"status" varchar(50) DEFAULT 'confirmed',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meeting_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"default_duration" integer DEFAULT 30,
	"default_location" text,
	"default_time_zone" varchar(100) DEFAULT 'America/New_York',
	"enable_google_meet" boolean DEFAULT true,
	"buffer_before" integer DEFAULT 0,
	"buffer_after" integer DEFAULT 0,
	"working_hours" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "meeting_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "email_bounces" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"contact_id" integer NOT NULL,
	"sent_email_id" integer,
	"bounce_type" varchar(50),
	"bounce_reason" text,
	"bounced_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enrichment_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"contact_id" integer NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"enrichment_type" varchar(100),
	"result" jsonb,
	"error" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gmail_history_checkpoint" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"last_history_id" varchar(100) NOT NULL,
	"last_checked_at" timestamp DEFAULT now() NOT NULL,
	"last_full_sync_at" timestamp,
	"sync_status" varchar(20) DEFAULT 'active',
	"error_message" text,
	"consecutive_errors" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_token_health" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" varchar(20) NOT NULL,
	"last_health_check" timestamp DEFAULT now() NOT NULL,
	"is_healthy" boolean DEFAULT true NOT NULL,
	"last_successful_api_call" timestamp,
	"consecutive_failures" integer DEFAULT 0,
	"last_failure_reason" text,
	"expires_at" timestamp,
	"needs_reconnect" boolean DEFAULT false,
	"alert_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_gmail_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"gmail_message_id" varchar(255) NOT NULL,
	"gmail_thread_id" varchar(255),
	"message_id_header" varchar(500),
	"in_reply_to_header" varchar(500),
	"references_header" text,
	"from_email" varchar(255),
	"subject" varchar(1000),
	"received_at" timestamp,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	"is_reply" boolean DEFAULT false,
	"is_auto_reply" boolean DEFAULT false,
	"is_bounce" boolean DEFAULT false,
	"matched_sent_email_id" integer,
	"matched_contact_id" integer,
	"detection_layer" varchar(50),
	"processing_notes" text
);
--> statement-breakpoint
CREATE TABLE "reply_detection_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"sent_email_id" integer,
	"contact_id" integer,
	"gmail_message_id" varchar(255),
	"gmail_thread_id" varchar(255),
	"detection_layer" varchar(50) NOT NULL,
	"detection_method" varchar(100),
	"result_found" boolean NOT NULL,
	"is_auto_reply" boolean DEFAULT false,
	"is_bounce" boolean DEFAULT false,
	"match_reason" text,
	"no_match_reason" text,
	"gmail_query" varchar(1000),
	"messages_scanned" integer DEFAULT 0,
	"processing_time_ms" integer,
	"api_calls_used" integer DEFAULT 1,
	"error_message" text,
	"raw_headers" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"job_type" varchar(100) NOT NULL,
	"entity_type" varchar(50),
	"entity_id" integer,
	"scheduled_for" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"attempts" integer DEFAULT 0,
	"max_attempts" integer DEFAULT 3,
	"last_attempt" timestamp,
	"error" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "spam_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"sent_email_id" integer,
	"campaign_id" integer,
	"score" integer NOT NULL,
	"assessment" varchar(50),
	"details" jsonb,
	"checked_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "warm_up_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"emails_sent_today" integer DEFAULT 0,
	"target_per_day" integer DEFAULT 10,
	"last_email_sent" timestamp,
	"date" timestamp DEFAULT now() NOT NULL,
	"bounce_rate" integer DEFAULT 0,
	"spam_complaints" integer DEFAULT 0,
	"delivery_rate" integer DEFAULT 100
);
--> statement-breakpoint
CREATE TABLE "follow_up_dead_letter" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"job_id" integer NOT NULL,
	"original_email_id" integer NOT NULL,
	"contact_id" integer NOT NULL,
	"reason" text NOT NULL,
	"total_attempts" integer NOT NULL,
	"error_summary" text,
	"full_context" jsonb,
	"review_status" varchar(20) DEFAULT 'pending',
	"reviewed_at" timestamp,
	"reviewed_by" varchar(255),
	"review_action" varchar(20),
	"review_notes" text,
	"retried_job_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "follow_up_job_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"action" varchar(50) NOT NULL,
	"previous_status" varchar(20),
	"new_status" varchar(20),
	"message" text,
	"error_details" text,
	"health_check_result" jsonb,
	"send_result" jsonb,
	"verification_result" jsonb,
	"processing_time_ms" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "follow_up_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"campaign_id" integer,
	"contact_id" integer NOT NULL,
	"original_email_id" integer NOT NULL,
	"sequence_id" integer,
	"step_id" integer,
	"step_number" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"due_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"subject" varchar(500),
	"body" text,
	"personalized_subject" varchar(500),
	"personalized_body" text,
	"attempt_count" integer DEFAULT 0,
	"max_attempts" integer DEFAULT 5,
	"last_attempt_at" timestamp,
	"next_retry_at" timestamp,
	"last_error" text,
	"error_history" jsonb,
	"provider_message_id" varchar(255),
	"provider_thread_id" varchar(255),
	"verified" integer DEFAULT 0,
	"health_check_passed" integer DEFAULT 0,
	"health_check_error" text,
	"processing_time_ms" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "follow_up_reconciliation" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_type" varchar(20) NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"emails_checked" integer DEFAULT 0,
	"missed_follow_ups_found" integer DEFAULT 0,
	"jobs_created" integer DEFAULT 0,
	"jobs_retried" integer DEFAULT 0,
	"anomalies_logged" integer DEFAULT 0,
	"errors" jsonb,
	"summary" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "detection_alerts_sent" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"alert_type" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reply_detection_anomalies" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"sent_email_id" integer NOT NULL,
	"contact_id" integer NOT NULL,
	"job_id" integer,
	"anomaly_type" varchar(50) NOT NULL,
	"severity" varchar(20) DEFAULT 'medium' NOT NULL,
	"provider" varchar(20) NOT NULL,
	"details" jsonb,
	"requires_manual_review" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"resolved_at" timestamp,
	"resolution" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reply_detection_dead_letter" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"sent_email_id" integer NOT NULL,
	"contact_id" integer NOT NULL,
	"moved_to_dead_letter_at" timestamp DEFAULT now() NOT NULL,
	"total_attempts" integer NOT NULL,
	"last_attempt_at" timestamp,
	"failure_history" jsonb,
	"job_context" jsonb,
	"status" varchar(20) DEFAULT 'pending_review' NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" integer,
	"review_action" varchar(30),
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reply_detection_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"sent_email_id" integer NOT NULL,
	"contact_id" integer NOT NULL,
	"job_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 5 NOT NULL,
	"provider" varchar(20) NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"next_retry_at" timestamp,
	"layers_executed" integer DEFAULT 0,
	"layers_healthy" integer DEFAULT 0,
	"quorum_met" boolean,
	"reply_found" boolean,
	"last_error" text,
	"error_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reply_detection_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"period_type" varchar(20) NOT NULL,
	"total_jobs_processed" integer DEFAULT 0 NOT NULL,
	"successful_jobs" integer DEFAULT 0 NOT NULL,
	"failed_jobs" integer DEFAULT 0 NOT NULL,
	"retried_jobs" integer DEFAULT 0 NOT NULL,
	"dead_lettered_jobs" integer DEFAULT 0 NOT NULL,
	"replies_found" integer DEFAULT 0 NOT NULL,
	"missed_replies_caught" integer DEFAULT 0 NOT NULL,
	"avg_layers_healthy" integer,
	"quorum_failure_count" integer DEFAULT 0 NOT NULL,
	"layer_health_stats" jsonb,
	"avg_processing_time_ms" integer,
	"p95_processing_time_ms" integer,
	"anomaly_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reply_detection_reconciliation_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"run_type" varchar(20) NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"duration_ms" integer,
	"emails_checked" integer DEFAULT 0 NOT NULL,
	"new_replies_found" integer DEFAULT 0 NOT NULL,
	"anomalies_logged" integer DEFAULT 0 NOT NULL,
	"jobs_created" integer DEFAULT 0 NOT NULL,
	"history_baseline_before" varchar(100),
	"history_baseline_after" varchar(100),
	"errors" jsonb,
	"outcome" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reply_detection_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"run_number" integer DEFAULT 1 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"duration_ms" integer,
	"health_check_passed" boolean,
	"health_check_details" jsonb,
	"layer_results" jsonb,
	"quorum_result" jsonb,
	"reply_found" boolean,
	"reply_message_id" varchar(255),
	"reply_saved_to_db" boolean,
	"verification_passed" boolean,
	"verification_details" jsonb,
	"outcome" varchar(20),
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apollo_quotas" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"monthly_enrichment_limit" integer DEFAULT 50 NOT NULL,
	"used_enrichments" integer DEFAULT 0 NOT NULL,
	"reset_date" timestamp DEFAULT DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "apollo_quotas_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "ai_search_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"suggestion_type" varchar(30) NOT NULL,
	"suggested_filters" jsonb NOT NULL,
	"suggestion_text" text NOT NULL,
	"reasoning" text,
	"predicted_score" real DEFAULT 0.5,
	"was_used" boolean DEFAULT false,
	"was_successful" boolean,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"contact_id" integer,
	"apollo_lead_id" varchar(100),
	"embedding_source" text NOT NULL,
	"embedding" jsonb NOT NULL,
	"embedding_model" varchar(50) DEFAULT 'text-embedding-3-large',
	"embedding_dimensions" integer DEFAULT 1536,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_feedback_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"search_session_id" integer,
	"contact_id" integer,
	"apollo_lead_id" varchar(100),
	"feedback_type" varchar(30) NOT NULL,
	"weighted_score" real NOT NULL,
	"lead_attributes" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_search_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"original_query" text NOT NULL,
	"parsed_filters" jsonb NOT NULL,
	"parse_confidence" real DEFAULT 1,
	"parse_explanation" text,
	"refinement_history" jsonb DEFAULT '[]'::jsonb,
	"current_refinement_step" integer DEFAULT 0,
	"results_count" integer DEFAULT 0,
	"search_duration_ms" integer,
	"was_successful" boolean DEFAULT false,
	"success_score" real DEFAULT 0,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "search_patterns" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"pattern_hash" varchar(64) NOT NULL,
	"filters" jsonb NOT NULL,
	"description" text,
	"times_used" integer DEFAULT 1,
	"leads_imported" integer DEFAULT 0,
	"emails_sent" integer DEFAULT 0,
	"replies_received" integer DEFAULT 0,
	"success_rate" real DEFAULT 0,
	"is_saved" boolean DEFAULT false,
	"saved_name" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	CONSTRAINT "search_patterns_user_pattern_unique" UNIQUE("user_id","pattern_hash")
);
--> statement-breakpoint
CREATE TABLE "tenant_icp_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title_preferences" jsonb DEFAULT '[]'::jsonb,
	"industry_preferences" jsonb DEFAULT '[]'::jsonb,
	"company_size_preferences" jsonb DEFAULT '[]'::jsonb,
	"location_preferences" jsonb DEFAULT '[]'::jsonb,
	"seniority_preferences" jsonb DEFAULT '[]'::jsonb,
	"technology_preferences" jsonb DEFAULT '[]'::jsonb,
	"icp_confidence" real DEFAULT 0,
	"total_data_points" integer DEFAULT 0,
	"best_performing_attributes" jsonb,
	"model_version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_recalculated_at" timestamp,
	CONSTRAINT "tenant_icp_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "email_edit_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"original_text" text NOT NULL,
	"edited_text" text NOT NULL,
	"persona_id" integer,
	"base_style" varchar(50),
	"edit_metrics" jsonb,
	"was_analyzed" boolean DEFAULT false,
	"analyzed_at" timestamp,
	"campaign_id" integer,
	"contact_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personalization_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"period_type" varchar(20) NOT NULL,
	"emails_with_personalization" integer DEFAULT 0,
	"emails_without_personalization" integer DEFAULT 0,
	"personalized_open_rate" real,
	"non_personalized_open_rate" real,
	"personalized_reply_rate" real,
	"non_personalized_reply_rate" real,
	"persona_performance" jsonb DEFAULT '[]'::jsonb,
	"best_performing_tone" jsonb,
	"insights" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "personalization_analytics_user_period_unique" UNIQUE("user_id","period_start","period_type")
);
--> statement-breakpoint
CREATE TABLE "user_email_personalization" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"personal_instructions" text,
	"favorite_email_samples" text,
	"signature_block" text,
	"avoid_words" text[] DEFAULT '{}',
	"preferred_words" text[] DEFAULT '{}',
	"max_email_length" integer DEFAULT 150,
	"min_email_length" integer DEFAULT 50,
	"tone_formality" integer DEFAULT 5,
	"tone_warmth" integer DEFAULT 5,
	"tone_directness" integer DEFAULT 5,
	"tone_humor" integer DEFAULT 3,
	"tone_urgency" integer DEFAULT 3,
	"variant_diversity" integer DEFAULT 5,
	"preferred_greetings" text[] DEFAULT '{}',
	"avoid_greetings" text[] DEFAULT '{}',
	"preferred_closings" text[] DEFAULT '{}',
	"avoid_closings" text[] DEFAULT '{}',
	"prefer_bullet_points" boolean DEFAULT false,
	"prefer_numbered_lists" boolean DEFAULT false,
	"prefer_questions" boolean DEFAULT true,
	"prefer_single_cta" boolean DEFAULT true,
	"extracted_patterns" jsonb,
	"learned_edits" jsonb,
	"is_enabled" boolean DEFAULT true,
	"default_base_style" varchar(50) DEFAULT 'balanced',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_personalization_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_email_personas" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"instructions" text,
	"tone_formality" integer,
	"tone_warmth" integer,
	"tone_directness" integer,
	"tone_humor" integer,
	"tone_urgency" integer,
	"max_email_length" integer,
	"min_email_length" integer,
	"base_style" varchar(50),
	"icon" varchar(50) DEFAULT 'mail',
	"color" varchar(20) DEFAULT 'blue',
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"times_used" integer DEFAULT 0,
	"last_used_at" timestamp,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_personas_user_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "user_voice_samples" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"sample_text" text NOT NULL,
	"context" varchar(100),
	"extracted_characteristics" jsonb,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sent_sms" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"contact_id" integer NOT NULL,
	"campaign_id" integer,
	"to_phone" varchar(20) NOT NULL,
	"from_phone" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"personalized_message" text,
	"status" varchar(20) DEFAULT 'pending',
	"twilio_sid" varchar(100),
	"error_code" varchar(50),
	"error_message" text,
	"sent_at" timestamp DEFAULT now(),
	"delivered_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"archived" boolean DEFAULT false,
	"archived_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sms_opt_outs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"phone" varchar(20) NOT NULL,
	"twilio_phone" varchar(20) NOT NULL,
	"contact_id" integer,
	"source" varchar(20) DEFAULT 'webhook',
	"opted_out_at" timestamp DEFAULT now(),
	"resubscribed_at" timestamp,
	"is_active" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sms_replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"sent_sms_id" integer,
	"contact_id" integer NOT NULL,
	"from_phone" varchar(20) NOT NULL,
	"to_phone" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"twilio_sid" varchar(100),
	"is_opt_out" integer DEFAULT 0,
	"received_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sms_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"twilio_phone_number" varchar(20),
	"enabled" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sms_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "booking_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(255) DEFAULT 'Book a Meeting',
	"description" text,
	"duration" integer DEFAULT 30,
	"timezone" varchar(100) DEFAULT 'America/New_York',
	"buffer_before" integer DEFAULT 0,
	"buffer_after" integer DEFAULT 15,
	"min_notice" integer DEFAULT 60,
	"max_days_in_advance" integer DEFAULT 30,
	"availability_schedule" jsonb DEFAULT '{"monday":[{"enabled":true,"start":"09:00","end":"17:00"}],"tuesday":[{"enabled":true,"start":"09:00","end":"17:00"}],"wednesday":[{"enabled":true,"start":"09:00","end":"17:00"}],"thursday":[{"enabled":true,"start":"09:00","end":"17:00"}],"friday":[{"enabled":true,"start":"09:00","end":"17:00"}],"saturday":[{"enabled":false,"start":"09:00","end":"17:00"}],"sunday":[{"enabled":false,"start":"09:00","end":"17:00"}]}'::jsonb,
	"is_active" boolean DEFAULT true,
	"require_confirmation" boolean DEFAULT false,
	"enable_google_meet" boolean DEFAULT true,
	"custom_questions" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "booking_pages_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "booking_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"booking_page_id" integer NOT NULL,
	"contact_id" integer,
	"guest_name" varchar(255) NOT NULL,
	"guest_email" varchar(255) NOT NULL,
	"guest_phone" varchar(50),
	"guest_notes" text,
	"custom_answers" jsonb,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"timezone" varchar(100) DEFAULT 'America/New_York',
	"status" varchar(50) DEFAULT 'confirmed',
	"google_event_id" varchar(500),
	"outlook_event_id" varchar(500),
	"meeting_link" text,
	"cancelled_at" timestamp,
	"cancel_reason" text,
	"reminder_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_variations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"campaign_id" integer,
	"contact_id" integer,
	"original_subject" text NOT NULL,
	"original_body" text NOT NULL,
	"variation_subject" text NOT NULL,
	"variation_body" text NOT NULL,
	"variation_hash" varchar(64) NOT NULL,
	"variation_index" integer DEFAULT 0,
	"used_at" timestamp DEFAULT now(),
	"sent_email_id" integer,
	"opened" boolean DEFAULT false,
	"replied" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "scheduled_sends" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"contact_id" integer NOT NULL,
	"campaign_id" integer,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"channel" varchar(20) DEFAULT 'email',
	"scheduled_for" timestamp NOT NULL,
	"timezone" varchar(100),
	"optimization_reason" text,
	"confidence_score" real,
	"status" varchar(20) DEFAULT 'pending',
	"attempts" integer DEFAULT 0,
	"last_attempt_at" timestamp,
	"sent_at" timestamp,
	"sent_email_id" integer,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "send_time_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"contact_id" integer,
	"sent_email_id" integer,
	"channel" varchar(20) DEFAULT 'email' NOT NULL,
	"day_of_week" integer,
	"hour_of_day" integer,
	"timezone" varchar(100),
	"industry" varchar(255),
	"sent_at" timestamp NOT NULL,
	"opened_at" timestamp,
	"replied_at" timestamp,
	"response_time_minutes" integer,
	"was_opened" boolean DEFAULT false,
	"was_replied" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spintax_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(50),
	"subject_variants" jsonb NOT NULL,
	"opening_variants" jsonb NOT NULL,
	"closing_variants" jsonb NOT NULL,
	"cta_variants" jsonb,
	"usage_count" integer DEFAULT 0,
	"avg_open_rate" real,
	"avg_reply_rate" real,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contact_deep_dive" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"contact_id" integer NOT NULL,
	"apollo_data" jsonb,
	"linkedin_data" jsonb,
	"twitter_data" jsonb,
	"company_data" jsonb,
	"web_search_data" jsonb,
	"ai_insights" jsonb,
	"work_history" jsonb,
	"education" jsonb,
	"skills" jsonb,
	"trigger_events" jsonb,
	"social_profiles" jsonb,
	"recent_activity" jsonb,
	"confidence_scores" jsonb,
	"last_enriched" timestamp DEFAULT now(),
	"enrichment_status" varchar(50) DEFAULT 'pending',
	"enrichment_error" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "company_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"has_online_presence" boolean DEFAULT false,
	"website_url" varchar(500),
	"instagram_handle" varchar(100),
	"company_name" varchar(255),
	"business_type" varchar(50),
	"industry" varchar(100),
	"industry_other" varchar(100),
	"years_in_business" varchar(50),
	"employee_count" varchar(50),
	"tagline" varchar(500),
	"mission_statement" text,
	"business_description" text,
	"products_services" jsonb,
	"pricing_model" jsonb,
	"typical_deal_size" varchar(100),
	"ideal_customer_description" text,
	"target_job_titles" jsonb,
	"target_industries" jsonb,
	"target_company_sizes" jsonb,
	"target_geographies" jsonb,
	"problem_solved" text,
	"unique_differentiator" text,
	"typical_results" text,
	"notable_clients" text,
	"sales_cycle_length" varchar(50),
	"common_objections" jsonb,
	"current_challenges" text,
	"brand_personality" jsonb,
	"formality_level" varchar(50),
	"phrases_to_use" text,
	"phrases_to_avoid" text,
	"brand_summary" text,
	"desired_lead_action" jsonb,
	"additional_notes" text,
	"data_source" varchar(50) DEFAULT 'manual',
	"extraction_confidence" integer,
	"extraction_gaps" jsonb,
	"validated_fields" jsonb,
	"onboarding_step" varchar(50) DEFAULT 'not_started',
	"onboarding_complete" boolean DEFAULT false,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "company_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "contact_email_aliases" ADD CONSTRAINT "contact_email_aliases_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_tag_mapping" ADD CONSTRAINT "contact_tag_mapping_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_tag_mapping" ADD CONSTRAINT "contact_tag_mapping_tag_id_contact_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."contact_tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_tags" ADD CONSTRAINT "contact_tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_providers" ADD CONSTRAINT "auth_providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_user_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."user_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_original_email_id_sent_emails_id_fk" FOREIGN KEY ("original_email_id") REFERENCES "public"."sent_emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_sent_email_id_sent_emails_id_fk" FOREIGN KEY ("sent_email_id") REFERENCES "public"."sent_emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_detection_audit" ADD CONSTRAINT "reply_detection_audit_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_detection_audit" ADD CONSTRAINT "reply_detection_audit_sent_email_id_sent_emails_id_fk" FOREIGN KEY ("sent_email_id") REFERENCES "public"."sent_emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_detection_audit" ADD CONSTRAINT "reply_detection_audit_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sent_emails" ADD CONSTRAINT "sent_emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sent_emails" ADD CONSTRAINT "sent_emails_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_contacts" ADD CONSTRAINT "campaign_contacts_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_contacts" ADD CONSTRAINT "campaign_contacts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_contacts" ADD CONSTRAINT "campaign_contacts_sent_email_id_sent_emails_id_fk" FOREIGN KEY ("sent_email_id") REFERENCES "public"."sent_emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_sequences" ADD CONSTRAINT "follow_up_sequences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_sequence_id_follow_up_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."follow_up_sequences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_sent_email_id_sent_emails_id_fk" FOREIGN KEY ("sent_email_id") REFERENCES "public"."sent_emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_steps" ADD CONSTRAINT "sequence_steps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_steps" ADD CONSTRAINT "sequence_steps_sequence_id_follow_up_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."follow_up_sequences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ab_test_results" ADD CONSTRAINT "ab_test_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ab_test_results" ADD CONSTRAINT "ab_test_results_experiment_id_ab_tests_experiment_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."ab_tests"("experiment_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ab_test_results" ADD CONSTRAINT "ab_test_results_sent_email_id_sent_emails_id_fk" FOREIGN KEY ("sent_email_id") REFERENCES "public"."sent_emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ab_tests" ADD CONSTRAINT "ab_tests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_sent_email_id_sent_emails_id_fk" FOREIGN KEY ("sent_email_id") REFERENCES "public"."sent_emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optimization_runs" ADD CONSTRAINT "optimization_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "optimization_runs" ADD CONSTRAINT "optimization_runs_sent_email_id_sent_emails_id_fk" FOREIGN KEY ("sent_email_id") REFERENCES "public"."sent_emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_reply_logs" ADD CONSTRAINT "auto_reply_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_preferences" ADD CONSTRAINT "email_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_settings" ADD CONSTRAINT "monitoring_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unsubscribes" ADD CONSTRAINT "unsubscribes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_reply_id_replies_id_fk" FOREIGN KEY ("reply_id") REFERENCES "public"."replies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_notifications" ADD CONSTRAINT "reply_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_notifications" ADD CONSTRAINT "reply_notifications_reply_id_replies_id_fk" FOREIGN KEY ("reply_id") REFERENCES "public"."replies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_notifications" ADD CONSTRAINT "reply_notifications_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_preferences" ADD CONSTRAINT "meeting_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_bounces" ADD CONSTRAINT "email_bounces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_bounces" ADD CONSTRAINT "email_bounces_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_bounces" ADD CONSTRAINT "email_bounces_sent_email_id_sent_emails_id_fk" FOREIGN KEY ("sent_email_id") REFERENCES "public"."sent_emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrichment_jobs" ADD CONSTRAINT "enrichment_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrichment_jobs" ADD CONSTRAINT "enrichment_jobs_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_jobs" ADD CONSTRAINT "scheduled_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spam_scores" ADD CONSTRAINT "spam_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spam_scores" ADD CONSTRAINT "spam_scores_sent_email_id_sent_emails_id_fk" FOREIGN KEY ("sent_email_id") REFERENCES "public"."sent_emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spam_scores" ADD CONSTRAINT "spam_scores_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warm_up_activity" ADD CONSTRAINT "warm_up_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_dead_letter" ADD CONSTRAINT "follow_up_dead_letter_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_dead_letter" ADD CONSTRAINT "follow_up_dead_letter_job_id_follow_up_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."follow_up_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_dead_letter" ADD CONSTRAINT "follow_up_dead_letter_original_email_id_sent_emails_id_fk" FOREIGN KEY ("original_email_id") REFERENCES "public"."sent_emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_dead_letter" ADD CONSTRAINT "follow_up_dead_letter_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_job_audit" ADD CONSTRAINT "follow_up_job_audit_job_id_follow_up_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."follow_up_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_jobs" ADD CONSTRAINT "follow_up_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_jobs" ADD CONSTRAINT "follow_up_jobs_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_jobs" ADD CONSTRAINT "follow_up_jobs_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_jobs" ADD CONSTRAINT "follow_up_jobs_original_email_id_sent_emails_id_fk" FOREIGN KEY ("original_email_id") REFERENCES "public"."sent_emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_jobs" ADD CONSTRAINT "follow_up_jobs_sequence_id_follow_up_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."follow_up_sequences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_jobs" ADD CONSTRAINT "follow_up_jobs_step_id_sequence_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."sequence_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detection_alerts_sent" ADD CONSTRAINT "detection_alerts_sent_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_detection_anomalies" ADD CONSTRAINT "reply_detection_anomalies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_detection_anomalies" ADD CONSTRAINT "reply_detection_anomalies_sent_email_id_sent_emails_id_fk" FOREIGN KEY ("sent_email_id") REFERENCES "public"."sent_emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_detection_anomalies" ADD CONSTRAINT "reply_detection_anomalies_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_detection_anomalies" ADD CONSTRAINT "reply_detection_anomalies_job_id_reply_detection_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."reply_detection_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_detection_dead_letter" ADD CONSTRAINT "reply_detection_dead_letter_job_id_reply_detection_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."reply_detection_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_detection_dead_letter" ADD CONSTRAINT "reply_detection_dead_letter_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_detection_dead_letter" ADD CONSTRAINT "reply_detection_dead_letter_sent_email_id_sent_emails_id_fk" FOREIGN KEY ("sent_email_id") REFERENCES "public"."sent_emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_detection_dead_letter" ADD CONSTRAINT "reply_detection_dead_letter_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_detection_jobs" ADD CONSTRAINT "reply_detection_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_detection_jobs" ADD CONSTRAINT "reply_detection_jobs_sent_email_id_sent_emails_id_fk" FOREIGN KEY ("sent_email_id") REFERENCES "public"."sent_emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_detection_jobs" ADD CONSTRAINT "reply_detection_jobs_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_detection_metrics" ADD CONSTRAINT "reply_detection_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_detection_reconciliation_runs" ADD CONSTRAINT "reply_detection_reconciliation_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_detection_runs" ADD CONSTRAINT "reply_detection_runs_job_id_reply_detection_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."reply_detection_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apollo_quotas" ADD CONSTRAINT "apollo_quotas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_embeddings" ADD CONSTRAINT "contact_embeddings_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_feedback_events" ADD CONSTRAINT "lead_feedback_events_search_session_id_lead_search_sessions_id_fk" FOREIGN KEY ("search_session_id") REFERENCES "public"."lead_search_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_feedback_events" ADD CONSTRAINT "lead_feedback_events_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_edit_history" ADD CONSTRAINT "email_edit_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_edit_history" ADD CONSTRAINT "email_edit_history_persona_id_user_email_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."user_email_personas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personalization_analytics" ADD CONSTRAINT "personalization_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_email_personalization" ADD CONSTRAINT "user_email_personalization_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_email_personas" ADD CONSTRAINT "user_email_personas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_voice_samples" ADD CONSTRAINT "user_voice_samples_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sent_sms" ADD CONSTRAINT "sent_sms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sent_sms" ADD CONSTRAINT "sent_sms_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sent_sms" ADD CONSTRAINT "sent_sms_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_opt_outs" ADD CONSTRAINT "sms_opt_outs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_opt_outs" ADD CONSTRAINT "sms_opt_outs_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_replies" ADD CONSTRAINT "sms_replies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_replies" ADD CONSTRAINT "sms_replies_sent_sms_id_sent_sms_id_fk" FOREIGN KEY ("sent_sms_id") REFERENCES "public"."sent_sms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_replies" ADD CONSTRAINT "sms_replies_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_settings" ADD CONSTRAINT "sms_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_pages" ADD CONSTRAINT "booking_pages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_booking_page_id_booking_pages_id_fk" FOREIGN KEY ("booking_page_id") REFERENCES "public"."booking_pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_variations" ADD CONSTRAINT "email_variations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_variations" ADD CONSTRAINT "email_variations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_variations" ADD CONSTRAINT "email_variations_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_sends" ADD CONSTRAINT "scheduled_sends_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_sends" ADD CONSTRAINT "scheduled_sends_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_sends" ADD CONSTRAINT "scheduled_sends_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "send_time_analytics" ADD CONSTRAINT "send_time_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "send_time_analytics" ADD CONSTRAINT "send_time_analytics_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spintax_templates" ADD CONSTRAINT "spintax_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_deep_dive" ADD CONSTRAINT "contact_deep_dive_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_deep_dive" ADD CONSTRAINT "contact_deep_dive_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_email_aliases_contact_id_idx" ON "contact_email_aliases" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "contact_email_aliases_email_idx" ON "contact_email_aliases" USING btree ("email_address");--> statement-breakpoint
CREATE INDEX "contact_tag_mapping_contact_id_idx" ON "contact_tag_mapping" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "contact_tag_mapping_tag_id_idx" ON "contact_tag_mapping" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "contact_tags_user_id_idx" ON "contact_tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "contact_tags_name_idx" ON "contact_tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "contact_tags_user_id_name_idx" ON "contact_tags" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "contacts_user_id_idx" ON "contacts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "contacts_source_idx" ON "contacts" USING btree ("source");--> statement-breakpoint
CREATE INDEX "contacts_user_id_created_at_idx" ON "contacts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "contacts_title_location_idx" ON "contacts" USING btree ("position","location");--> statement-breakpoint
CREATE INDEX "contacts_industry_size_idx" ON "contacts" USING btree ("industry","company_size");--> statement-breakpoint
CREATE INDEX "contacts_email_status_idx" ON "contacts" USING btree ("email_status");--> statement-breakpoint
CREATE INDEX "contacts_company_idx" ON "contacts" USING btree ("company");--> statement-breakpoint
CREATE INDEX "contacts_location_idx" ON "contacts" USING btree ("location");--> statement-breakpoint
CREATE INDEX "contacts_position_idx" ON "contacts" USING btree ("position");--> statement-breakpoint
CREATE INDEX "contacts_industry_idx" ON "contacts" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "contacts_engagement_score_idx" ON "contacts" USING btree ("engagement_score");--> statement-breakpoint
CREATE INDEX "contacts_user_id_source_idx" ON "contacts" USING btree ("user_id","source");--> statement-breakpoint
CREATE INDEX "auth_providers_user_id_idx" ON "auth_providers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_providers_provider_idx" ON "auth_providers" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "auth_providers_email_idx" ON "auth_providers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_id_idx" ON "users" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "users_email_provider_idx" ON "users" USING btree ("email_provider");--> statement-breakpoint
CREATE INDEX "users_replit_auth_id_idx" ON "users" USING btree ("replit_auth_id");--> statement-breakpoint
CREATE INDEX "follow_ups_user_id_idx" ON "follow_ups" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "follow_ups_original_email_id_idx" ON "follow_ups" USING btree ("original_email_id");--> statement-breakpoint
CREATE INDEX "replies_user_id_idx" ON "replies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "replies_sent_email_id_idx" ON "replies" USING btree ("sent_email_id");--> statement-breakpoint
CREATE INDEX "replies_sent_email_id_received_at_idx" ON "replies" USING btree ("sent_email_id","reply_received_at");--> statement-breakpoint
CREATE INDEX "replies_gmail_message_id_idx" ON "replies" USING btree ("gmail_message_id");--> statement-breakpoint
CREATE INDEX "replies_user_id_received_at_idx" ON "replies" USING btree ("user_id","reply_received_at");--> statement-breakpoint
CREATE INDEX "reply_detection_audit_user_id_idx" ON "reply_detection_audit" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reply_detection_audit_sent_email_id_idx" ON "reply_detection_audit" USING btree ("sent_email_id");--> statement-breakpoint
CREATE INDEX "reply_detection_audit_contact_id_idx" ON "reply_detection_audit" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "reply_detection_audit_timestamp_idx" ON "reply_detection_audit" USING btree ("query_timestamp");--> statement-breakpoint
CREATE INDEX "reply_detection_audit_layer_idx" ON "reply_detection_audit" USING btree ("detection_layer");--> statement-breakpoint
CREATE INDEX "reply_detection_audit_gmail_message_id_idx" ON "reply_detection_audit" USING btree ("gmail_message_id");--> statement-breakpoint
CREATE INDEX "reply_detection_audit_gmail_thread_id_idx" ON "reply_detection_audit" USING btree ("gmail_thread_id");--> statement-breakpoint
CREATE INDEX "reply_detection_audit_user_id_timestamp_idx" ON "reply_detection_audit" USING btree ("user_id","query_timestamp");--> statement-breakpoint
CREATE INDEX "sent_emails_user_id_idx" ON "sent_emails" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sent_emails_reply_received_false_idx" ON "sent_emails" USING btree ("reply_received") WHERE "sent_emails"."reply_received" = false;--> statement-breakpoint
CREATE INDEX "sent_emails_sent_at_idx" ON "sent_emails" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "sent_emails_contact_id_idx" ON "sent_emails" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "sent_emails_gmail_thread_id_idx" ON "sent_emails" USING btree ("gmail_thread_id");--> statement-breakpoint
CREATE INDEX "sent_emails_contact_id_sent_at_idx" ON "sent_emails" USING btree ("contact_id","sent_at");--> statement-breakpoint
CREATE INDEX "sent_emails_user_id_sent_at_idx" ON "sent_emails" USING btree ("user_id","sent_at");--> statement-breakpoint
CREATE INDEX "sent_emails_archived_idx" ON "sent_emails" USING btree ("archived");--> statement-breakpoint
CREATE INDEX "sent_emails_user_id_archived_idx" ON "sent_emails" USING btree ("user_id","archived");--> statement-breakpoint
CREATE INDEX "campaign_contacts_campaign_id_idx" ON "campaign_contacts" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_contacts_contact_id_idx" ON "campaign_contacts" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "campaign_contacts_unique_idx" ON "campaign_contacts" USING btree ("campaign_id","contact_id");--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaigns_created_at_idx" ON "campaigns" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "campaigns_scheduled_for_idx" ON "campaigns" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "campaigns_user_id_idx" ON "campaigns" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "campaigns_status_created_at_idx" ON "campaigns" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "email_templates_user_id_idx" ON "email_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_templates_category_idx" ON "email_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "email_templates_user_id_category_idx" ON "email_templates" USING btree ("user_id","category");--> statement-breakpoint
CREATE INDEX "follow_up_sequences_user_id_idx" ON "follow_up_sequences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "follow_up_sequences_active_idx" ON "follow_up_sequences" USING btree ("active");--> statement-breakpoint
CREATE INDEX "follow_up_sequences_user_id_active_idx" ON "follow_up_sequences" USING btree ("user_id","active");--> statement-breakpoint
CREATE INDEX "sequence_enrollments_user_id_idx" ON "sequence_enrollments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sequence_enrollments_sequence_id_idx" ON "sequence_enrollments" USING btree ("sequence_id");--> statement-breakpoint
CREATE INDEX "sequence_enrollments_contact_id_idx" ON "sequence_enrollments" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "sequence_enrollments_status_idx" ON "sequence_enrollments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sequence_steps_user_id_idx" ON "sequence_steps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sequence_steps_sequence_id_idx" ON "sequence_steps" USING btree ("sequence_id");--> statement-breakpoint
CREATE INDEX "sequence_steps_step_number_idx" ON "sequence_steps" USING btree ("step_number");--> statement-breakpoint
CREATE INDEX "ab_test_results_user_id_idx" ON "ab_test_results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ab_test_results_experiment_id_idx" ON "ab_test_results" USING btree ("experiment_id");--> statement-breakpoint
CREATE INDEX "ab_test_results_variant_key_idx" ON "ab_test_results" USING btree ("variant_key");--> statement-breakpoint
CREATE INDEX "ab_test_results_sent_email_id_idx" ON "ab_test_results" USING btree ("sent_email_id");--> statement-breakpoint
CREATE INDEX "ab_tests_user_id_idx" ON "ab_tests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ab_tests_status_idx" ON "ab_tests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ab_tests_intent_scope_idx" ON "ab_tests" USING btree ("intent_scope");--> statement-breakpoint
CREATE INDEX "analytics_events_user_id_idx" ON "analytics_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "analytics_events_event_type_idx" ON "analytics_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "analytics_events_contact_id_idx" ON "analytics_events" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "analytics_events_sent_email_id_idx" ON "analytics_events" USING btree ("sent_email_id");--> statement-breakpoint
CREATE INDEX "analytics_events_campaign_id_idx" ON "analytics_events" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "analytics_events_timestamp_idx" ON "analytics_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "analytics_events_user_id_timestamp_idx" ON "analytics_events" USING btree ("user_id","timestamp");--> statement-breakpoint
CREATE INDEX "optimization_runs_user_id_idx" ON "optimization_runs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "optimization_runs_sent_email_id_idx" ON "optimization_runs" USING btree ("sent_email_id");--> statement-breakpoint
CREATE INDEX "optimization_runs_intent_idx" ON "optimization_runs" USING btree ("intent");--> statement-breakpoint
CREATE INDEX "optimization_runs_industry_idx" ON "optimization_runs" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "optimization_runs_created_at_idx" ON "optimization_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "auto_reply_logs_user_id_idx" ON "auto_reply_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auto_reply_logs_reply_id_idx" ON "auto_reply_logs" USING btree ("reply_id");--> statement-breakpoint
CREATE INDEX "auto_reply_logs_sent_at_idx" ON "auto_reply_logs" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "auto_reply_logs_status_idx" ON "auto_reply_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_preferences_user_id_idx" ON "email_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "monitoring_settings_user_id_idx" ON "monitoring_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "unsubscribes_user_id_idx" ON "unsubscribes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "unsubscribes_email_idx" ON "unsubscribes" USING btree ("email");--> statement-breakpoint
CREATE INDEX "appointment_requests_user_id_idx" ON "appointment_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "appointment_requests_reply_id_idx" ON "appointment_requests" USING btree ("reply_id");--> statement-breakpoint
CREATE INDEX "appointment_requests_status_idx" ON "appointment_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reply_notifications_user_id_idx" ON "reply_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reply_notifications_reply_id_idx" ON "reply_notifications" USING btree ("reply_id");--> statement-breakpoint
CREATE INDEX "reply_notifications_contact_id_idx" ON "reply_notifications" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "calendar_events_user_id_idx" ON "calendar_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "calendar_events_contact_id_idx" ON "calendar_events" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "calendar_events_start_time_idx" ON "calendar_events" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "calendar_events_google_event_id_idx" ON "calendar_events" USING btree ("google_event_id");--> statement-breakpoint
CREATE INDEX "meeting_preferences_user_id_idx" ON "meeting_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_bounces_user_id_idx" ON "email_bounces" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_bounces_contact_id_idx" ON "email_bounces" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "email_bounces_bounce_type_idx" ON "email_bounces" USING btree ("bounce_type");--> statement-breakpoint
CREATE INDEX "enrichment_jobs_user_id_idx" ON "enrichment_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "enrichment_jobs_contact_id_idx" ON "enrichment_jobs" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "enrichment_jobs_status_idx" ON "enrichment_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gmail_history_checkpoint_user_id_idx" ON "gmail_history_checkpoint" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "gmail_history_checkpoint_user_email_idx" ON "gmail_history_checkpoint" USING btree ("user_email");--> statement-breakpoint
CREATE INDEX "gmail_history_checkpoint_sync_status_idx" ON "gmail_history_checkpoint" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX "oauth_token_health_user_provider_idx" ON "oauth_token_health" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "oauth_token_health_healthy_idx" ON "oauth_token_health" USING btree ("is_healthy");--> statement-breakpoint
CREATE INDEX "oauth_token_health_needs_reconnect_idx" ON "oauth_token_health" USING btree ("needs_reconnect");--> statement-breakpoint
CREATE INDEX "processed_gmail_messages_user_message_unique_idx" ON "processed_gmail_messages" USING btree ("user_id","gmail_message_id");--> statement-breakpoint
CREATE INDEX "processed_gmail_messages_message_id_header_idx" ON "processed_gmail_messages" USING btree ("message_id_header");--> statement-breakpoint
CREATE INDEX "processed_gmail_messages_in_reply_to_idx" ON "processed_gmail_messages" USING btree ("in_reply_to_header");--> statement-breakpoint
CREATE INDEX "processed_gmail_messages_processed_at_idx" ON "processed_gmail_messages" USING btree ("processed_at");--> statement-breakpoint
CREATE INDEX "reply_detection_audit_log_user_id_idx" ON "reply_detection_audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reply_detection_audit_log_sent_email_id_idx" ON "reply_detection_audit_log" USING btree ("sent_email_id");--> statement-breakpoint
CREATE INDEX "reply_detection_audit_log_layer_idx" ON "reply_detection_audit_log" USING btree ("detection_layer");--> statement-breakpoint
CREATE INDEX "reply_detection_audit_log_created_at_idx" ON "reply_detection_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "scheduled_jobs_user_id_idx" ON "scheduled_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scheduled_jobs_job_type_idx" ON "scheduled_jobs" USING btree ("job_type");--> statement-breakpoint
CREATE INDEX "scheduled_jobs_status_idx" ON "scheduled_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scheduled_jobs_scheduled_for_idx" ON "scheduled_jobs" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "spam_scores_user_id_idx" ON "spam_scores" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "spam_scores_sent_email_id_idx" ON "spam_scores" USING btree ("sent_email_id");--> statement-breakpoint
CREATE INDEX "spam_scores_campaign_id_idx" ON "spam_scores" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "warm_up_activity_user_id_idx" ON "warm_up_activity" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "warm_up_activity_date_idx" ON "warm_up_activity" USING btree ("date");--> statement-breakpoint
CREATE INDEX "warm_up_activity_user_id_date_idx" ON "warm_up_activity" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "follow_up_dead_letter_user_id_idx" ON "follow_up_dead_letter" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "follow_up_dead_letter_job_id_idx" ON "follow_up_dead_letter" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "follow_up_dead_letter_review_status_idx" ON "follow_up_dead_letter" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "follow_up_dead_letter_created_at_idx" ON "follow_up_dead_letter" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "follow_up_dead_letter_user_id_review_status_idx" ON "follow_up_dead_letter" USING btree ("user_id","review_status");--> statement-breakpoint
CREATE INDEX "follow_up_job_audit_job_id_idx" ON "follow_up_job_audit" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "follow_up_job_audit_action_idx" ON "follow_up_job_audit" USING btree ("action");--> statement-breakpoint
CREATE INDEX "follow_up_job_audit_created_at_idx" ON "follow_up_job_audit" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "follow_up_jobs_user_id_idx" ON "follow_up_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "follow_up_jobs_status_idx" ON "follow_up_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "follow_up_jobs_scheduled_for_idx" ON "follow_up_jobs" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "follow_up_jobs_due_at_idx" ON "follow_up_jobs" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "follow_up_jobs_next_retry_at_idx" ON "follow_up_jobs" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "follow_up_jobs_original_email_id_idx" ON "follow_up_jobs" USING btree ("original_email_id");--> statement-breakpoint
CREATE INDEX "follow_up_jobs_contact_id_idx" ON "follow_up_jobs" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "follow_up_jobs_campaign_id_idx" ON "follow_up_jobs" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "follow_up_jobs_status_scheduled_idx" ON "follow_up_jobs" USING btree ("status","scheduled_for");--> statement-breakpoint
CREATE INDEX "follow_up_jobs_pending_due_idx" ON "follow_up_jobs" USING btree ("status","due_at") WHERE "follow_up_jobs"."status" IN ('pending', 'queued');--> statement-breakpoint
CREATE INDEX "follow_up_jobs_user_id_status_idx" ON "follow_up_jobs" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "follow_up_reconciliation_run_type_idx" ON "follow_up_reconciliation" USING btree ("run_type");--> statement-breakpoint
CREATE INDEX "follow_up_reconciliation_started_at_idx" ON "follow_up_reconciliation" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "detection_alerts_sent_user_id_idx" ON "detection_alerts_sent" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "detection_alerts_sent_alert_type_idx" ON "detection_alerts_sent" USING btree ("alert_type");--> statement-breakpoint
CREATE INDEX "reply_detection_anomalies_status_idx" ON "reply_detection_anomalies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reply_detection_anomalies_type_idx" ON "reply_detection_anomalies" USING btree ("anomaly_type");--> statement-breakpoint
CREATE INDEX "reply_detection_anomalies_user_id_idx" ON "reply_detection_anomalies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reply_detection_anomalies_severity_idx" ON "reply_detection_anomalies" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "reply_detection_dead_letter_status_idx" ON "reply_detection_dead_letter" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reply_detection_dead_letter_user_id_idx" ON "reply_detection_dead_letter" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reply_detection_dead_letter_sent_email_id_idx" ON "reply_detection_dead_letter" USING btree ("sent_email_id");--> statement-breakpoint
CREATE INDEX "reply_detection_jobs_status_idx" ON "reply_detection_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reply_detection_jobs_scheduled_for_idx" ON "reply_detection_jobs" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "reply_detection_jobs_sent_email_id_idx" ON "reply_detection_jobs" USING btree ("sent_email_id");--> statement-breakpoint
CREATE INDEX "reply_detection_jobs_user_status_idx" ON "reply_detection_jobs" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "reply_detection_jobs_priority_idx" ON "reply_detection_jobs" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "reply_detection_metrics_period_idx" ON "reply_detection_metrics" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "reply_detection_metrics_user_period_idx" ON "reply_detection_metrics" USING btree ("user_id","period_type");--> statement-breakpoint
CREATE INDEX "reply_detection_reconciliation_run_type_idx" ON "reply_detection_reconciliation_runs" USING btree ("run_type");--> statement-breakpoint
CREATE INDEX "reply_detection_reconciliation_user_id_idx" ON "reply_detection_reconciliation_runs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reply_detection_runs_job_id_idx" ON "reply_detection_runs" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "reply_detection_runs_outcome_idx" ON "reply_detection_runs" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX "apollo_quotas_user_id_idx" ON "apollo_quotas" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_search_suggestions_user_id_idx" ON "ai_search_suggestions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_search_suggestions_type_idx" ON "ai_search_suggestions" USING btree ("suggestion_type");--> statement-breakpoint
CREATE INDEX "ai_search_suggestions_expires_at_idx" ON "ai_search_suggestions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "contact_embeddings_user_id_idx" ON "contact_embeddings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "contact_embeddings_contact_id_idx" ON "contact_embeddings" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "contact_embeddings_apollo_lead_id_idx" ON "contact_embeddings" USING btree ("apollo_lead_id");--> statement-breakpoint
CREATE INDEX "lead_feedback_events_user_id_idx" ON "lead_feedback_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lead_feedback_events_session_idx" ON "lead_feedback_events" USING btree ("search_session_id");--> statement-breakpoint
CREATE INDEX "lead_feedback_events_contact_idx" ON "lead_feedback_events" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "lead_feedback_events_type_idx" ON "lead_feedback_events" USING btree ("feedback_type");--> statement-breakpoint
CREATE INDEX "lead_feedback_events_created_at_idx" ON "lead_feedback_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "lead_search_sessions_user_id_idx" ON "lead_search_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lead_search_sessions_status_idx" ON "lead_search_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lead_search_sessions_created_at_idx" ON "lead_search_sessions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "lead_search_sessions_successful_idx" ON "lead_search_sessions" USING btree ("was_successful");--> statement-breakpoint
CREATE INDEX "search_patterns_user_id_idx" ON "search_patterns" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "search_patterns_hash_idx" ON "search_patterns" USING btree ("pattern_hash");--> statement-breakpoint
CREATE INDEX "search_patterns_success_rate_idx" ON "search_patterns" USING btree ("success_rate");--> statement-breakpoint
CREATE INDEX "search_patterns_is_saved_idx" ON "search_patterns" USING btree ("is_saved");--> statement-breakpoint
CREATE INDEX "tenant_icp_profiles_user_id_idx" ON "tenant_icp_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_edit_history_user_id_idx" ON "email_edit_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_edit_history_analyzed_idx" ON "email_edit_history" USING btree ("was_analyzed");--> statement-breakpoint
CREATE INDEX "email_edit_history_created_at_idx" ON "email_edit_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_edit_history_persona_id_idx" ON "email_edit_history" USING btree ("persona_id");--> statement-breakpoint
CREATE INDEX "personalization_analytics_user_id_idx" ON "personalization_analytics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "personalization_analytics_period_start_idx" ON "personalization_analytics" USING btree ("period_start");--> statement-breakpoint
CREATE INDEX "personalization_analytics_period_type_idx" ON "personalization_analytics" USING btree ("period_type");--> statement-breakpoint
CREATE INDEX "user_email_personalization_user_id_idx" ON "user_email_personalization" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_email_personalization_enabled_idx" ON "user_email_personalization" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "user_email_personas_user_id_idx" ON "user_email_personas" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_email_personas_default_idx" ON "user_email_personas" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "user_email_personas_active_idx" ON "user_email_personas" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "user_voice_samples_user_id_idx" ON "user_voice_samples" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_voice_samples_active_idx" ON "user_voice_samples" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sent_sms_user_id_idx" ON "sent_sms" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sent_sms_contact_id_idx" ON "sent_sms" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "sent_sms_campaign_id_idx" ON "sent_sms" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "sent_sms_status_idx" ON "sent_sms" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sent_sms_sent_at_idx" ON "sent_sms" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "sent_sms_twilio_sid_idx" ON "sent_sms" USING btree ("twilio_sid");--> statement-breakpoint
CREATE INDEX "sent_sms_archived_idx" ON "sent_sms" USING btree ("archived");--> statement-breakpoint
CREATE INDEX "sent_sms_user_id_archived_idx" ON "sent_sms" USING btree ("user_id","archived");--> statement-breakpoint
CREATE INDEX "sms_opt_outs_user_id_idx" ON "sms_opt_outs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sms_opt_outs_phone_idx" ON "sms_opt_outs" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "sms_opt_outs_twilio_phone_idx" ON "sms_opt_outs" USING btree ("twilio_phone");--> statement-breakpoint
CREATE INDEX "sms_opt_outs_user_phone_idx" ON "sms_opt_outs" USING btree ("user_id","phone");--> statement-breakpoint
CREATE INDEX "sms_opt_outs_active_idx" ON "sms_opt_outs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sms_replies_user_id_idx" ON "sms_replies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sms_replies_contact_id_idx" ON "sms_replies" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "sms_replies_sent_sms_id_idx" ON "sms_replies" USING btree ("sent_sms_id");--> statement-breakpoint
CREATE INDEX "sms_replies_received_at_idx" ON "sms_replies" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "sms_settings_user_id_idx" ON "sms_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "booking_pages_user_id_idx" ON "booking_pages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "booking_pages_slug_idx" ON "booking_pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "bookings_user_id_idx" ON "bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookings_booking_page_id_idx" ON "bookings" USING btree ("booking_page_id");--> statement-breakpoint
CREATE INDEX "bookings_contact_id_idx" ON "bookings" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "bookings_start_time_idx" ON "bookings" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_guest_email_idx" ON "bookings" USING btree ("guest_email");--> statement-breakpoint
CREATE INDEX "email_variations_user_id_idx" ON "email_variations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_variations_campaign_id_idx" ON "email_variations" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "email_variations_variation_hash_idx" ON "email_variations" USING btree ("variation_hash");--> statement-breakpoint
CREATE INDEX "email_variations_user_campaign_hash_idx" ON "email_variations" USING btree ("user_id","campaign_id","variation_hash");--> statement-breakpoint
CREATE INDEX "scheduled_sends_user_id_idx" ON "scheduled_sends" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scheduled_sends_status_idx" ON "scheduled_sends" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scheduled_sends_scheduled_for_idx" ON "scheduled_sends" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "scheduled_sends_status_scheduled_for_idx" ON "scheduled_sends" USING btree ("status","scheduled_for");--> statement-breakpoint
CREATE INDEX "scheduled_sends_campaign_id_idx" ON "scheduled_sends" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "send_time_analytics_user_id_idx" ON "send_time_analytics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "send_time_analytics_channel_idx" ON "send_time_analytics" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "send_time_analytics_day_hour_idx" ON "send_time_analytics" USING btree ("day_of_week","hour_of_day");--> statement-breakpoint
CREATE INDEX "send_time_analytics_industry_idx" ON "send_time_analytics" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "send_time_analytics_user_channel_day_hour_idx" ON "send_time_analytics" USING btree ("user_id","channel","day_of_week","hour_of_day");--> statement-breakpoint
CREATE INDEX "send_time_analytics_user_industry_day_hour_idx" ON "send_time_analytics" USING btree ("user_id","industry","day_of_week","hour_of_day");--> statement-breakpoint
CREATE INDEX "spintax_templates_user_id_idx" ON "spintax_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "spintax_templates_category_idx" ON "spintax_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "contact_deep_dive_user_id_idx" ON "contact_deep_dive" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "contact_deep_dive_contact_id_idx" ON "contact_deep_dive" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "company_profiles_user_id_idx" ON "company_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "company_profiles_onboarding_complete_idx" ON "company_profiles" USING btree ("onboarding_complete");