import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAccount } from "@/lib/auth/current-account";
import { updateFAQ, deleteFAQ } from "@/lib/faq/crud";
import { FAQ_CATEGORIES } from "@/lib/faq/types";

const UpdateFaqSchema = z.object({
  category: z.enum(FAQ_CATEGORIES).optional(),
  question: z.string().min(1).max(300).optional(),
  answer: z.string().min(1).max(2000).optional(),
  keywords: z.array(z.string().min(1)).max(20).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateFaqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry = updateFAQ(id, parsed.data);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, entry });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deleted = deleteFAQ(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
