import type { IStorage } from "./types";
import * as userOps from "./users";
import * as contactOps from "./contacts";
import * as emailOps from "./emails";
import * as prefOps from "./preferences";
import * as optOps from "./optimization";
import * as oauthOps from "./oauth";
import * as persOps from "./personalization";

export class DatabaseStorage implements IStorage {
  getUserById = userOps.getUserById;
  getUserByEmail = userOps.getUserByEmail;
  getUserByReplitAuthId = userOps.getUserByReplitAuthId;
  getAllUsers = userOps.getAllUsers;
  createUser = userOps.createUser;
  upsertReplitUser = userOps.upsertReplitUser;
  updateUser = userOps.updateUser;
  updateUserLastLogin = userOps.updateUserLastLogin;

  createContact = contactOps.createContact;
  getAllContacts = contactOps.getAllContacts;
  getContactsByIds = contactOps.getContactsByIds;
  getContactById = contactOps.getContactById;
  updateContact = contactOps.updateContact;
  deleteContact = contactOps.deleteContact;
  updateContactPronoun = contactOps.updateContactPronoun;

  createSentEmail = emailOps.createSentEmail;
  getSentEmails = emailOps.getSentEmails;
  getSentEmailById = emailOps.getSentEmailById;
  updateSentEmailReplyStatus = emailOps.updateSentEmailReplyStatus;
  getSentEmailsWithoutReplies = emailOps.getSentEmailsWithoutReplies;
  getUserSentEmailContactIds = emailOps.getUserSentEmailContactIds;
  createReply = emailOps.createReply;
  getReplies = emailOps.getReplies;
  getReplyById = emailOps.getReplyById;
  createFollowUp = emailOps.createFollowUp;
  getFollowUps = emailOps.getFollowUps;
  
  async getEmailsNeedingFollowUp(userId: number) {
    return emailOps.getEmailsNeedingFollowUp(userId, emailOps.getSentEmailsWithoutReplies);
  }

  getEmailPreferences = prefOps.getEmailPreferences;
  saveEmailPreferences = prefOps.saveEmailPreferences;

  logOptimizationRun = optOps.logOptimizationRun;
  async getOptimizationRunsByEmail(userId: number, emailId: number) {
    return optOps.getOptimizationRunsByEmail(userId, emailId, emailOps.getSentEmailById);
  }
  getOptimizationRunsByCampaign = optOps.getOptimizationRunsByCampaign;
  getAverageOptimizationScore = optOps.getAverageOptimizationScore;
  createABTest = optOps.createABTest;
  logABTestResult = optOps.logABTestResult;
  getABTest = optOps.getABTest;
  async getABTestResults(userId: number, testId: number) {
    return optOps.getABTestResults(userId, testId, optOps.getABTest);
  }
  getActiveABTests = optOps.getActiveABTests;

  storeOAuthTokens = oauthOps.storeOAuthTokens;
  getOAuthTokens = oauthOps.getOAuthTokens;
  updateOAuthTokens = oauthOps.updateOAuthTokens;
  deleteOAuthTokens = oauthOps.deleteOAuthTokens;

  getEmailPersonalization = persOps.getEmailPersonalization;
  upsertEmailPersonalization = persOps.upsertEmailPersonalization;
  updateEmailPersonalization = persOps.updateEmailPersonalization;
  getVoiceSamples = persOps.getVoiceSamples;
  addVoiceSample = persOps.addVoiceSample;
  updateVoiceSample = persOps.updateVoiceSample;
  deleteVoiceSample = persOps.deleteVoiceSample;
  getEmailPersonas = persOps.getEmailPersonas;
  getEmailPersonaById = persOps.getEmailPersonaById;
  createEmailPersona = persOps.createEmailPersona;
  updateEmailPersona = persOps.updateEmailPersona;
  deleteEmailPersona = persOps.deleteEmailPersona;
  setDefaultPersona = persOps.setDefaultPersona;
  incrementPersonaUsage = persOps.incrementPersonaUsage;
  trackEmailEdit = persOps.trackEmailEdit;
  getEmailEditHistory = persOps.getEmailEditHistory;
  getUnanalyzedEdits = persOps.getUnanalyzedEdits;
  markEditsAsAnalyzed = persOps.markEditsAsAnalyzed;
}

export const storage = new DatabaseStorage();
export type { IStorage } from "./types";
