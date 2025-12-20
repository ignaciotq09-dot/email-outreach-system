// From Replit Auth blueprint
export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

// Smart routing for CTAs - checks auth status and onboarding completion
export async function handleSmartCTA() {
  try {
    // Check if user is authenticated
    const userResponse = await fetch('/api/auth/me', { credentials: 'include' });
    
    if (!userResponse.ok) {
      // Not authenticated - redirect to custom auth page
      window.location.href = '/auth';
      return;
    }

    // User is authenticated - check onboarding status
    const [gmailResponse, openaiResponse] = await Promise.all([
      fetch('/api/gmail/status'),
      fetch('/api/openai/status')
    ]);

    const gmailStatus = await gmailResponse.json();
    const openaiStatus = await openaiResponse.json();

    const gmailConnected = gmailStatus.connected ?? false;
    const openaiConnected = openaiStatus.connected ?? false;

    // If not fully onboarded, go to onboarding
    if (!gmailConnected || !openaiConnected) {
      window.location.href = '/onboarding';
    } else {
      // Fully onboarded - go to app
      window.location.href = '/app';
    }
  } catch (error) {
    console.error('Error in smart CTA routing:', error);
    // Fallback - redirect to auth page
    window.location.href = '/auth';
  }
}
