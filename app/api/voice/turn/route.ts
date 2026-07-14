import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processTurn, buildFinalizeInput } from "@/lib/voice/agent";
import { initVoiceState } from "@/lib/voice/session";
import { ingestLead } from "@/lib/data";
import type { VoiceSessionState, VoiceTurn } from "@/lib/voice/types";

const TurnRequestSchema = z.object({
  sessionId: z.string().min(1).max(100),
  mode: z.enum(["voice", "chat"]),
  utterance: z.string().min(1).max(1000),
  // Client echoes back the state it received from the previous response; we
  // trust it defensively (revive if malformed) since a demo conversation should
  // never dead-end on a client-side serialization hiccup.
  state: z.unknown(),
});

function reviveState(raw: unknown): VoiceSessionState {
  if (!raw || typeof raw !== "object") return initVoiceState();
  try {
    const candidate = raw as VoiceSessionState;
    const turns: VoiceTurn[] = (candidate.turns ?? []).map((t) => ({
      ...t,
      timestamp: new Date(t.timestamp),
    }));
    return { ...initVoiceState(), ...candidate, turns };
  } catch {
    return initVoiceState();
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = TurnRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { sessionId, mode, utterance, state } = parsed.data;
  const currentState = reviveState(state);
  const { state: nextState, agentReply } = processTurn(currentState, utterance);

  let leadId: string | undefined = nextState.leadId;
  if (nextState.done && !leadId) {
    const externalId = `voice-session-${sessionId}`;
    const input = buildFinalizeInput(nextState, mode, externalId);
    const { lead } = await ingestLead(input);
    leadId = lead.id;
    nextState.leadId = lead.id;
  }

  return NextResponse.json({ state: nextState, agentReply, leadId: leadId ?? null });
}
