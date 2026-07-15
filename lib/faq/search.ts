import { faqStore } from "./store";
import type { FaqEntry } from "./types";

// Common function words carry no topical signal and, matched as raw substrings,
// produce false hits (e.g. "the" inside "there"). Excluded from the word-overlap pass.
const STOPWORDS = new Set([
  "the", "you", "your", "and", "for", "are", "was", "were", "with", "that",
  "this", "what", "when", "how", "can", "does", "do", "is", "it", "of", "to",
  "in", "on", "at", "an", "my", "me", "we", "us", "our", "have", "has", "had",
]);

// A curated keyword hit is a strong topical signal; generic word-overlap with a
// question is a weak tiebreaker. KEYWORD_WEIGHT must dominate so a real keyword
// match can never be outscored by a pile of generic overlaps (e.g. "trip" pulling
// a pet question toward the damage entry).
const KEYWORD_WEIGHT = 10;
const WORD_OVERLAP_WEIGHT = 1;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wordBoundaryMatch(haystack: string, word: string): boolean {
  return new RegExp(`\\b${escapeRegExp(word)}\\b`).test(haystack);
}

// Keyword match tolerant of a simple plural: a singular keyword ("pet") must still
// match a plural query ("pets"). Without this, the strongest signal is silently
// lost — the exact bug where "do you allow pets on the trip" matched the damage
// entry instead of the pet-policy entry.
function keywordMatch(haystack: string, keyword: string): boolean {
  return new RegExp(`\\b${escapeRegExp(keyword)}s?\\b`).test(haystack);
}

// Deterministic keyword-overlap retrieval — no external API dependency, so
// FAQ lookup never fails in a live demo. The voice/chat agent (Fase 3) calls
// this; lib/voice/llm.ts's matchFaqSemantically re-judges open-ended phrasing on
// top of it, but this layer must be right on its own whenever a keyword is present.
export function searchFAQ(query: string, topK = 3): FaqEntry[] {
  const normalizedQuery = query.toLowerCase();
  const queryWords = normalizedQuery
    .split(/\W+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));

  const scored = faqStore.map((entry) => {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (keywordMatch(normalizedQuery, keyword.toLowerCase())) score += KEYWORD_WEIGHT;
    }
    const questionLower = entry.question.toLowerCase();
    const categoryLower = entry.category.toLowerCase();
    for (const word of queryWords) {
      if (wordBoundaryMatch(questionLower, word)) score += WORD_OVERLAP_WEIGHT;
      if (wordBoundaryMatch(categoryLower, word)) score += WORD_OVERLAP_WEIGHT;
    }
    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.entry);
}
