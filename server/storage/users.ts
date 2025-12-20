import { db } from "../db";
import { users, type User } from "@shared/schema";
import { eq } from "drizzle-orm";
import { cacheService, CacheKeys } from "../services/cache-service";

export async function getUserById(id: number): Promise<User | undefined> {
  // Try cache first
  const cacheKey = CacheKeys.user.byId(id);
  const cached = cacheService.get<User>(cacheKey);

  if (cached) {
    return cached;
  }

  // Cache miss - query database
  const [user] = await db.select().from(users).where(eq(users.id, id));

  // Store in cache if found
  if (user) {
    cacheService.set(cacheKey, user);
  }

  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  // Try cache first
  const cacheKey = CacheKeys.user.byEmail(email);
  const cached = cacheService.get<User>(cacheKey);

  if (cached) {
    return cached;
  }

  // Cache miss - query database
  const [user] = await db.select().from(users).where(eq(users.email, email));

  // Store in cache if found
  if (user) {
    cacheService.set(cacheKey, user);
    // Also cache by ID for future lookups
    cacheService.set(CacheKeys.user.byId(user.id), user);
  }

  return user;
}

export async function getUserByReplitAuthId(replitAuthId: string): Promise<User | undefined> {
  // Try cache first
  const cacheKey = CacheKeys.user.byReplitAuthId(replitAuthId);
  const cached = cacheService.get<User>(cacheKey);

  if (cached) {
    return cached;
  }

  // Cache miss - query database
  const [user] = await db.select().from(users).where(eq(users.replitAuthId, replitAuthId));

  // Store in cache if found
  if (user) {
    cacheService.set(cacheKey, user);
    // Also cache by ID and email
    cacheService.set(CacheKeys.user.byId(user.id), user);
    if (user.email) {
      cacheService.set(CacheKeys.user.byEmail(user.email), user);
    }
  }

  return user;
}

export async function getAllUsers(): Promise<User[]> {
  // Not cached - typically used for admin operations only
  return await db.select().from(users).where(eq(users.active, true));
}

export async function upsertReplitUser(userData: { replitAuthId: string; email: string | null; firstName: string | null; lastName: string | null; profileImageUrl: string | null; }): Promise<User> {
  const [user] = await db.insert(users).values({
    replitAuthId: userData.replitAuthId,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    name: userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.firstName || userData.email || 'User',
    profileImageUrl: userData.profileImageUrl,
    emailVerified: true,
    active: true,
    lastLoginAt: new Date(),
  }).onConflictDoUpdate({
    target: users.replitAuthId,
    set: {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      name: userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.firstName || userData.email || 'User',
      profileImageUrl: userData.profileImageUrl,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    },
  }).returning();

  // Invalidate all cache entries for this user
  if (user) {
    cacheService.delete(CacheKeys.user.byId(user.id));
    cacheService.delete(CacheKeys.user.byReplitAuthId(user.replitAuthId!));
    if (user.email) {
      cacheService.delete(CacheKeys.user.byEmail(user.email));
    }
  }

  return user;
}

export async function createUser(userData: { email: string; passwordHash?: string | null; name: string; companyName: string; position: string | null; emailProvider: string; profileImageUrl: string | null; roleId?: number | null; active?: boolean; lastLoginAt?: Date | null; }): Promise<User> {
  const [user] = await db.insert(users).values({
    email: userData.email,
    passwordHash: userData.passwordHash || null,
    name: userData.name,
    companyName: userData.companyName,
    position: userData.position,
    emailProvider: userData.emailProvider,
    profileImageUrl: userData.profileImageUrl,
    roleId: userData.roleId ?? null,
    active: userData.active ?? true,
    lastLoginAt: userData.lastLoginAt ?? new Date(),
  }).returning();

  // No need to invalidate cache for new user (nothing cached yet)
  return user;
}

export async function updateUser(id: number, data: Partial<User>): Promise<User | null> {
  const [user] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();

  // Invalidate cache for updated user
  if (user) {
    cacheService.delete(CacheKeys.user.byId(user.id));
    if (user.email) {
      cacheService.delete(CacheKeys.user.byEmail(user.email));
    }
    if (user.replitAuthId) {
      cacheService.delete(CacheKeys.user.byReplitAuthId(user.replitAuthId));
    }
  }

  return user || null;
}

export async function updateUserLastLogin(id: number): Promise<void> {
  await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, id));

  // Invalidate cache to ensure fresh data on next fetch
  cacheService.delete(CacheKeys.user.byId(id));
}
