import { db } from "../db";
import { eq } from "drizzle-orm";
import { monitoringSettings } from "@shared/schema";

export async function getMonitoringSettings() {
  const [settings] = await db.select().from(monitoringSettings).where(eq(monitoringSettings.userId, 'default')).limit(1);
  if (!settings) { const [newSettings] = await db.insert(monitoringSettings).values({ userId: 'default', enabled: true, smsPhoneNumber: null, scanIntervalMinutes: 30 }).returning(); return newSettings; }
  return settings;
}

export async function updateLastScanTime() {
  await db.update(monitoringSettings).set({ lastScanTime: new Date() }).where(eq(monitoringSettings.userId, 'default'));
}
