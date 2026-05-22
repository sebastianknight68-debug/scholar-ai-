import { CLAUDE_MODEL, getAnthropic } from "@/lib/anthropic";
import {
  ESSAY_PROMPT,
  FLASHCARDS_PROMPT,
  PRESENTATION_PROMPT,
  QUIZ_PROMPT,
  SMART_NOTES_PROMPT,
  SUMMARY_PROMPT,
  TITLE_PROMPT,
} from "@/lib/prompts";
import type {
  Flashcard,
  GeneratedPresentation,
  QuizQuestion,
  Summary,
} from "@/lib/types";

const MAX_CONTENT_CHARS = 60_000; // safety cap on source size sent to Claude

function fill(template: string, content: string) {
  return template.replace("{{CONTENT}}", content.slice(0, MAX_CONTENT_CHARS));
}

// Pull a JSON object out of a Claude response. Tolerates ```json fences and surrounding prose.
function extractJson<T = unknown>(text: string): T {
  // strip code fences
  let s = text.trim();
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  // find first '{' and last '}' — Claude will sometimes add prose either side
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  return JSON.parse(s) as T;
}

async function callClaude(prompt: string, max_tokens = 4096): Promise<string> {
  const client = getAnthropic();
  const resp = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens,
    messages: [{ role: "user", content: prompt }],
  });
  const block = resp.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return "";
  return block.text;
}

// ---------- public generators ----------

export async function generateTitle(content: string): Promise<string> {
  try {
    const out = await callClaude(fill(TITLE_PROMPT, content), 80);
    return out.trim().replace(/^["']|["']$/g, "").slice(0, 120) || "Untitled study set";
  } catch {
    return "Untitled study set";
  }
}

export async function generateSmartNotes(content: string): Promise<string> {
  return (await callClaude(fill(SMART_NOTES_PROMPT, content), 4096)).trim();
}

export async function generateFlashcards(content: string): Promise<Flashcard[]> {
  const raw = await callClaude(fill(FLASHCARDS_PROMPT, content), 3500);
  const parsed = extractJson<{ flashcards: Flashcard[] }>(raw);
  return (parsed.flashcards ?? []).filter((c) => c.front && c.back);
}

export async function generateQuiz(content: string): Promise<QuizQuestion[]> {
  const raw = await callClaude(fill(QUIZ_PROMPT, content), 3500);
  const parsed = extractJson<{ quiz: QuizQuestion[] }>(raw);
  return (parsed.quiz ?? []).filter(
    (q) =>
      q.question &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correct === "number" &&
      q.correct >= 0 &&
      q.correct < 4,
  );
}

export async function generateSummary(content: string): Promise<Summary> {
  const raw = await callClaude(fill(SUMMARY_PROMPT, content), 1500);
  const parsed = extractJson<Summary>(raw);
  return {
    tldr: parsed.tldr ?? "",
    takeaways: Array.isArray(parsed.takeaways) ? parsed.takeaways : [],
    exam_topics: Array.isArray(parsed.exam_topics) ? parsed.exam_topics : [],
  };
}

// ---------- ESSAY ----------

export async function generateEssay(opts: {
  sample: string;
  topic: string;
  words: number;
}): Promise<string> {
  const filled = ESSAY_PROMPT.replace("{{SAMPLE}}", opts.sample.slice(0, 8000))
    .replace("{{TOPIC}}", opts.topic.slice(0, 1000))
    .replace("{{WORDS}}", String(opts.words));
  // Reserve ~1.6x words worth of tokens to be safe
  const maxTokens = Math.min(4000, Math.max(800, Math.ceil(opts.words * 2)));
  const out = await callClaude(filled, maxTokens);
  return out.trim();
}

// ---------- PRESENTATION ----------

export async function generatePresentation(opts: {
  content: string;
  slides: number;
  length: "short" | "medium" | "long";
  includeQuiz: boolean;
}): Promise<GeneratedPresentation> {
  const filled = PRESENTATION_PROMPT.replace(
    "{{CONTENT}}",
    opts.content.slice(0, MAX_CONTENT_CHARS),
  )
    .replace("{{SLIDES}}", String(opts.slides))
    .replace("{{LENGTH}}", opts.length)
    .replace("{{QUIZ}}", String(opts.includeQuiz));
  const raw = await callClaude(filled, 4000);
  const parsed = extractJson<GeneratedPresentation>(raw);
  return {
    slides: Array.isArray(parsed.slides) ? parsed.slides : [],
    quiz: Array.isArray(parsed.quiz) ? parsed.quiz : [],
  };
}

// ---------- mock generators used when no ANTHROPIC_API_KEY ----------

export function mockNotes(content: string): string {
  const head = content.slice(0, 200).replace(/\n/g, " ");
  return `## Overview\n\nThis is a mock smart-notes view used because **ANTHROPIC_API_KEY** is not set. The first slice of your content was:\n\n> ${head}\n\n## Key concepts\n\n- The **first key term** is shown like this.\n- Bullet points capture facts.\n- Numbered steps capture processes.\n\n### Subtopic\n\n1. Step one\n2. Step two\n3. Step three\n\n> Why it matters: hook up Anthropic and these notes become real.`;
}

export function mockFlashcards(): Flashcard[] {
  return [
    { front: "What is ScholarAI?", back: "An AI study tool that turns lectures, files, and notes into ready-to-study material." },
    { front: "Which model does it use?", back: "Claude Sonnet 4 for generation, Whisper for transcription." },
    { front: "What does the Free plan include?", back: "3 study sets per month with all core features." },
  ];
}

export function mockQuiz(): QuizQuestion[] {
  return [
    {
      question: "Which API does ScholarAI use for audio transcription?",
      options: ["ElevenLabs", "OpenAI Whisper", "AssemblyAI", "Deepgram"],
      correct: 1,
      explanation: "ScholarAI sends recorded audio to OpenAI's Whisper API to produce the transcript.",
    },
  ];
}

export function mockEssay(topic: string): string {
  return `[Mock essay — set ANTHROPIC_API_KEY in your env to generate real essays.]\n\nThe topic you provided was: "${topic}". With your Anthropic key in place, ScholarAI will produce a complete essay here, matched to the writing style of your sample. The output will include a thesis statement, three to four body paragraphs developing the argument, and a conclusion that ties back to the opening claim. The structure will follow the rhythms of your previous writing — paragraph length, sentence variety, vocabulary, and transitional patterns will all be matched as closely as possible.`;
}

export function mockPresentation(opts: {
  slides: number;
  includeQuiz: boolean;
}): GeneratedPresentation {
  const slides = Array.from({ length: Math.max(3, opts.slides) }).map((_, i) => ({
    title: i === 0 ? "Mock Presentation" : `Slide ${i + 1}`,
    bullets:
      i === 0
        ? ["This is a placeholder deck", "Set ANTHROPIC_API_KEY for real output"]
        : ["First bullet point", "Second bullet point", "Third bullet point"],
    notes: "Speaker notes appear here in the real version.",
  }));
  const quiz: GeneratedPresentation["quiz"] = opts.includeQuiz
    ? [
        {
          question: "What enables real generation?",
          options: [
            "Just the Free plan",
            "Setting ANTHROPIC_API_KEY",
            "More coffee",
            "Restarting your laptop",
          ],
          correct: 1,
          explanation: "The Anthropic API key wires the app up to Claude.",
        },
      ]
    : [];
  return { slides, quiz };
}

export function mockSummary(): Summary {
  return {
    tldr:
      "Mock summary — set ANTHROPIC_API_KEY in .env.local to generate real summaries from your sources.",
    takeaways: [
      "ScholarAI generates notes, flashcards, quizzes, and summaries.",
      "Audio is transcribed with Whisper.",
      "Files are parsed server-side.",
      "Claude assembles the final study set.",
    ],
    exam_topics: ["AI study workflows", "Active recall", "Spaced repetition"],
  };
}
