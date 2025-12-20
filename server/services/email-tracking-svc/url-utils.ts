export function getTrackingBaseUrl(): { url: string; valid: boolean; warning?: string } {
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  const replitSlug = process.env.REPL_SLUG;
  const replitOwner = process.env.REPL_OWNER;
  if (devDomain) return { url: `https://${devDomain}`, valid: true };
  if (replitSlug && replitOwner) return { url: `https://${replitSlug}.${replitOwner}.repl.co`, valid: true };
  return { url: "http://localhost:5000", valid: false, warning: "Tracking URLs using localhost - will not work in production. Set REPLIT_DEV_DOMAIN for proper tracking." };
}

export function validateTrackingConfiguration(): { configured: boolean; baseUrl: string; openTrackingEndpoint: string; clickTrackingEndpoint: string; issues: string[] } {
  const { url, valid, warning } = getTrackingBaseUrl();
  const issues: string[] = [];
  if (!valid) issues.push(warning || 'Tracking not properly configured');
  return { configured: valid, baseUrl: url, openTrackingEndpoint: `${url}/api/track/open/:sentEmailId`, clickTrackingEndpoint: `${url}/api/track/click/:sentEmailId?url=:targetUrl`, issues };
}

export function validateOnStartup(): void {
  const config = validateTrackingConfiguration();
  console.log('[EmailTracking] === TRACKING CONFIGURATION CHECK ===');
  console.log(`[EmailTracking] Base URL: ${config.baseUrl}`);
  console.log(`[EmailTracking] Open tracking: ${config.openTrackingEndpoint}`);
  console.log(`[EmailTracking] Click tracking: ${config.clickTrackingEndpoint}`);
  console.log(`[EmailTracking] Status: ${config.configured ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
  if (config.issues.length > 0) { console.warn('[EmailTracking] === WARNINGS ==='); config.issues.forEach(issue => console.warn(`[EmailTracking] ⚠️  ${issue}`)); }
  else { console.log('[EmailTracking] ✅ All tracking endpoints properly configured'); }
  console.log('[EmailTracking] =====================================');
}
