import { Resend } from "resend";

// Lazily construct the Resend client ONLY when an API key is present. The client
// constructor throws "Missing API key" when the key is undefined, which crashes
// module evaluation — and the Next.js production build's page-data collection —
// for every route that imports this file (observed: Vercel build failed on
// /api/alerts/[id]/seen). In this portfolio demo email is optional: without a key
// the send helpers no-op so lead capture / pipeline still work end to end.
const apiKey = process.env.RESEND_API_KEY;
export const resend = apiKey ? new Resend(apiKey) : null;

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@rvcorp-demo.com";

export async function sendConfirmationEmail(to: string, name: string) {
  if (!resend) return null;
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "We received your RV rental inquiry!",
    text: `Hi ${name},\n\nThank you for reaching out to RV Corp. We've received your inquiry and a team member will be in touch shortly.\n\nBest,\nThe RV Corp Team`,
  });
}

export async function sendFollowUpEmail(
  to: string,
  name: string,
  subject: string,
  body: string
) {
  if (!resend) return null;
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    text: body,
  });
}

export async function sendInternalAlert(
  to: string,
  leadName: string,
  leadType: string,
  leadId: string
) {
  if (!resend) return null;
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `[HOT LEAD] ${leadName} requires immediate attention`,
    text: `A hot lead just came in.\n\nName: ${leadName}\nType: ${leadType}\n\nView in CRM: ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/leads/${leadId}`,
  });
}
