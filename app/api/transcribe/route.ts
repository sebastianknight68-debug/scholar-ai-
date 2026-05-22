import { NextRequest, NextResponse } from "next/server";
import { getOpenAI, hasOpenAI } from "@/lib/openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canRecordMinutes, type Plan } from "@/lib/plans";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No audio file uploaded" }, { status: 400 });
    }
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Audio file too large (max 25MB — split it up)" },
        { status: 400 },
      );
    }

    // ---- auth + plan check ----
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("plan, voice_minutes_used_this_month")
      .eq("id", user.id)
      .maybeSingle();
    const plan: Plan = (profile?.plan as Plan) ?? "free";
    const voiceUsed = profile?.voice_minutes_used_this_month ?? 0;

    // Refuse upfront if they've already maxed out their voice minutes
    if (!canRecordMinutes(plan, voiceUsed, 1)) {
      return NextResponse.json(
        {
          error:
            "You've hit your voice scanning limit on this plan. Upgrade to keep going.",
        },
        { status: 402 },
      );
    }

    // ---- mock mode ----
    if (!hasOpenAI()) {
      return NextResponse.json({
        text:
          "[Mock transcript] OPENAI_API_KEY is not set, so this is placeholder text. " +
          "Add your key to .env.local to enable real Whisper transcription.",
        durationMinutes: 1,
      });
    }

    // ---- real Whisper call ----
    const name = (file as File).name ?? "audio.webm";
    const type = file.type || "audio/webm";
    const fileForApi = new File([await file.arrayBuffer()], name, { type });

    const openai = getOpenAI();
    const resp = await openai.audio.transcriptions.create({
      file: fileForApi,
      model: "whisper-1",
      response_format: "verbose_json",
    });

    // verbose_json includes `duration` (seconds) and `text`
    const text = (resp as { text: string }).text ?? "";
    const durationSeconds = (resp as { duration?: number }).duration ?? 0;
    const durationMinutes = Math.max(1, Math.ceil(durationSeconds / 60));

    // Charge them for what they used (rounded up to nearest minute)
    if (durationMinutes > 0) {
      await admin.rpc("increment_usage", {
        p_user: user.id,
        p_metric: "voice_minutes",
        p_amount: durationMinutes,
      });
    }

    return NextResponse.json({ text, durationMinutes });
  } catch (err) {
    console.error("transcribe error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcription failed" },
      { status: 500 },
    );
  }
}
