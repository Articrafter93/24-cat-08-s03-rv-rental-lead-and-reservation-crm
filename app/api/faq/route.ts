import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAccount } from "@/lib/auth/current-account";
import { listFAQ, createFAQ } from "@/lib/faq/crud";
import { FAQ_CATEGORIES } from "@/lib/faq/types";

const CreateFaqSchema = z.object({
  category: z.enum(FAQ_CATEGORIES),
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(2000),
  keywords: z.array(z.string().min(1)).max(20),
});

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ entries: listFAQ() });
}

export async function POST(request: NextRequest) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = CreateFaqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry = createFAQ(parsed.data);
  return NextResponse.json({ success: true, entry });
}
