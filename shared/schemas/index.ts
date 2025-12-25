// Central export file for all schema modules
// Import order follows dependency chain to avoid circular dependencies:
// contacts → users → emails → campaigns → templates → sequences → analytics → settings → appointments → system

// 1. Contacts (no dependencies)
export * from "./contacts-schema";

// 2. Users (no dependencies)
export * from "./users-schema";
export * from "./pending-users-schema";

// 3. Emails (depends on contacts)
export * from "./emails-schema";

// 4. Campaigns (depends on contacts, emails)
export * from "./campaigns-schema";

// 5. Templates (no dependencies)
export * from "./templates-schema";

// 6. Sequences (depends on contacts, emails)
export * from "./sequences-schema";

// 7. Analytics (depends on contacts, emails, campaigns)
export * from "./analytics-schema";

// 8. Settings (no dependencies)
export * from "./settings-schema";

// 9. Warmup (no dependencies)
export * from "./warmup-schema";

// 10. Unsubscribes (no dependencies)
export * from "./unsubscribe-schema";

// 11. Appointments (depends on contacts, emails)
export * from "./appointments-schema";

// 12. Calendar (depends on users, contacts)
export * from "./calendar-schema";

// 13. System (depends on contacts, emails, campaigns)
export * from "./system-schema";

// 14. Follow-up Jobs (depends on contacts, emails, campaigns, sequences)
export * from "./follow-up-jobs-schema";

// 15. Reply Detection Jobs (depends on users, contacts, emails)
export * from "./reply-detection-jobs-schema";

// 16. Apollo Quotas (depends on users)
export * from "./apollo-quotas-schema";

// 17. AI Search (depends on users, contacts, emails)
export * from "./ai-search-schema";

// 18. Email Personalization (depends on users)
export * from "./email-personalization-schema";

// 19. SMS (depends on users, contacts, campaigns)
export * from "./sms-schema";

// 20. Booking (depends on users, contacts)
export * from "./booking-schema";

// 21. Spintax & Send Time Optimization (depends on users, contacts, campaigns)
export * from "./spintax-schema";

// 22. Deep Dive (depends on users, contacts)
export * from "./deep-dive-schema";

// 23. Company Profiles (depends on users) - for onboarding
export * from "./company-profile-schema";
