import type { LinkedInCookies, LinkedInApiResponse } from "./types";
import { VOYAGER_API_BASE } from "./types";
import { getSessionCookies, buildHeaders } from "./cookies";

export function extractProfileId(profileUrl: string): string | null {
  try {
    const patterns = [/linkedin\.com\/in\/([^\/\?]+)/, /linkedin\.com\/sales\/people\/([^\/\?,]+)/, /linkedin\.com\/sales\/lead\/([^\/\?,]+)/];
    for (const pattern of patterns) { const match = profileUrl.match(pattern); if (match) return match[1]; }
    return null;
  } catch { return null; }
}

export async function getProfileUrn(userId: number, profileUrl: string): Promise<string | null> {
  try {
    const cookies = await getSessionCookies(userId);
    if (!cookies) return null;
    const profileId = extractProfileId(profileUrl);
    if (!profileId) return null;
    const response = await fetch(`${VOYAGER_API_BASE}/identity/profiles/${profileId}`, { method: "GET", headers: buildHeaders(cookies) });
    if (!response.ok) return null;
    const data = await response.json();
    return data.entityUrn || data.data?.entityUrn || null;
  } catch (error) { console.error("[LinkedIn Cookie API] Error getting profile URN:", error); return null; }
}

export async function fetchProfileData(userId: number, profileUrl: string): Promise<LinkedInApiResponse> {
  try {
    const cookies = await getSessionCookies(userId);
    if (!cookies) { return { success: false, error: "LinkedIn not connected via extension" }; }
    const profileId = extractProfileId(profileUrl);
    if (!profileId) { return { success: false, error: "Invalid LinkedIn profile URL" }; }
    const response = await fetch(`${VOYAGER_API_BASE}/identity/dash/profiles?q=memberIdentity&memberIdentity=${profileId}&decorationId=com.linkedin.voyager.dash.deco.identity.profile.WebTopCardCore-16`, { method: "GET", headers: buildHeaders(cookies) });
    if (!response.ok) {
      if (response.status === 429) return { success: false, error: "Rate limited by LinkedIn - please wait and try again" };
      if (response.status === 401 || response.status === 403) return { success: false, error: "Session expired - please reconnect via extension" };
      return { success: false, error: `LinkedIn API error: ${response.status}` };
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error: any) { console.error("[LinkedIn Cookie API] Error fetching profile:", error); return { success: false, error: error.message }; }
}

export async function getConnectionStatus(userId: number, profileUrl: string): Promise<{ connected: boolean; pending: boolean; error?: string }> {
  try {
    const cookies = await getSessionCookies(userId);
    if (!cookies) { return { connected: false, pending: false, error: "LinkedIn not connected via extension" }; }
    const profileId = extractProfileId(profileUrl);
    if (!profileId) { return { connected: false, pending: false, error: "Invalid profile URL" }; }
    const response = await fetch(`${VOYAGER_API_BASE}/identity/profiles/${profileId}/networkinfo`, { method: "GET", headers: buildHeaders(cookies) });
    if (!response.ok) { return { connected: false, pending: false, error: `API error: ${response.status}` }; }
    const data = await response.json();
    const distance = data.distance?.value || data.data?.distance?.value;
    return { connected: distance === "DISTANCE_1", pending: distance === "OUT_OF_NETWORK" && (data.pendingInvitation || false) };
  } catch (error: any) { console.error("[LinkedIn Cookie API] Error getting connection status:", error); return { connected: false, pending: false, error: error.message }; }
}
