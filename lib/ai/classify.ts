import { buildClassificationPayload } from "./sanitize";

export type LeadClassification = {
  leadType: "hot" | "warm" | "incomplete" | "nurture" | "support";
  urgency: "high" | "medium" | "low";
  intent: "booking" | "support" | "browsing" | "referral";
  bookingReadiness: "ready-now" | "considering" | "exploring" | "not-ready";
};

// ---------------------------------------------------------------------------
// Rule-based fallback — used when ANTHROPIC_API_KEY is not set.
// Covers the demo scenario without requiring a paid API key.
// ---------------------------------------------------------------------------
function ruleBasedClassify(message: string): LeadClassification {
  const text = message.toLowerCase();

  // Urgency signals
  const hotKeywords = ["urgent", "asap", "today", "immediately", "now", "emergency", "right away", "this week"];
  const warmKeywords = ["interested", "looking", "consider", "budget", "price", "cost", "quote", "available", "dates"];
  const supportKeywords = ["issue", "problem", "broken", "not working", "help", "complaint", "refund", "cancel"];
  const incompleteKeywords = ["hello", "hi", "hey", "test", "info"];

  const isHot = hotKeywords.some((k) => text.includes(k));
  const isWarm = warmKeywords.some((k) => text.includes(k));
  const isSupport = supportKeywords.some((k) => text.includes(k));
  const isIncomplete = incompleteKeywords.some((k) => text.includes(k)) && text.length < 60;

  // Budget signals → booking intent
  const hasBudget = /\$[\d,]+|\d+\s*(k|usd|dollars|budget)/.test(text);
  const hasBookingIntent = /(book|reserve|rent|reservation|trip|vacation|travel)/.test(text);

  let leadType: LeadClassification["leadType"] = "nurture";
  let urgency: LeadClassification["urgency"] = "low";
  let intent: LeadClassification["intent"] = "browsing";
  let bookingReadiness: LeadClassification["bookingReadiness"] = "exploring";

  if (isSupport) {
    leadType = "support";
    intent = "support";
    urgency = "medium";
    bookingReadiness = "not-ready";
  } else if (isIncomplete) {
    leadType = "incomplete";
    urgency = "low";
    intent = "browsing";
    bookingReadiness = "not-ready";
  } else if (isHot) {
    leadType = "hot";
    urgency = "high";
    intent = hasBookingIntent ? "booking" : "browsing";
    bookingReadiness = "ready-now";
  } else if (isWarm || hasBudget || hasBookingIntent) {
    leadType = "warm";
    urgency = "medium";
    intent = hasBookingIntent ? "booking" : "browsing";
    bookingReadiness = hasBudget ? "considering" : "exploring";
  }

  return { leadType, urgency, intent, bookingReadiness };
}

// ---------------------------------------------------------------------------
// Main export — uses Claude Haiku when API key is present, rule-based otherwise
// ---------------------------------------------------------------------------
export async function classifyLead(data: {
  message: string;
  source: string;
  name?: string;
}): Promise<LeadClassification> {
  // Fallback: no API key configured → rule-based classifier
  if (!process.env.ANTHROPIC_API_KEY) {
    return ruleBasedClassify(data.message);
  }

  // Live path: Claude Haiku classification
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  const prompt = buildClassificationPayload(data);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from classification model");
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse classification response");
  }

  return JSON.parse(jsonMatch[0]) as LeadClassification;
}
