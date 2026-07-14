import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAccount } from "@/lib/auth/current-account";
import { updatePipelineStage } from "@/lib/data";

const MoveStageSchema = z.object({
  stageId: z.string().min(1),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = MoveStageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await updatePipelineStage(id, parsed.data.stageId, account.id);
  return NextResponse.json({ success: true, entry });
}
