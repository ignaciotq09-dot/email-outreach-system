import { Request, Response } from 'express';
import { db } from "../db";
import { pendingUsers, pendingUserInfoSchema } from "@shared/schema";
import { eq, lt } from "drizzle-orm";
import { nanoid } from 'nanoid';
import { signStateToken } from './state-token';

export async function createPendingUser(req: Request, res: Response) {
  try {
    const validation = pendingUserInfoSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      });
    }

    const { name, companyName, position } = validation.data;
    
    const token = nanoid(32);
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    const [pendingUser] = await db.insert(pendingUsers).values({
      token,
      name,
      companyName,
      position: position || null,
      expiresAt,
    }).returning();

    const signedState = signStateToken(pendingUser.token);

    return res.json({
      stateToken: signedState,
      expiresAt: pendingUser.expiresAt,
    });
  } catch (error) {
    console.error('[PendingUsers] Error creating pending user:', error);
    return res.status(500).json({ error: 'Failed to create pending user' });
  }
}

export async function getPendingUser(token: string) {
  try {
    const [pendingUser] = await db
      .select()
      .from(pendingUsers)
      .where(eq(pendingUsers.token, token))
      .limit(1);

    if (!pendingUser) {
      return null;
    }

    if (new Date() > new Date(pendingUser.expiresAt)) {
      await db.delete(pendingUsers).where(eq(pendingUsers.token, token));
      return null;
    }

    return pendingUser;
  } catch (error) {
    console.error('[PendingUsers] Error getting pending user:', error);
    return null;
  }
}

export async function deletePendingUser(token: string) {
  try {
    await db.delete(pendingUsers).where(eq(pendingUsers.token, token));
  } catch (error) {
    console.error('[PendingUsers] Error deleting pending user:', error);
  }
}

export async function cleanupExpiredPendingUsers() {
  try {
    const now = new Date();
    const deleted = await db
      .delete(pendingUsers)
      .where(lt(pendingUsers.expiresAt, now))
      .returning();
    
    if (deleted.length > 0) {
      console.log(`[PendingUsers] Cleaned up ${deleted.length} expired pending users`);
    }
  } catch (error) {
    console.error('[PendingUsers] Error cleaning up expired pending users:', error);
  }
}
