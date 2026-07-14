import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { createClient } from "@/lib/supabase/server";

const MoveStageSchema = z.object({
  stageId: z.string().cuid(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = MoveStageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await prisma.pipelineEntry.update({
    where: { id },
    data: { stageId: parsed.data.stageId },
    include: { stage: true },
  });

  await prisma.auditLog.create({
    data: {
      entityType: "PipelineEntry",
      entityId: id,
      action: "stage_changed",
      actorId: user.id,
    },
  });

  return NextResponse.json({ success: true, entry });
}
