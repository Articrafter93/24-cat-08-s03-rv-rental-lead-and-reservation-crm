const MAX_MESSAGE_LENGTH = 500;

const BLOCKED_PATTERNS = [
  /ignore\s+(previous|all|above|prior)\s+instructions?/gi,
  /you\s+are\s+now\s+(a|an)/gi,
  /system\s*:\s*/gi,
  /\[INST\]/gi,
  /<\|.*?\|>/gi,
  /###\s*instruction/gi,
];

export function sanitizeLeadInput(input: string): string {
  let sanitized = input.trim().slice(0, MAX_MESSAGE_LENGTH);

  for (const pattern of BLOCKED_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[redacted]");
  }

  // Strip HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  return sanitized;
}

export function buildClassificationPayload(data: {
  message: string;
  source: string;
  name?: string;
}): string {
  const sanitizedMessage = sanitizeLeadInput(data.message);

  return `Classify this lead inquiry for an RV rental company.

Source channel: ${data.source}
Message: "${sanitizedMessage}"

Respond with JSON only:
{
  "leadType": "hot" | "warm" | "incomplete" | "nurture" | "support",
  "urgency": "high" | "medium" | "low",
  "intent": "booking" | "support" | "browsing" | "referral",
  "bookingReadiness": "ready-now" | "considering" | "exploring" | "not-ready"
}`;
}
