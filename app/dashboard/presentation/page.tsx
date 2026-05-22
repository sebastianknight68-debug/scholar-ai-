"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UpgradeModal } from "@/components/new/UpgradeModal";
import { useToast } from "@/components/ui/toast";
import {
  Loader2,
  Presentation as PresentationIcon,
  Copy,
  Download,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeneratedPresentation } from "@/lib/types";

const SLIDE_OPTIONS = [5, 10, 15, 20] as const;
const LENGTH_OPTIONS: { value: "short" | "medium" | "long"; label: string; desc: string }[] = [
  { value: "short", label: "Short", desc: "1–3 short bullets" },
  { value: "medium", label: "Medium", desc: "3–5 bullets" },
  { value: "long", label: "Long", desc: "5–7 detailed bullets" },
];

export default function PresentationPage() {
  const { toast } = useToast();
  const [content, setContent] = React.useState("");
  const [slides, setSlides] = React.useState<(typeof SLIDE_OPTIONS)[number]>(10);
  const [length, setLength] = React.useState<"short" | "medium" | "long">("medium");
  const [includeQuiz, setIncludeQuiz] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [deck, setDeck] = React.useState<GeneratedPresentation | null>(null);
  const [showUpgrade, setShowUpgrade] = React.useState(false);
  const [activeSlide, setActiveSlide] = React.useState(0);

  async function generate() {
    if (content.trim().length < 10) return;
    setLoading(true);
    setDeck(null);
    try {
      const res = await fetch("/api/presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, slides, length, includeQuiz }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setShowUpgrade(true);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setDeck(data);
      setActiveSlide(0);
    } catch (err) {
      toast({
        title: "Couldn't generate presentation",
        description: err instanceof Error ? err.message : undefined,
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  }

  function exportAsText() {
    if (!deck) return;
    const lines: string[] = [];
    deck.slides.forEach((s, i) => {
      lines.push(`Slide ${i + 1}: ${s.title}`);
      lines.push("");
      s.bullets.forEach((b) => lines.push(`  • ${b}`));
      if (s.notes) {
        lines.push("");
        lines.push(`  Speaker notes: ${s.notes}`);
      }
      lines.push("");
      lines.push("---");
      lines.push("");
    });
    if (deck.quiz?.length) {
      lines.push("POP QUIZ");
      lines.push("");
      deck.quiz.forEach((q, i) => {
        lines.push(`${i + 1}. ${q.question}`);
        q.options.forEach((o, j) =>
          lines.push(`   ${String.fromCharCode(65 + j)}) ${o}${j === q.correct ? "  ✓" : ""}`),
        );
        lines.push(`   Why: ${q.explanation}`);
        lines.push("");
      });
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `presentation.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container max-w-6xl py-10">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary-soft">
          <PresentationIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Presentation generator</h1>
          <p className="mt-1 text-sm text-muted">
            Turn a topic or some source text into a slide deck — with an optional pop quiz for your students.
          </p>
        </div>
      </div>

      <Card className="mt-6 p-6">
        <Label htmlFor="content">Topic or source text</Label>
        <p className="mt-1 text-xs text-muted">
          A topic sentence works fine, but pasting in more source material gives a richer deck.
        </p>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="e.g. 'The causes and consequences of the French Revolution' — or paste an article, lecture notes, etc."
          className="mt-3 min-h-[140px]"
        />
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <Label>Number of slides</Label>
          <div className="mt-3 flex flex-wrap gap-2">
            {SLIDE_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlides(s)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  s === slides
                    ? "border-primary bg-primary/15 text-white"
                    : "border-border bg-bg/40 text-muted hover:border-primary/40 hover:text-white",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <Label>Text length per slide</Label>
          <div className="mt-3 flex flex-col gap-2">
            {LENGTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLength(opt.value)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  opt.value === length
                    ? "border-primary bg-primary/15 text-white"
                    : "border-border bg-bg/40 text-muted hover:border-primary/40 hover:text-white",
                )}
              >
                <span className="font-medium">{opt.label}</span>
                <span className="ml-2 text-xs opacity-80">{opt.desc}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <Label>Pop quiz</Label>
          <p className="mt-1 text-xs text-muted">
            Adds 3–5 MCQs at the end of the deck to test students.
          </p>
          <button
            type="button"
            onClick={() => setIncludeQuiz((v) => !v)}
            className={cn(
              "mt-3 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
              includeQuiz
                ? "border-primary bg-primary/15 text-white"
                : "border-border bg-bg/40 text-muted hover:border-primary/40 hover:text-white",
            )}
          >
            <span>{includeQuiz ? "Pop quiz: ON" : "Pop quiz: OFF"}</span>
            <span
              className={cn(
                "h-5 w-9 rounded-full transition-colors",
                includeQuiz ? "bg-primary" : "bg-cardElevated",
              )}
            >
              <span
                className={cn(
                  "block h-5 w-5 rounded-full bg-white shadow transition-transform",
                  includeQuiz ? "translate-x-4" : "translate-x-0",
                )}
              />
            </span>
          </button>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          size="lg"
          disabled={loading || content.trim().length < 10}
          onClick={generate}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? "Building your deck…" : "Generate presentation"}
        </Button>
      </div>

      {deck && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your presentation</h2>
            <Button variant="secondary" size="sm" onClick={exportAsText}>
              <Download className="h-4 w-4" /> Download as text
            </Button>
          </div>

          {/* Slide viewer */}
          <Card className="p-0 overflow-hidden">
            <div className="grid md:grid-cols-[220px_1fr]">
              {/* Slide list */}
              <div className="border-b border-border bg-bg/40 p-3 md:border-b-0 md:border-r max-h-[480px] md:max-h-[600px] overflow-y-auto">
                {deck.slides.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSlide(i)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors mb-1",
                      activeSlide === i
                        ? "bg-primary/15 text-white"
                        : "text-muted hover:bg-cardElevated hover:text-white",
                    )}
                  >
                    <div className="text-xs opacity-70">Slide {i + 1}</div>
                    <div className="line-clamp-2">{s.title}</div>
                  </button>
                ))}
              </div>

              {/* Slide content */}
              <div className="p-8">
                {deck.slides[activeSlide] && (
                  <>
                    <Badge className="mb-3">
                      Slide {activeSlide + 1} / {deck.slides.length}
                    </Badge>
                    <h3 className="text-2xl font-bold">{deck.slides[activeSlide].title}</h3>
                    <ul className="mt-5 space-y-3 text-[15px] leading-7">
                      {deck.slides[activeSlide].bullets.map((b, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-soft" />
                          <span className="text-white/90">{b}</span>
                        </li>
                      ))}
                    </ul>
                    {deck.slides[activeSlide].notes && (
                      <div className="mt-6 rounded-lg border border-border bg-bg/40 p-4">
                        <div className="mb-1 text-xs font-semibold text-primary-soft">
                          SPEAKER NOTES
                        </div>
                        <p className="text-sm text-muted">{deck.slides[activeSlide].notes}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Quiz */}
          {deck.quiz && deck.quiz.length > 0 && (
            <Card className="p-6 md:p-8">
              <h3 className="text-lg font-semibold">Pop quiz</h3>
              <p className="mt-1 text-sm text-muted">
                Use these to wrap up the lesson or hand out as a worksheet.
              </p>
              <div className="mt-5 space-y-5">
                {deck.quiz.map((q, i) => (
                  <div key={i} className="rounded-xl border border-border bg-bg/40 p-4">
                    <p className="font-medium">
                      {i + 1}. {q.question}
                    </p>
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {q.options.map((opt, j) => (
                        <li
                          key={j}
                          className={cn(
                            "flex items-start gap-2",
                            j === q.correct ? "text-success" : "text-white/80",
                          )}
                        >
                          {j === q.correct ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                          ) : (
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                          )}
                          <span>{opt}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-muted">
                      <span className="font-semibold text-white/90">Why: </span>
                      {q.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
}
