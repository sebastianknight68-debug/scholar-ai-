import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CLAUDE_MODEL, getAnthropic, hasAnthropic } from "@/lib/anthropic";
import { CHAT_SYSTEM_PROMPT } from "@/lib/prompts";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { studySetId, messages } = (await req.json()) as {
      studySetId?: string;
      messages?: ChatMessage[];
    };
    if (!studySetId || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Missing studySetId or messages" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership + grab context.
    const admin = createSupabaseAdminClient();
    const { data: set } = await admin
      .from("study_sets")
      .select("id, user_id")
      .eq("id", studySetId)
      .maybeSingle();
    if (!set || set.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { data: mat } = await admin
      .from("study_materials")
      .select("transcript, smart_notes")
      .eq("study_set_id", studySetId)
      .maybeSingle();

    const system = CHAT_SYSTEM_PROMPT.replace(
      "{{TRANSCRIPT}}",
      (mat?.transcript ?? "(none)").slice(0, 40000),
    ).replace("{{NOTES}}", (mat?.smart_notes ?? "(none)").slice(0, 30000));

    // ---------- mock path ----------
    if (!hasAnthropic()) {
      const last = messages[messages.length - 1]?.content ?? "";
      const reply = `**Mock reply** — set \`ANTHROPIC_API_KEY\` in \`.env.local\` to chat for real.\n\nYou asked: _"${last.slice(0, 200)}"_`;
      await persistConversation(studySetId, [
        ...messages,
        { role: "assistant", content: reply, ts: Date.now() },
      ]);
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(reply));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // ---------- live streaming from Anthropic ----------
    const claudeMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const anth = getAnthropic();
    const upstream = await anth.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      system,
      messages: claudeMessages,
      stream: true,
    });

    const encoder = new TextEncoder();
    let full = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of upstream as AsyncIterable<unknown>) {
            const ev = event as { type: string; delta?: { type: string; text?: string } };
            if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
              const chunk = ev.delta.text ?? "";
              full += chunk;
              controller.enqueue(encoder.encode(chunk));
            }
          }
          controller.close();
          // best-effort persist
          await persistConversation(studySetId, [
            ...messages,
            { role: "assistant", content: full, ts: Date.now() },
          ]);
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("chat error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat failed" },
      { status: 500 },
    );
  }
}

async function persistConversation(studySetId: string, messages: ChatMessage[]) {
  const admin = createSupabaseAdminClient();
  // Use upsert-like behavior: latest conversation row for a set.
  const { data: existing } = await admin
    .from("conversations")
    .select("id")
    .eq("study_set_id", studySetId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await admin
      .from("conversations")
      .update({ messages, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await admin.from("conversations").insert({ study_set_id: studySetId, messages });
  }
}
