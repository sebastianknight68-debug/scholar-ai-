import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canUploadFile, type Plan } from "@/lib/plans";
import { generatePresentation, mockPresentation } from "@/lib/ai/generate";
import { hasAnthropic } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const content = String(body?.content ?? "").trim();
    const rawSlides = Number(body?.slides);
    const slides = [5, 10, 15, 20].includes(rawSlides) ? rawSlides : 10;
    const length: "short" | "medium" | "long" =
      body?.length === "short" || body?.length === "long" ? body.length : "medium";
    const includeQuiz = Boolean(body?.includeQuiz);

    if (content.length < 10) {
      return NextResponse.json(
        { error: "Give a topic or paste source content for the presentation." },
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
    const deck = hasAnthropic()
      ? await generatePresentation({ content, slides, length, includeQuiz })
      : mockPresentation({ slides, includeQuiz });

    // ---- usage increment ----
    await admin.rpc("increment_usage", {
      p_user: user.id,
      p_metric: "file_uploads",
      p_amount: 1,
    });

    return NextResponse.json(deck);
  } catch (err) {
    console.error("presentation error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Presentation generation failed" },
      { status: 500 },
    );
  }
}
