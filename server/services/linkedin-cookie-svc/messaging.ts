import { db } from "../../db";
import { linkedinSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { LinkedInApiResponse } from "./types";
import { VOYAGER_API_BASE } from "./types";
import { getSessionCookies, buildHeaders } from "./cookies";
import { getProfileUrn } from "./profile";

export async function sendConnectionRequest(userId: number, profileUrl: string, note?: string): Promise<LinkedInApiResponse> {
  try {
    const cookies = await getSessionCookies(userId);
    if (!cookies) { return { success: false, error: "LinkedIn not connected via extension" }; }
    const profileUrn = await getProfileUrn(userId, profileUrl);
    if (!profileUrn) { return { success: false, error: "Could not find LinkedIn profile" }; }
    const payload: any = { trackingId: crypto.randomUUID(), invitations: [], excludeInvitations: [], invitee: { "com.linkedin.voyager.growth.invitation.InviteeProfile": { profileId: profileUrn } } };
    if (note) { payload.message = note.slice(0, 300); }
    const response = await fetch(`${VOYAGER_API_BASE}/growth/normInvitations`, { method: "POST", headers: { ...buildHeaders(cookies), "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[LinkedIn Cookie API] Connection request failed:", response.status, errorText);
      if (response.status === 429) return { success: false, error: "Rate limited by LinkedIn - please wait and try again" };
      if (response.status === 401 || response.status === 403) return { success: false, error: "Session expired - please reconnect via extension" };
      return { success: false, error: `LinkedIn API error: ${response.status}` };
    }
    const data = await response.json();
    console.log(`[LinkedIn Cookie API] Connection request sent to ${profileUrl}`);
    return { success: true, data };
  } catch (error: any) { console.error("[LinkedIn Cookie API] Error sending connection request:", error); return { success: false, error: error.message }; }
}

export async function sendDirectMessage(userId: number, profileUrl: string, message: string): Promise<LinkedInApiResponse> {
  try {
    const cookies = await getSessionCookies(userId);
    if (!cookies) { return { success: false, error: "LinkedIn not connected via extension" }; }
    const profileUrn = await getProfileUrn(userId, profileUrl);
    if (!profileUrn) { return { success: false, error: "Could not find LinkedIn profile" }; }
    let conversationUrn: string | null = null;
    const conversationsResponse = await fetch(`${VOYAGER_API_BASE}/messaging/conversations?keyVersion=LEGACY_INBOX&q=participants&recipients=List(${encodeURIComponent(profileUrn)})`, { method: "GET", headers: buildHeaders(cookies) });
    if (conversationsResponse.ok) { const conversationsData = await conversationsResponse.json(); const elements = conversationsData.elements || conversationsData.data?.elements || []; if (elements.length > 0) { conversationUrn = elements[0].entityUrn || elements[0]["*conversation"]; } }
    const headers = { ...buildHeaders(cookies), "Content-Type": "application/json" };
    let response: Response;
    if (conversationUrn) {
      const payload = { eventCreate: { value: { "com.linkedin.voyager.messaging.create.MessageCreate": { body: message, attachments: [], attributedBody: { text: message, attributes: [] } } } }, dedupeByClientGeneratedToken: false };
      response = await fetch(`${VOYAGER_API_BASE}/messaging/conversations/${encodeURIComponent(conversationUrn)}/events`, { method: "POST", headers, body: JSON.stringify(payload) });
    } else {
      const payload = { keyVersion: "LEGACY_INBOX", conversationCreate: { recipients: [profileUrn], eventCreate: { value: { "com.linkedin.voyager.messaging.create.MessageCreate": { body: message, attachments: [], attributedBody: { text: message, attributes: [] } } } } } };
      response = await fetch(`${VOYAGER_API_BASE}/messaging/conversations`, { method: "POST", headers, body: JSON.stringify(payload) });
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[LinkedIn Cookie API] Direct message failed:", response.status, errorText);
      if (response.status === 429) return { success: false, error: "Rate limited by LinkedIn - please wait and try again" };
      if (response.status === 401 || response.status === 403) return { success: false, error: "Session expired - please reconnect via extension" };
      return { success: false, error: `LinkedIn API error: ${response.status}` };
    }
    const data = await response.json();
    console.log(`[LinkedIn Cookie API] Direct message sent to ${profileUrl}`);
    return { success: true, data };
  } catch (error: any) { console.error("[LinkedIn Cookie API] Error sending direct message:", error); return { success: false, error: error.message }; }
}
