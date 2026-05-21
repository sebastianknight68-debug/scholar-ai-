import { NextRequest, NextResponse } from "next/server";
import { getOpenAI, hasOpenAI } from "@/lib/openai";

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
        { error: "Audio file too large (max 25MB for a single chunk)" },
        { status: 400 },
      );
    }

    if (!hasOpenAI()) {
      return NextResponse.json({
        text:
          "[Mock transcript] OPENAI_API_KEY is not set, so this is placeholder text. " +
          "Add your key to .env.local to enable real Whisper transcription. " +
          "Topics likely included: cellular respiration, the citric acid cycle, and ATP synthesis.",
      });
    }

    // OpenAI SDK expects a File-like object; wrap if needed.
    const name = (file as File).name ?? "audio.webm";
    const type = file.type || "audio/webm";
    const fileForApi = new File([await file.arrayBuffer()], name, { type });

    const openai = getOpenAI();
    const resp = await openai.audio.transcriptions.create({
      file: fileForApi,
      model: "whisper-1",
      response_format: "text",
    });
    const text = typeof resp === "string" ? resp : (resp as { text: string }).text;
    return NextResponse.json({ text });
  } catch (err) {
    console.error("transcribe error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcription failed" },
      { status: 500 },
    );
  }
}
