"use client";

import { useState } from "react";
import { FAQ_CATEGORIES, type FaqCategory, type FaqEntry } from "@/lib/faq/types";

type EditableEntry = FaqEntry & { _draft?: { question: string; answer: string; keywords: string } };

export function KnowledgeBaseEditor({ initialEntries }: { initialEntries: FaqEntry[] }) {
  const [entries, setEntries] = useState<EditableEntry[]>(initialEntries);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const grouped = FAQ_CATEGORIES.map((category) => ({
    category,
    items: entries.filter((e) => e.category === category),
  }));

  function startEdit(entry: EditableEntry) {
    setEditingId(entry.id);
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entry.id
          ? { ...e, _draft: { question: e.question, answer: e.answer, keywords: e.keywords.join(", ") } }
          : e
      )
    );
  }

  function cancelEdit(id: string) {
    setEditingId(null);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, _draft: undefined } : e)));
  }

  async function saveEdit(id: string) {
    const entry = entries.find((e) => e.id === id);
    if (!entry?._draft) return;
    setError(null);

    const res = await fetch(`/api/faq/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: entry._draft.question,
        answer: entry._draft.answer,
        keywords: entry._draft.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      }),
    });

    if (!res.ok) {
      setError("Failed to save changes.");
      return;
    }

    const data = await res.json();
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...data.entry, _draft: undefined } : e)));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    setError(null);
    const res = await fetch(`/api/faq/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete entry.");
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleCreate(input: { category: FaqCategory; question: string; answer: string; keywords: string }) {
    setError(null);
    const res = await fetch("/api/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: input.category,
        question: input.question,
        answer: input.answer,
        keywords: input.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      }),
    });

    if (!res.ok) {
      setError("Failed to create entry.");
      return;
    }

    const data = await res.json();
    setEntries((prev) => [...prev, data.entry]);
    setShowAddForm(false);
  }

  return (
    <div className="space-y-8">
      <p className="-mt-4 text-sm" style={{ color: "var(--color-neutral-400)" }}>
        {entries.length} FAQ entries — this is the structured data the voice/chat agent reads from. Edit freely; no
        engineering required.
      </p>

      {error && (
        <div className="rounded-xl p-4" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
          <p className="text-sm font-medium" style={{ color: "#DC2626" }}>{error}</p>
        </div>
      )}

      <button
        onClick={() => setShowAddForm((v) => !v)}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity"
        style={{ backgroundColor: "var(--color-brand-orange)" }}
      >
        {showAddForm ? "Cancel" : "+ Add FAQ Entry"}
      </button>

      {showAddForm && <AddFaqForm onCreate={handleCreate} />}

      {grouped.map(({ category, items }) => (
        <div key={category} className="space-y-3">
          <h2 className="font-serif text-xl" style={{ color: "var(--color-neutral-950)" }}>
            {category}
          </h2>
          {items.length === 0 ? (
            <div
              className="rounded-xl p-6 text-center text-sm"
              style={{ backgroundColor: "var(--color-neutral-50)", color: "var(--color-neutral-400)" }}
            >
              No entries in this category yet.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl p-5"
                  style={{ backgroundColor: "white", border: "1px solid var(--color-neutral-100)" }}
                >
                  {editingId === entry.id && entry._draft ? (
                    <div className="space-y-3">
                      <input
                        className="w-full rounded-lg px-3 py-2 text-sm font-medium"
                        style={{ border: "1px solid var(--color-neutral-200)" }}
                        value={entry._draft.question}
                        onChange={(e) =>
                          setEntries((prev) =>
                            prev.map((x) =>
                              x.id === entry.id && x._draft
                                ? { ...x, _draft: { ...x._draft, question: e.target.value } }
                                : x
                            )
                          )
                        }
                      />
                      <textarea
                        rows={3}
                        className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                        style={{ border: "1px solid var(--color-neutral-200)" }}
                        value={entry._draft.answer}
                        onChange={(e) =>
                          setEntries((prev) =>
                            prev.map((x) =>
                              x.id === entry.id && x._draft
                                ? { ...x, _draft: { ...x._draft, answer: e.target.value } }
                                : x
                            )
                          )
                        }
                      />
                      <input
                        className="w-full rounded-lg px-3 py-2 text-xs"
                        style={{ border: "1px solid var(--color-neutral-200)" }}
                        placeholder="keywords, comma, separated"
                        value={entry._draft.keywords}
                        onChange={(e) =>
                          setEntries((prev) =>
                            prev.map((x) =>
                              x.id === entry.id && x._draft
                                ? { ...x, _draft: { ...x._draft, keywords: e.target.value } }
                                : x
                            )
                          )
                        }
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(entry.id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                          style={{ backgroundColor: "var(--color-brand-orange)" }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => cancelEdit(entry.id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium"
                          style={{ backgroundColor: "var(--color-neutral-100)", color: "var(--color-neutral-700)" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-medium" style={{ color: "var(--color-neutral-950)" }}>
                          {entry.question}
                        </p>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => startEdit(entry)}
                            className="text-xs font-medium"
                            style={{ color: "var(--color-brand-sage)" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-xs font-medium"
                            style={{ color: "#DC2626" }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-sm" style={{ color: "var(--color-neutral-700)" }}>
                        {entry.answer}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {entry.keywords.map((k) => (
                          <span
                            key={k}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "var(--color-neutral-100)", color: "var(--color-neutral-700)" }}
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AddFaqForm({
  onCreate,
}: {
  onCreate: (input: { category: FaqCategory; question: string; answer: string; keywords: string }) => void;
}) {
  const [category, setCategory] = useState<FaqCategory>(FAQ_CATEGORIES[0]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate({ category, question, answer, keywords });
    setQuestion("");
    setAnswer("");
    setKeywords("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-5 space-y-3"
      style={{ backgroundColor: "var(--color-neutral-50)", border: "1px solid var(--color-neutral-100)" }}
    >
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as FaqCategory)}
        className="w-full rounded-lg px-3 py-2 text-sm"
        style={{ border: "1px solid var(--color-neutral-200)" }}
      >
        {FAQ_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        required
        placeholder="Question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm"
        style={{ border: "1px solid var(--color-neutral-200)" }}
      />
      <textarea
        required
        rows={3}
        placeholder="Answer"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm resize-none"
        style={{ border: "1px solid var(--color-neutral-200)" }}
      />
      <input
        placeholder="keywords, comma, separated"
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-xs"
        style={{ border: "1px solid var(--color-neutral-200)" }}
      />
      <button
        type="submit"
        className="rounded-lg px-4 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: "var(--color-brand-orange)" }}
      >
        Create Entry
      </button>
    </form>
  );
}
