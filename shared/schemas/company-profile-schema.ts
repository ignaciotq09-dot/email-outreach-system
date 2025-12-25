import { pgTable, text, varchar, integer, boolean, timestamp, serial, index, jsonb } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users-schema";

// Company profiles for onboarding - stores everything we know about the client's company
export const companyProfiles = pgTable("company_profiles", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),

    // === ONLINE PRESENCE ===
    hasOnlinePresence: boolean("has_online_presence").default(false),
    websiteUrl: varchar("website_url", { length: 500 }),
    instagramHandle: varchar("instagram_handle", { length: 100 }),

    // === BUSINESS IDENTITY ===
    companyName: varchar("company_name", { length: 255 }),
    businessType: varchar("business_type", { length: 50 }), // 'B2B', 'B2C', 'Both', 'Nonprofit'
    industry: varchar("industry", { length: 100 }),
    industryOther: varchar("industry_other", { length: 100 }), // If "Other" selected
    yearsInBusiness: varchar("years_in_business", { length: 50 }),
    employeeCount: varchar("employee_count", { length: 50 }),
    tagline: varchar("tagline", { length: 500 }),
    missionStatement: text("mission_statement"),

    // === PRODUCTS & SERVICES ===
    businessDescription: text("business_description"), // One-sentence description
    productsServices: jsonb("products_services").$type<string[]>(), // Array of offerings
    pricingModel: jsonb("pricing_model").$type<string[]>(), // Array: subscription, one-time, hourly, etc.
    typicalDealSize: varchar("typical_deal_size", { length: 100 }),

    // === TARGET CUSTOMERS ===
    idealCustomerDescription: text("ideal_customer_description"),
    targetJobTitles: jsonb("target_job_titles").$type<string[]>(),
    targetIndustries: jsonb("target_industries").$type<string[]>(),
    targetCompanySizes: jsonb("target_company_sizes").$type<string[]>(),
    targetGeographies: jsonb("target_geographies").$type<string[]>(),

    // === VALUE PROPOSITION ===
    problemSolved: text("problem_solved"),
    uniqueDifferentiator: text("unique_differentiator"),
    typicalResults: text("typical_results"),
    notableClients: text("notable_clients"), // Case studies, testimonials

    // === SALES PROCESS ===
    salesCycleLength: varchar("sales_cycle_length", { length: 50 }),
    commonObjections: jsonb("common_objections").$type<string[]>(),
    currentChallenges: text("current_challenges"),

    // === BRAND VOICE ===
    brandPersonality: jsonb("brand_personality").$type<string[]>(), // Up to 3 traits
    formalityLevel: varchar("formality_level", { length: 50 }),
    phrasesToUse: text("phrases_to_use"),
    phrasesToAvoid: text("phrases_to_avoid"),

    // === CALL TO ACTION ===
    desiredLeadAction: jsonb("desired_lead_action").$type<string[]>(),
    additionalNotes: text("additional_notes"),

    // === METADATA ===
    dataSource: varchar("data_source", { length: 50 }).default('manual'), // 'ai_extracted', 'manual', 'hybrid'
    extractionConfidence: integer("extraction_confidence"), // 0-100 overall confidence

    // Field-level validation status (tracks which fields user validated with thumbs up/down)
    validatedFields: jsonb("validated_fields").$type<Record<string, {
        validated: boolean;
        wasCorrect: boolean;
        correctedAt?: string;
    }>>(),

    // Onboarding progress
    onboardingStep: varchar("onboarding_step", { length: 50 }).default('not_started'),
    onboardingComplete: boolean("onboarding_complete").default(false),
    completedAt: timestamp("completed_at"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
    userIdIdx: index("company_profiles_user_id_idx").on(table.userId),
    onboardingCompleteIdx: index("company_profiles_onboarding_complete_idx").on(table.onboardingComplete),
}));

// Relations
export const companyProfilesRelations = relations(companyProfiles, ({ one }) => ({
    user: one(users, {
        fields: [companyProfiles.userId],
        references: [users.id],
    }),
}));

// Zod schemas for validation
export const insertCompanyProfileSchema = createInsertSchema(companyProfiles).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const updateCompanyProfileSchema = insertCompanyProfileSchema.partial();

// Types
export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type InsertCompanyProfile = z.infer<typeof insertCompanyProfileSchema>;
export type UpdateCompanyProfile = z.infer<typeof updateCompanyProfileSchema>;

// Onboarding step enum for tracking progress
export const OnboardingSteps = {
    NOT_STARTED: 'not_started',
    PRESENCE_CHECK: 'presence_check',
    URL_INPUT: 'url_input',
    AI_EXTRACTION: 'ai_extraction',
    VALIDATION: 'validation',
    GAP_QUESTIONS: 'gap_questions',
    MANUAL_QUESTIONNAIRE: 'manual_questionnaire',
    REVIEW: 'review',
    COMPLETE: 'complete',
} as const;

export type OnboardingStep = typeof OnboardingSteps[keyof typeof OnboardingSteps];
