export function embedTrackingPixel(emailHtml: string, sentEmailId: number, baseUrl: string): string {
  const pixelUrl = `${baseUrl}/api/track/open/${sentEmailId}`;
  const pixelImg = `<img src="${pixelUrl}" width="1" height="1" style="display:none;border:0;height:1px;width:1px;" alt="" />`;
  if (emailHtml.includes("</body>")) return emailHtml.replace("</body>", `${pixelImg}</body>`);
  else if (emailHtml.includes("</html>")) return emailHtml.replace("</html>", `${pixelImg}</html>`);
  else return emailHtml + pixelImg;
}

export function wrapLinksForTracking(emailHtml: string, sentEmailId: number, baseUrl: string): string {
  return emailHtml.replace(/href="([^"]+)"/g, (match, url) => {
    if (url.includes("/api/track/") || url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:")) return match;
    const trackingUrl = `${baseUrl}/api/track/click/${sentEmailId}?url=${encodeURIComponent(url)}`;
    return `href="${trackingUrl}"`;
  });
}
