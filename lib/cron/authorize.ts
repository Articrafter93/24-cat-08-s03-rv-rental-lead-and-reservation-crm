import { timingSafeEqual } from "node:crypto";

// Vercel Cron calls the route with "Authorization: Bearer <CRON_SECRET>".
// Fail closed: with no CRON_SECRET configured nothing is authorized (the old check accepted the
// literal "Bearer undefined"), and the comparison runs in constant time.
export function isAuthorizedCronRequest(
  authorization: string | null,
  secret: string | undefined = process.env.CRON_SECRET,
): boolean {
  if (!secret || !authorization) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authorization);
  return received.length === expected.length && timingSafeEqual(received, expected);
}
