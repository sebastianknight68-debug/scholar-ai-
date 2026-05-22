import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canUploadFile, type Plan } from "@/lib/plans";
import { generateEssay, mockEssay } from "@/lib/ai/generate";
import { hasAnthropic } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sample = String(body?.sample ?? "").trim();
    const topic = String(body?.topic ?? "").trim();
    const words = Math.min(2500, Math.max(150, Number(body?.words) || 500));

    if (sample.length < 100) {
      return NextResponse.json(
        { error: "Paste a longer sample essay (at least 100 characters) so the AI can match your style." },
        { status: 400 },
      );
    }
    if (topic.length < 5) {
      return NextResponse.json(
        { error: "Give a clearer topic for the new essay." },
        { status: 400 },
      );
    }

    // ---- auth ----
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ---- plan check ----
    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("plan, file_uploads_used_this_month")
      .eq("id", user.id)
      .maybeSingle();
    const plan: Plan = (profile?.plan as Plan) ?? "free";
    const used = profile?.file_uploads_used_this_month ?? 0;
    if (!canUploadFile(plan, used)) {
      return NextResponse.json(
        { error: "You've used all of your uploads on this plan. Upgrade for more." },
        { status: 402 },
      );
    }

    // ---- generate ----
    const essay = hasAnthropic()
      ? await generateEssay({ sample, topic, words })
      : mockEssay(topic);

    // ---- usage increment ----
    await admin.rpc("increment_usage", {
      p_user: user.id,
      p_metric: "file_uploads",
      p_amount: 1,
    });

    return NextResponse.json({ essay, words });
  } catch (err) {
    console.error("essay error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Essay generation failed" },
      { status: 500 },
    );
  }
}
