import { randomUUID } from "crypto";
import { faqStore } from "./store";
import type { FaqCategory, FaqEntry } from "./types";

export function listFAQ(): FaqEntry[] {
  return [...faqStore].sort((a, b) => a.category.localeCompare(b.category));
}

export function createFAQ(input: { category: FaqCategory; question: string; answer: string; keywords: string[] }): FaqEntry {
  const entry: FaqEntry = { id: randomUUID(), updatedAt: new Date(), ...input };
  faqStore.push(entry);
  return entry;
}

export function updateFAQ(
  id: string,
  input: Partial<{ category: FaqCategory; question: string; answer: string; keywords: string[] }>
): FaqEntry | null {
  const entry = faqStore.find((e) => e.id === id);
  if (!entry) return null;
  Object.assign(entry, input, { updatedAt: new Date() });
  return entry;
}

export function deleteFAQ(id: string): boolean {
  const index = faqStore.findIndex((e) => e.id === id);
  if (index === -1) return false;
  faqStore.splice(index, 1);
  return true;
}
