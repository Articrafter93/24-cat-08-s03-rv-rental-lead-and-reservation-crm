// Thin client-only wrapper around the browser Web Speech API. Feature-detected —
// callers must always provide a text-input fallback since SpeechRecognition/
// SpeechSynthesis support (and microphone permission) is not universal.

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognitionConstructor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SpeechRecognitionLike) | null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionConstructor() !== null;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function startListening(onResult: (text: string) => void, onEnd: () => void): (() => void) | null {
  const Ctor = getRecognitionConstructor();
  if (!Ctor) return null;

  const recognizer = new Ctor();
  recognizer.lang = "en-US";
  recognizer.continuous = false;
  recognizer.interimResults = false;

  recognizer.onresult = (event: unknown) => {
    const e = event as { results: { transcript: string }[][] };
    const transcript = e.results?.[0]?.[0]?.transcript;
    if (transcript) onResult(transcript);
  };
  recognizer.onerror = () => onEnd();
  recognizer.onend = () => onEnd();

  recognizer.start();
  return () => recognizer.stop();
}

export function speak(text: string): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
}
