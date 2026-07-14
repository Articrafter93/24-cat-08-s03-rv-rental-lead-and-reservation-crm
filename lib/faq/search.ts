import { faqStore } from "./store";
import type { FaqEntry } from "./types";

// Common function words carry no topical signal and, matched as raw substrings,
// produce false hits (e.g. "the" inside "there"). Excluded from the word-overlap pass.
const STOPWORDS = new Set([
  "the", "you", "your", "and", "for", "are", "was", "were", "with", "that",
  "this", "what", "when", "how", "can", "does", "do", "is", "it", "of", "to",
  "in", "on", "at", "an", "my", "me", "we", "us", "our", "have", "has", "had",
]);

function wordBoundaryMatch(haystack: string, word: string): boolean {
  return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(haystack);
}

// Deterministic keyword-overlap retrieval — no external API dependency, so
// FAQ lookup never fails in a live demo. The voice/chat agent (Fase 3) calls
// this before falling back to an LLM for open-ended phrasing.
export function searchFAQ(query: string, topK = 3): FaqEntry[] {
  const normalizedQuery = query.toLowerCase();
  const queryWords = normalizedQuery
    .split(/\W+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));

  const scored = faqStore.map((entry) => {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (wordBoundaryMatch(normalizedQuery, keyword.toLowerCase())) score += 3;
    }
    const questionLower = entry.question.toLowerCase();
    const categoryLower = entry.category.toLowerCase();
    for (const word of queryWords) {
      if (wordBoundaryMatch(questionLower, word)) score += 1;
      if (wordBoundaryMatch(categoryLower, word)) score += 1;
    }
    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.entry);
}
