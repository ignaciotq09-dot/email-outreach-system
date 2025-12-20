export function getUserId(req: any): number | null {
  return req.session?.userId || null;
}
