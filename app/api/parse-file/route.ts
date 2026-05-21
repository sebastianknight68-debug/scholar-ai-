import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { CLAUDE_MODEL, getAnthropic, hasAnthropic } from "@/lib/anthropic";
import { extractPptxText } from "@/lib/parse/pptx";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const name = (file as File).name ?? "upload";
    const lower = name.toLowerCase();
    const buf = Buffer.from(await file.arrayBuffer());

    if (lower.endsWith(".pdf")) {
      // Dynamic import — pdf-parse pulls in a test fixture during static analysis otherwise.
      const pdfParse = (await import("pdf-parse")).default;
      const out = await pdfParse(buf);
      return NextResponse.json({
        text: cleanWhitespace(out.text),
        pages: out.numpages,
      });
    }

    if (lower.endsWith(".docx")) {
      const { value } = await mammoth.extractRawText({ buffer: buf });
      return NextResponse.json({ text: cleanWhitespace(value) });
    }

    if (lower.endsWith(".pptx")) {
      const text = await extractPptxText(buf);
      return NextResponse.json({ text: cleanWhitespace(text) });
    }

    if (
      /\.(jpg|jpeg|png|webp)$/.test(lower) ||
      (file.type || "").startsWith("image/")
    ) {
      const text = await transcribeImage(buf, file.type || guessImageMime(lower));
      return NextResponse.json({ text });
    }

    if (lower.endsWith(".txt") || lower.endsWith(".md")) {
      return NextResponse.json({ text: cleanWhitespace(buf.toString("utf8")) });
    }

    return NextResponse.json(
      { error: `Unsupported file type: ${name}` },
      { status: 400 },
    );
  } catch (err) {
    console.error("parse-file error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not parse file" },
      { status: 500 },
    );
  }
}

function cleanWhitespace(s: string) {
  return (s ?? "")
    .replace(/ /g, " ") // nbsp -> regular space
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function guessImageMime(name: string) {
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

async function transcribeImage(buf: Buffer, mediaType: string): Promise<string> {
  if (!hasAnthropic()) {
    return "[Mock OCR] ANTHROPIC_API_KEY is not set, so we can't read handwritten text. Add your key to .env.local to enable image transcription.";
  }
  const client = getAnthropic();
  const b64 = buf.toString("base64");
  const resp = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              // @ts-expect-error SDK union accepts these media types at runtime
              media_type: mediaType,
              data: b64,
            },
          },
          {
            type: "text",
            text: "Transcribe ALL handwritten or printed text in this image as accurately as possible. Preserve paragraph and list structure. If something is unreadable, write [illegible]. Return ONLY the transcribed text — no preamble.",
          },
        ],
      },
    ],
  });
  const block = resp.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}
