import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canCreateStudySet, type Plan } from "@/lib/plans";
import {
  generateFlashcards,
  generateQuiz,
  generateSmartNotes,
  generateSummary,
  generateTitle,
  mockFlashcards,
  mockNotes,
  mockQuiz,
  mockSummary,
} from "@/lib/ai/generate";
import { hasAnthropic } from "@/lib/anthropic";
import type { SourceType } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

type IncomingSource = {
  type: SourceType;
  text: string;
  label?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sources: IncomingSource[] = Array.isArray(body?.sources) ? body.sources : [];
    if (sources.length === 0) {
      return NextResponse.json({ error: "No sources provided" }, { status: 400 });
    }
    const titleHint: string | null = body?.title ?? null;

    // ---------- auth ----------
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ---------- plan check ----------
    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("plan, recordings_used_this_month, recordings_period_start")
      .eq("id", user.id)
      .maybeSingle();
    const plan: Plan = (profile?.plan as Plan) ?? "free";
    const used = profile?.recordings_used_this_month ?? 0;
    if (!canCreateStudySet(plan, used)) {
      return NextResponse.json(
        { error: "Monthly limit reached on your plan. Upgrade for unlimited sets." },
        { status: 402 },
      );
    }

    // ---------- assemble content ----------
    const transcriptParts = sources.filter((s) => s.type === "audio").map((s) => s.text);
    const otherParts = sources
      .filter((s) => s.type !== "audio")
      .map((s) => `[${s.type}${s.label ? ` — ${s.label}` : ""}]\n${s.text}`);

    const transcript = transcriptParts.join("\n\n").trim();
    const combined = [transcript, ...otherParts].filter(Boolean).join("\n\n").trim();
    if (combined.length < 30) {
      return NextResponse.json({ error: "Combined source content is too short." }, { status: 400 });
    }

    // ---------- create the set + sources rows up front ----------
    const sourceTypes = Array.from(new Set(sources.map((s) => s.type)));
    const { data: setRow, error: setErr } = await admin
      .from("study_sets")
      .insert({
        user_id: user.id,
        title: (titleHint && titleHint.slice(0, 120)) || "Generating…",
        sources: sourceTypes,
        status: "processing",
      })
      .select("id")
      .single();
    if (setErr || !setRow) throw new Error(setErr?.message ?? "Could not create study set");
    const studySetId = setRow.id as string;

    if (sources.length > 0) {
      await admin.from("sources").insert(
        sources.map((s) => ({
          study_set_id: studySetId,
          type: s.type,
          raw_text: s.text.slice(0, 200_000),
          filename: s.label ?? null,
        })),
      );
    }

    // ---------- AI generation, in parallel ----------
    let notes: string;
    let flashcards: Awaited<ReturnType<typeof generateFlashcards>>;
    let quiz: Awaited<ReturnType<typeof generateQuiz>>;
    let summary: Awaited<ReturnType<typeof generateSummary>>;
    let title: string;

    if (hasAnthropic()) {
      const [n, f, q, s, t] = await Promise.all([
        generateSmartNotes(combined),
        generateFlashcards(combined),
        generateQuiz(combined),
        generateSummary(combined),
        titleHint ? Promise.resolve(titleHint) : generateTitle(combined),
      ]);
      notes = n;
      flashcards = f;
      quiz = q;
      summary = s;
      title = t;
    } else {
      notes = mockNotes(combined);
      flashcards = mockFlashcards();
      quiz = mockQuiz();
      summary = mockSummary();
      title = titleHint || "Mock study set";
    }

    // ---------- persist ----------
    await admin.from("study_materials").insert({
      study_set_id: studySetId,
      transcript: transcript || null,
      smart_notes: notes,
      flashcards,
      quiz,
      summary,
    });

    await admin
      .from("study_sets")
      .update({ title, status: "ready" })
      .eq("id", studySetId);

    // ---------- usage increment ----------
    await admin.rpc("increment_recording_usage", { p_user: user.id });

    return NextResponse.json({ id: studySetId });
  } catch (err) {
    console.error("generate-study-set error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 },
    );
  }
}
