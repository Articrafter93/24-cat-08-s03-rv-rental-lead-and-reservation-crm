"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { initVoiceState, greetingMessage } from "@/lib/voice/session";
import { isSpeechRecognitionSupported, isSpeechSynthesisSupported, startListening, speak } from "@/lib/voice/speech";
import type { VoiceSessionState } from "@/lib/voice/types";

interface DisplayMessage {
  role: "agent" | "user";
  text: string;
}

export function VoiceAgentPanel() {
  const [state, setState] = useState<VoiceSessionState>(() => ({
    ...initVoiceState(),
    turns: [{ role: "agent", text: greetingMessage(), timestamp: new Date() }],
  }));
  const [messages, setMessages] = useState<DisplayMessage[]>([{ role: "agent", text: greetingMessage() }]);
  const [inputValue, setInputValue] = useState("");
  const [listening, setListening] = useState(false);
  const [sending, setSending] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const stopListeningRef = useRef<(() => void) | null>(null);

  // Browser-capability detection must be deferred past hydration: on the server
  // `window` is undefined, so evaluating it during render would make the server
  // HTML differ from the client's and trigger a hydration mismatch. useSyncExternalStore
  // returns the server snapshot (false) during SSR + hydration, then the client
  // snapshot (true) — the sanctioned hydration-safe "am I on the client" pattern.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const speechSupported = mounted && isSpeechRecognitionSupported();
  const ttsSupported = mounted && isSpeechSynthesisSupported();

  async function sendTurn(utterance: string, mode: "voice" | "chat") {
    if (!utterance.trim() || state.done || sending) return;
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", text: utterance }]);
    setInputValue("");

    try {
      const res = await fetch("/api/voice/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current, mode, utterance, state }),
      });

      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "agent", text: "Sorry, something went wrong. Please try again." }]);
        return;
      }

      const data = await res.json();
      setState(data.state);
      setMessages((prev) => [...prev, { role: "agent", text: data.agentReply }]);
      if (data.leadId) setLeadId(data.leadId);
      if (mode === "voice" && ttsSupported) speak(data.agentReply);
    } finally {
      setSending(false);
    }
  }

  function handleMicClick() {
    if (listening) {
      stopListeningRef.current?.();
      setListening(false);
      return;
    }
    const stop = startListening(
      (text) => {
        setListening(false);
        sendTurn(text, "voice");
      },
      () => setListening(false)
    );
    if (stop) {
      stopListeningRef.current = stop;
      setListening(true);
    }
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendTurn(inputValue, "chat");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Honest disclosure — required by contract §3 */}
      <div
        className="rounded-xl p-4 text-sm"
        style={{ backgroundColor: "rgba(196, 168, 130, 0.15)", border: "1px solid rgba(196, 168, 130, 0.4)" }}
      >
        <p className="font-medium" style={{ color: "var(--color-brand-earth)" }}>
          Browser demo
        </p>
        <p style={{ color: "var(--color-neutral-700)" }}>
          This is a browser voice/chat demo (Web Speech API). In production, this agent connects to
          Twilio/Vapi/Retell AI for real phone (PSTN) call handling — the conversation logic and CRM
          integration below are identical either way.
        </p>
      </div>

      {/* Transcript */}
      <div
        className="rounded-xl p-5 space-y-3 max-h-[420px] overflow-y-auto"
        style={{ backgroundColor: "white", border: "1px solid var(--color-neutral-100)" }}
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[80%] rounded-xl px-4 py-2 text-sm"
              style={{
                backgroundColor: m.role === "user" ? "var(--color-brand-orange)" : "var(--color-neutral-50)",
                color: m.role === "user" ? "white" : "var(--color-neutral-950)",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {leadId && (
        <div className="rounded-xl p-4" style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC" }}>
          <p className="text-sm font-medium" style={{ color: "#15803D" }}>
            ✅ Lead created — this conversation is now in the CRM.
          </p>
          <Link href={`/leads/${leadId}`} className="text-xs" style={{ color: "#16A34A" }}>
            View in CRM (staff login required) →
          </Link>
        </div>
      )}

      {/* Input row */}
      <form onSubmit={handleTextSubmit} className="flex gap-2">
        {speechSupported && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={state.done}
            className="rounded-full w-11 h-11 flex-shrink-0 flex items-center justify-center text-lg transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: listening ? "#DC2626" : "var(--color-brand-orange)",
              color: "white",
            }}
            aria-label={listening ? "Stop listening" : "Start speaking"}
          >
            {listening ? "⏹" : "🎙"}
          </button>
        )}
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={state.done || sending}
          placeholder={speechSupported ? "Or type instead…" : "Type your message…"}
          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none disabled:opacity-60"
          style={{ border: "1px solid var(--color-neutral-200)" }}
        />
        <button
          type="submit"
          disabled={state.done || sending || !inputValue.trim()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--color-brand-orange)" }}
        >
          Send
        </button>
      </form>

      {mounted && !speechSupported && (
        <p className="text-xs text-center" style={{ color: "var(--color-neutral-400)" }}>
          Voice input isn&apos;t supported in this browser — chat works the same conversation engine.
        </p>
      )}
    </div>
  );
}
