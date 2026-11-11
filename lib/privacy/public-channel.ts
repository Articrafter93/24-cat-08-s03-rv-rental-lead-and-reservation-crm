// The CRM is a public exhibition: anyone can open it with the public demo login, and anyone can
// create leads through the /voice page or the /intake form behind that login. The seeded leads
// (externalId "demo-...") are fictional and shown as they are. Every other lead was typed by a
// visitor, so its email and phone are masked on the server before any dashboard view gets them,
// also inside free text such as the message, the transcript or the classifier output, so one
// visitor's real contact details never reach the next visitor's browser.
const SEEDED_EXTERNAL_ID_PREFIX = "demo-";

// Every quantifier is bounded (the limits of an email address and of a phone number), so masking
// stays linear on long, visitor-controlled text such as a 100-turn transcript.
const EMAIL_IN_TEXT = /[A-Z0-9._%+-]{1,64}@[A-Z0-9.-]{1,253}\.[A-Z]{2,24}/gi;
// An email said out loud or typed to dodge filters: "jane dot doe at gmail dot com", "jane @ gmail.com".
// The separator is the word "dot" or a dot with no spaces, and it must end in a common top-level
// domain, so a sentence such as "we arrive at noon. Then" is left alone. A website named in a
// sentence ("your ad at rvshare.com") is masked too: a harmless false positive.
const SPOKEN_EMAIL_IN_TEXT =
  /\b[A-Z0-9._%+-]{1,64}(?:\s+dot\s+[A-Z0-9_%+-]{1,64}){0,4}\s+(?:at|@)\s+[A-Z0-9-]{1,63}(?:(?:\s+dot\s+|\.)[A-Z0-9-]{1,63}){0,4}(?:\s+dot\s+|\.)(?:com|net|org|io|co|edu|gov|us|uk|es|mx|ca|info|biz|me|dev|app)\b/gi;
// A run of 7 to 26 digits, optionally with spaces, dots, dashes, slashes, parentheses or a leading +.
const PHONE_IN_TEXT = /\+?\d[\d\s()./-]{5,24}\d/g;
// Calendar dates (and a range of two) also have enough digits; they are reservation data, not contacts.
const DATE_LIKE = /^(?:\d{4}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])|(?:0?[1-9]|[12]\d|3[01])[-/.](?:0?[1-9]|[12]\d|3[01])[-/.]\d{4})$/;
const DATE_RANGE_SEPARATOR = /\s+-\s+/;

function isDateOrRange(text: string): boolean {
  return text.split(DATE_RANGE_SEPARATOR).every((part) => DATE_LIKE.test(part));
}
const MASK = "•••";

export interface LeadOrigin {
  externalId: string;
}

export function isVisitorEntered(lead: LeadOrigin | null | undefined): boolean {
  return !lead || !lead.externalId.startsWith(SEEDED_EXTERNAL_ID_PREFIX);
}

// "jane.doe@gmail.com" -> "j•••@g•••.com"
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0) return MASK;
  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf(".");
  const domainMask = dot > 0 ? `${domain[0]}${MASK}${domain.slice(dot)}` : MASK;
  return `${email[0]}${MASK}@${domainMask}`;
}

// "+1 (555) 123-4567" -> "•••67": only the last two digits stay.
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 2 ? `${MASK}${digits.slice(-2)}` : MASK;
}

// Masks every email (written or spoken) and phone-like number inside free text.
export function maskContactDetails(text: string): string {
  return text
    .replace(EMAIL_IN_TEXT, (match) => maskEmail(match))
    .replace(SPOKEN_EMAIL_IN_TEXT, () => `${MASK} (email)`)
    .replace(PHONE_IN_TEXT, (match) =>
      match.replace(/\D/g, "").length >= 7 && !isDateOrRange(match.trim()) ? maskPhone(match) : match,
    );
}

// Masks every string inside a JSON-like value (the lead's raw payload: message, transcript, fields).
export function maskPayload<T>(value: T): T {
  if (typeof value === "string") return maskContactDetails(value) as T;
  if (Array.isArray(value)) return value.map((item) => maskPayload(item)) as T;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, maskPayload(item)])) as T;
  }
  return value;
}

// The contact as a dashboard view may show it: unchanged for a seeded lead, masked otherwise. The
// name goes through the free-text masking too: when the voice agent cannot pick a name out of the
// answer it keeps the whole answer, which can hold an email or a phone ("I'm Jane, jane@x.com").
export function contactForView<T extends { email: string; phone?: string | null; name?: string }>(
  contact: T,
  lead: LeadOrigin | null | undefined,
): T {
  if (!isVisitorEntered(lead)) return contact;
  return {
    ...contact,
    email: maskEmail(contact.email),
    phone: contact.phone ? maskPhone(contact.phone) : contact.phone,
    ...(typeof contact.name === "string" ? { name: maskContactDetails(contact.name) } : {}),
  };
}
