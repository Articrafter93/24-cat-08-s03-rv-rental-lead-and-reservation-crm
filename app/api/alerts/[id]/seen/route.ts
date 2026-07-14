import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/auth/current-account";
import { markAlertSeen } from "@/lib/data";

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await markAlertSeen(id);

  return NextResponse.json({ success: true });
}
