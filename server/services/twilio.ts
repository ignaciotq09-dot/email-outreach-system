// Twilio SMS Service
// Note: Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER as environment secrets

export async function sendSMS(toPhoneNumber: string, message: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhoneNumber) {
    console.log('[Twilio] SMS credentials not configured - would send:', message);
    console.log('[Twilio] To:', toPhoneNumber);
    console.log('[Twilio] Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER as secrets');
    // Don't throw error - just log that credentials aren't configured
    return;
  }

  try {
    // Create Basic Auth header
    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    // Prepare the request body
    const body = new URLSearchParams({
      To: toPhoneNumber,
      From: fromPhoneNumber,
      Body: message,
    });

    // Send SMS using Twilio REST API
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Twilio API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('[Twilio] SMS sent successfully:', data.sid);

  } catch (error: any) {
    console.error('[Twilio] Error sending SMS:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

export async function getSMSDeliveryStatus(messageSid: string): Promise<string> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return 'unknown';
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${messageSid}.json`,
      {
        headers: {
          'Authorization': authHeader,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get SMS status: ${response.statusText}`);
    }

    const data = await response.json();
    return data.status; // 'delivered', 'sent', 'failed', etc.

  } catch (error: any) {
    console.error('[Twilio] Error getting SMS status:', error);
    return 'unknown';
  }
}
