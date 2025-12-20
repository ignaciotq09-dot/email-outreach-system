import type { Contact, InsertContact, SentEmail, InsertSentEmail, Reply, InsertReply, FollowUp, InsertFollowUp, EmailPreferences, InsertEmailPreferences, SentEmailWithContact, User, InsertOptimizationRun, OptimizationRun, InsertAbTest, AbTest, InsertAbTestResult, AbTestResult, UserEmailPersonalization, InsertUserEmailPersonalization, UpdateUserEmailPersonalization, UserVoiceSample, InsertUserVoiceSample, UserEmailPersona, InsertUserEmailPersona, UpdateUserEmailPersona, EmailEditHistory, InsertEmailEditHistory } from "@shared/schema";

export interface IStorage {
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByReplitAuthId(replitAuthId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(userData: { email: string; passwordHash?: string | null; name: string; companyName: string; position: string | null; emailProvider: string; profileImageUrl: string | null; roleId?: number | null; active?: boolean; lastLoginAt?: Date | null; }): Promise<User>;
  upsertReplitUser(userData: { replitAuthId: string; email: string | null; firstName: string | null; lastName: string | null; profileImageUrl: string | null; }): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | null>;
  updateUserLastLogin(id: number): Promise<void>;
  
  createContact(userId: number, contact: InsertContact): Promise<Contact>;
  getAllContacts(userId: number): Promise<Contact[]>;
  getContactsByIds(userId: number, ids: number[]): Promise<Contact[]>;
  getContactById(userId: number, id: number): Promise<Contact | undefined>;
  updateContactPronoun(userId: number, id: number, pronoun: string): Promise<void>;
  updateContact(userId: number, id: number, data: Partial<Contact>): Promise<Contact | undefined>;
  deleteContact(userId: number, id: number): Promise<boolean>;
  
  createSentEmail(userId: number, email: InsertSentEmail): Promise<SentEmail>;
  getSentEmails(userId: number, limit?: number, offset?: number): Promise<SentEmailWithContact[]>;
  getSentEmailById(userId: number, id: number): Promise<SentEmailWithContact | undefined>;
  updateSentEmailReplyStatus(userId: number, id: number, replyReceived: boolean, lastReplyCheck: Date): Promise<void>;
  getSentEmailsWithoutReplies(userId: number): Promise<SentEmailWithContact[]>;
  getUserSentEmailContactIds(userId: number): Promise<number[]>;
  
  createReply(userId: number, reply: InsertReply): Promise<Reply>;
  getReplies(userId: number, limit?: number, offset?: number): Promise<Reply[]>;
  getReplyById(userId: number, id: number): Promise<Reply | undefined>;
  
  createFollowUp(userId: number, followUp: InsertFollowUp): Promise<FollowUp>;
  getFollowUps(userId: number, limit?: number, offset?: number): Promise<FollowUp[]>;
  getEmailsNeedingFollowUp(userId: number): Promise<SentEmailWithContact[]>;
  
  getEmailPreferences(userId: number): Promise<EmailPreferences | undefined>;
  saveEmailPreferences(userId: number, preferences: InsertEmailPreferences): Promise<EmailPreferences>;
  
  logOptimizationRun(userId: number, optimization: InsertOptimizationRun): Promise<OptimizationRun>;
  getOptimizationRunsByEmail(userId: number, emailId: number): Promise<OptimizationRun[]>;
  getOptimizationRunsByCampaign(userId: number, campaignId: number): Promise<OptimizationRun[]>;
  getAverageOptimizationScore(userId: number): Promise<number>;
  
  createABTest(userId: number, test: InsertAbTest): Promise<AbTest>;
  logABTestResult(userId: number, result: InsertAbTestResult): Promise<AbTestResult>;
  getABTest(userId: number, testId: number): Promise<AbTest | null>;
  getABTestResults(userId: number, testId: number): Promise<AbTestResult[]>;
  getActiveABTests(userId: number): Promise<AbTest[]>;
  
  storeOAuthTokens(data: { userId: number; provider: string; email: string; accessToken: string; refreshToken?: string; expiresAt?: Date; scope?: string; }): Promise<void>;
  getOAuthTokens(userId: number, provider: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date; email: string; } | null>;
  updateOAuthTokens(userId: number, provider: string, data: { accessToken: string; refreshToken?: string; expiresAt?: Date; }): Promise<void>;
  deleteOAuthTokens(userId: number, provider: string): Promise<void>;
  
  getEmailPersonalization(userId: number): Promise<UserEmailPersonalization | undefined>;
  upsertEmailPersonalization(userId: number, data: InsertUserEmailPersonalization): Promise<UserEmailPersonalization>;
  updateEmailPersonalization(userId: number, data: UpdateUserEmailPersonalization): Promise<UserEmailPersonalization | undefined>;
  
  getVoiceSamples(userId: number): Promise<UserVoiceSample[]>;
  addVoiceSample(userId: number, sample: Omit<InsertUserVoiceSample, 'userId'>): Promise<UserVoiceSample>;
  updateVoiceSample(userId: number, sampleId: number, data: Partial<InsertUserVoiceSample>): Promise<UserVoiceSample | undefined>;
  deleteVoiceSample(userId: number, sampleId: number): Promise<boolean>;
  
  getEmailPersonas(userId: number): Promise<UserEmailPersona[]>;
  getEmailPersonaById(userId: number, personaId: number): Promise<UserEmailPersona | undefined>;
  createEmailPersona(userId: number, persona: Omit<InsertUserEmailPersona, 'userId'>): Promise<UserEmailPersona>;
  updateEmailPersona(userId: number, personaId: number, data: UpdateUserEmailPersona): Promise<UserEmailPersona | undefined>;
  deleteEmailPersona(userId: number, personaId: number): Promise<boolean>;
  setDefaultPersona(userId: number, personaId: number): Promise<void>;
  incrementPersonaUsage(userId: number, personaId: number): Promise<void>;
  
  trackEmailEdit(userId: number, edit: Omit<InsertEmailEditHistory, 'userId'>): Promise<EmailEditHistory>;
  getEmailEditHistory(userId: number, limit?: number): Promise<EmailEditHistory[]>;
  getUnanalyzedEdits(userId: number, limit?: number): Promise<EmailEditHistory[]>;
  markEditsAsAnalyzed(userId: number, editIds: number[]): Promise<void>;
}
