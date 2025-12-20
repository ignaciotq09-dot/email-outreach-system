export function generateTrackingPixelId(): string {
  return `px_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function embedTrackingPixel(emailHtml: string, pixelId: string, baseUrl: string): string {
  const pixelUrl = `${baseUrl}/api/track/open/${pixelId}`;
  const pixelImg = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;
  
  if (emailHtml.includes("</body>")) {
    return emailHtml.replace("</body>", `${pixelImg}</body>`);
  } else {
    return emailHtml + pixelImg;
  }
}

export function wrapLinksForTracking(emailHtml: string, sentEmailId: number, baseUrl: string): string {
  return emailHtml.replace(
    /href="([^"]+)"/g,
    (match, url) => {
      if (url.includes("/api/track/") || url.startsWith("#")) {
        return match;
      }
      const trackingUrl = `${baseUrl}/api/track/click/${sentEmailId}?url=${encodeURIComponent(url)}`;
      return `href="${trackingUrl}"`;
    }
  );
}
