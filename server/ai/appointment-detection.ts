import { callOpenAIWithTimeout } from "./openai-client";

// Detect appointment/meeting requests in email content
export interface AppointmentDetection {
  hasAppointment: boolean;
  confidence: number; // 0-100 percentage
  type: 'meeting' | 'call' | 'video_call' | null;
  suggestedDate: Date | null;
  suggestedTime: string | null;
  duration: number | null; // minutes
  location: string | null;
  notes: string | null;
  platform: string | null; // Zoom, Google Meet, Teams, etc.
  detectionReason: string; // Why was this flagged as a meeting?
  redFlags: string[]; // Warning signs detected
}

export async function detectAppointment(
  emailContent: string,
  contactName: string
): Promise<AppointmentDetection> {
  // First pass: Initial detection
  const firstPassPrompt = `You are analyzing an email to detect if it contains a NEW meeting/appointment request for the RECIPIENT.

Email from ${contactName}:
"""
${emailContent}
"""

🚨 CRITICAL RULES - Be extremely strict:

1. **NEW MEETINGS ONLY**: Only flag if they're proposing a NEW, UPCOMING meeting
   - ✅ "Can we meet next Tuesday at 2pm?"
   - ✅ "Are you available for a call this week?"
   - ❌ "Thanks for our meeting yesterday"
   - ❌ "Looking forward to our scheduled call"
   - ❌ "We had a great discussion last week"

2. **FOR THE RECIPIENT**: The meeting must involve YOU (the email recipient)
   - ✅ "Let's schedule a call between us"
   - ❌ "I have a meeting with the team tomorrow"
   - ❌ "Our board meets next Friday"

3. **EXPLICIT REQUEST**: Must contain actual scheduling language
   - ✅ "When are you free?", "Let's book time", "Can we schedule"
   - ❌ "Would be nice to connect sometime"
   - ❌ "Maybe we could meet in the future"
   - ❌ "Feel free to reach out anytime"

4. **EXCLUDE AUTO-REPLIES**: Filter out automated messages
   - ❌ Out-of-office messages
   - ❌ "Thank you for your email" auto-responses
   - ❌ "This is an automated notification"

5. **NO HYPOTHETICALS**: Must be a concrete proposal, not a vague idea
   - ✅ "How about Tuesday at 3pm?"
   - ❌ "We should grab coffee sometime"
   - ❌ "It would be great to chat"

Analyze the email and provide:
- hasAppointment: Is this a NEW meeting request? (be very strict)
- initialConfidence: 0-100 score based on strength of signals
- signals: List of positive indicators found (explicit times, scheduling words, availability questions)
- redFlags: List of warning signs (past tense, hypothetical, auto-reply, third-party)
- isPastEvent: Does this refer to a past meeting?
- isAutoReply: Is this an automated message?
- isHypothetical: Is this vague/future "sometime"?
- meetingType: "meeting", "call", "video_call", or null
- dateTimeInfo: Any specific date/time mentioned
- platform: Any meeting platform mentioned (Zoom, Teams, Google Meet)

Return JSON:
{
  "hasAppointment": boolean,
  "initialConfidence": number (0-100),
  "signals": string[],
  "redFlags": string[],
  "isPastEvent": boolean,
  "isAutoReply": boolean,
  "isHypothetical": boolean,
  "meetingType": "meeting" | "call" | "video_call" | null,
  "dateTimeInfo": string or null,
  "platform": string or null
}`;

  try {
    // First pass
    const firstPassContent = await callOpenAIWithTimeout(
      [
        {
          role: "system",
          content: "You are an expert at detecting meeting requests in emails. You are extremely strict and avoid false positives. Only flag concrete, NEW meeting proposals for the recipient."
        },
        {
          role: "user",
          content: firstPassPrompt
        }
      ],
      {
        responseFormat: { type: "json_object" },
        maxTokens: 1500,
      }
    );

    const firstPass = JSON.parse(firstPassContent);
    
    console.log('[detectAppointment] First pass result:', {
      hasAppointment: firstPass.hasAppointment,
      confidence: firstPass.initialConfidence,
      signals: firstPass.signals,
      redFlags: firstPass.redFlags,
    });

    // Apply strict filters
    const hasRedFlags = firstPass.isPastEvent || firstPass.isAutoReply || firstPass.isHypothetical;
    const confidenceThreshold = 75;
    
    // If no appointment detected OR has red flags OR confidence too low, return negative
    if (!firstPass.hasAppointment || hasRedFlags || firstPass.initialConfidence < confidenceThreshold) {
      console.log('[detectAppointment] Rejected:', {
        hasAppointment: firstPass.hasAppointment,
        hasRedFlags,
        confidence: firstPass.initialConfidence,
        threshold: confidenceThreshold,
      });
      
      return {
        hasAppointment: false,
        confidence: firstPass.initialConfidence || 0,
        type: null,
        suggestedDate: null,
        suggestedTime: null,
        duration: null,
        location: null,
        notes: null,
        platform: null,
        detectionReason: firstPass.signals?.join('; ') || '',
        redFlags: firstPass.redFlags || [],
      };
    }

    // Second pass: Extract detailed meeting information
    const secondPassPrompt = `This email contains a legitimate meeting request. Extract detailed information:

Email from ${contactName}:
"""
${emailContent}
"""

Extract:
1. **Specific Date**: Parse any date mentioned (e.g., "next Tuesday", "March 15", "tomorrow")
   - Convert to YYYY-MM-DD format
   - Handle relative dates (today, tomorrow, next week)
   - If no specific date, return null

2. **Time**: Extract specific time if mentioned
   - Format as HH:MM (24-hour) if specific time given
   - Or "morning", "afternoon", "evening" if vague
   - Return null if no time mentioned

3. **Duration**: How long is the meeting?
   - In minutes (e.g., 30, 60)
   - Return null if not specified

4. **Location**: Where will it take place?
   - Physical location (office address, coffee shop)
   - Or null if not mentioned

5. **Platform**: Video conferencing platform
   - "Zoom", "Google Meet", "Microsoft Teams", etc.
   - Or null if not mentioned

6. **Meeting Notes**: Brief summary of what they want to discuss

7. **Final Confidence**: 0-100 score considering all factors
   - 90-100: Explicit time and date mentioned
   - 75-89: Clear request with some details
   - 60-74: General availability question
   - Below 60: Should not reach here (filtered in first pass)

Current date for reference: ${new Date().toISOString().split('T')[0]}

Return JSON:
{
  "suggestedDate": "YYYY-MM-DD" or null,
  "suggestedTime": "HH:MM" or "morning/afternoon/evening" or null,
  "duration": number (minutes) or null,
  "location": string or null,
  "platform": string or null,
  "meetingNotes": string,
  "finalConfidence": number (0-100)
}`;

    const secondPassContent = await callOpenAIWithTimeout(
      [
        {
          role: "system",
          content: "You are an expert at extracting structured meeting information from emails. Parse dates, times, and locations accurately."
        },
        {
          role: "user",
          content: secondPassPrompt
        }
      ],
      {
        responseFormat: { type: "json_object" },
        maxTokens: 1000,
      }
    );

    const secondPass = JSON.parse(secondPassContent);
    
    console.log('[detectAppointment] Second pass result:', secondPass);

    // Parse the date if provided
    let parsedDate: Date | null = null;
    if (secondPass.suggestedDate) {
      try {
        parsedDate = new Date(secondPass.suggestedDate);
        // Validate it's a valid future date
        if (isNaN(parsedDate.getTime()) || parsedDate < new Date()) {
          console.warn('[detectAppointment] Invalid or past date, setting to null');
          parsedDate = null;
        }
      } catch (e) {
        console.error('[detectAppointment] Failed to parse date:', e);
        parsedDate = null;
      }
    }
    
    return {
      hasAppointment: true,
      confidence: secondPass.finalConfidence || firstPass.initialConfidence,
      type: firstPass.meetingType,
      suggestedDate: parsedDate,
      suggestedTime: secondPass.suggestedTime,
      duration: secondPass.duration,
      location: secondPass.location,
      notes: secondPass.meetingNotes,
      platform: secondPass.platform || firstPass.platform,
      detectionReason: firstPass.signals?.join('; ') || 'Meeting request detected',
      redFlags: firstPass.redFlags || [],
    };
  } catch (error: any) {
    console.error('[detectAppointment] Error:', error.message);
    // Return safe default if detection fails
    return {
      hasAppointment: false,
      confidence: 0,
      type: null,
      suggestedDate: null,
      suggestedTime: null,
      duration: null,
      location: null,
      notes: null,
      platform: null,
      detectionReason: '',
      redFlags: [`Error during detection: ${error.message}`],
    };
  }
}
