// A follow-up step is claimed ("sending", with sentAt holding the claim time) before its email goes
// out. A claim older than this is treated as abandoned (the run died between claiming and finishing)
// and can be taken again. The cron route runs for at most 60 s, so ten minutes leaves a wide margin.
// Known limit: the cron runs daily, so an abandoned claim is taken again about a day later, when
// Resend may no longer remember the idempotency key (its window is about 24 h). A step is emailed
// twice only if the email went out and then marking it "sent" failed, both in the same run.
export const FOLLOW_UP_CLAIM_TIMEOUT_MS = 10 * 60 * 1000;
