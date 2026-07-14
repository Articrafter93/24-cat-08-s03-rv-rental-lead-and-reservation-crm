import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAccount } from "@/lib/auth/current-account";
import { assignPipelineOwner } from "@/lib/data";

const AssignOwnerSchema = z.object({
  ownerId: z.string().min(1),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = AssignOwnerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await assignPipelineOwner(id, parsed.data.ownerId, account.id);
  return NextResponse.json({ success: true, entry });
}
