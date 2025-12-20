import { pgTable, text, varchar, integer, boolean, timestamp, serial, index, jsonb } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth (required)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  canSendEmails: boolean("can_send_emails").default(true),
  canManageContacts: boolean("can_manage_contacts").default(true),
  canManageTemplates: boolean("can_manage_templates").default(true),
  canManageSequences: boolean("can_manage_sequences").default(true),
  canViewAnalytics: boolean("can_view_analytics").default(true),
  canManageTeam: boolean("can_manage_team").default(false),
  canManageSettings: boolean("can_manage_settings").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users table - Replit Auth + Optional Email Connectors (Gmail/Outlook)
// Supports both Replit authentication and optional email/password auth
export const users = pgTable("users", {
  id: serial("id").primaryKey(), // PRESERVED: Keep existing serial ID for backward compatibility
  email: varchar("email", { length: 255 }).unique(), // Email can be null initially for Replit users
  passwordHash: varchar("password_hash", { length: 255 }), // Optional: Only for email/password auth
  
  // User profile fields
  name: varchar("name", { length: 255 }), // Optional: Can be derived from firstName + lastName for Replit users
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  companyName: varchar("company_name", { length: 255 }), // Optional: Not required for Replit auth
  position: varchar("position", { length: 255 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  phone: varchar("phone", { length: 50 }), // Optional: For receiving SMS notifications about bookings
  
  // Email verification fields
  emailVerified: boolean("email_verified").default(false),
  verificationToken: varchar("verification_token", { length: 255 }),
  
  // Password reset fields
  resetPasswordToken: varchar("reset_password_token", { length: 255 }),
  resetPasswordExpires: timestamp("reset_password_expires"),
  
  // Auth and permissions
  roleId: integer("role_id").references(() => userRoles.id),
  active: boolean("active").default(true),
  
  // Email provider (gmail/outlook) - nullable until user connects an email account
  emailProvider: varchar("email_provider", { length: 20 }), // 'gmail', 'outlook', or null if not connected
  gmailConnected: boolean("gmail_connected").default(false),
  
  // Replit Auth ID (stores the 'sub' claim from Replit OIDC)
  replitAuthId: varchar("replit_auth_id", { length: 255 }).unique(), // Unique Replit user identifier
  
  // Timestamps
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  roleIdIdx: index("users_role_id_idx").on(table.roleId),
  emailProviderIdx: index("users_email_provider_idx").on(table.emailProvider),
  replitAuthIdIdx: index("users_replit_auth_id_idx").on(table.replitAuthId),
}));

export const usersRelations = relations(users, ({ one }) => ({
  role: one(userRoles, {
    fields: [users.roleId],
    references: [userRoles.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ many }) => ({
  users: many(users),
}));

// OAuth provider tokens table
export const authProviders = pgTable("auth_providers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar("provider", { length: 20 }).notNull(), // 'gmail' or 'outlook'
  email: varchar("email", { length: 255 }).notNull(), // OAuth account email
  accessToken: text("access_token").notNull(), // Encrypted OAuth access token
  refreshToken: text("refresh_token"), // Encrypted OAuth refresh token (optional)
  expiresAt: timestamp("expires_at"), // Token expiration timestamp
  scope: text("scope"), // OAuth scopes granted
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index("auth_providers_user_id_idx").on(table.userId),
  providerIdx: index("auth_providers_provider_idx").on(table.provider),
  emailIdx: index("auth_providers_email_idx").on(table.email),
}));

export const authProvidersRelations = relations(authProviders, ({ one }) => ({
  user: one(users, {
    fields: [authProviders.userId],
    references: [users.id],
  }),
}));

export const usersRelationsUpdated = relations(users, ({ one, many }) => ({
  role: one(userRoles, {
    fields: [users.roleId],
    references: [userRoles.id],
  }),
  authProviders: many(authProviders),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuthProviderSchema = createInsertSchema(authProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type InsertAuthProvider = z.infer<typeof insertAuthProviderSchema>;

export type User = typeof users.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type AuthProvider = typeof authProviders.$inferSelect;
