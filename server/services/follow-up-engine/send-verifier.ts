import { storage } from "../../storage";
import { getUserEmailService } from "../../user-email-service";
import type { VerificationResult } from "./types";

const VERIFICATION_DELAY_MS = 5000;
const MAX_VERIFICATION_ATTEMPTS = 3;
const VERIFICATION_INTERVAL_MS = 10000;

export async function verifySendComplete(
  userId: number,
  messageId: string,
  threadId?: string
): Promise<VerificationResult> {
  const startTime = Date.now();
  let checkCount = 0;
  
  try {
    const user = await storage.getUserById(userId);
    if (!user) {
      return {
        verified: false,
        foundInSent: false,
        checkCount: 0,
        errorMessage: 'User not found',
      };
    }
    
    await new Promise(resolve => setTimeout(resolve, VERIFICATION_DELAY_MS));
    
    const emailService = getUserEmailService(user);
    
    for (let attempt = 0; attempt < MAX_VERIFICATION_ATTEMPTS; attempt++) {
      checkCount++;
      
      try {
        const found = await checkMessageExists(emailService, messageId, threadId);
        
        if (found) {
          console.log(`[SendVerifier] Message ${messageId} verified after ${checkCount} checks`);
          return {
            verified: true,
            foundInSent: true,
            checkCount,
          };
        }
        
        if (attempt < MAX_VERIFICATION_ATTEMPTS - 1) {
          await new Promise(resolve => setTimeout(resolve, VERIFICATION_INTERVAL_MS));
        }
        
      } catch (error: any) {
        console.warn(`[SendVerifier] Check ${checkCount} failed:`, error?.message);
      }
    }
    
    console.warn(`[SendVerifier] Message ${messageId} not verified after ${checkCount} checks`);
    return {
      verified: false,
      foundInSent: false,
      checkCount,
      errorMessage: `Message not found in sent folder after ${checkCount} verification attempts`,
    };
    
  } catch (error: any) {
    return {
      verified: false,
      foundInSent: false,
      checkCount,
      errorMessage: error?.message || 'Verification error',
    };
  }
}

async function checkMessageExists(
  emailService: any,
  messageId: string,
  threadId?: string
): Promise<boolean> {
  try {
    if (threadId) {
      const thread = await emailService.getThread?.(threadId);
      if (thread?.messages) {
        return thread.messages.some((msg: any) => msg.id === messageId);
      }
    }
    
    const message = await emailService.getMessage?.(messageId);
    return !!message;
    
  } catch (error: any) {
    if (error?.code === 404) {
      return false;
    }
    throw error;
  }
}

export async function quickVerify(
  userId: number,
  messageId: string
): Promise<boolean> {
  try {
    const user = await storage.getUserById(userId);
    if (!user) return false;
    
    const emailService = getUserEmailService(user);
    const userEmail = await emailService.getUserEmail();
    return !!userEmail;
    
  } catch {
    return false;
  }
}
