"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UpgradeModal } from "@/components/new/UpgradeModal";
import { useToast } from "@/components/ui/toast";
import { Loader2, PenLine, Copy, Download, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const WORD_OPTIONS = [300, 500, 750, 1000, 1500] as const;

export default function EssayPage() {
  const { toast } = useToast();
  const [sample, setSample] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [words, setWords] = React.useState<(typeof WORD_OPTIONS)[number]>(500);
  const [loading, setLoading] = React.useState(false);
  const [output, setOutput] = React.useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = React.useState(false);

  async function generate() {
    if (sample.trim().length < 100 || topic.trim().length < 5) return;
    setLoading(true);
    setOutput(null);
    try {
      const res = await fetch("/api/essay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sample, topic, words }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setShowUpgrade(true);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setOutput(data.essay);
    } catch (err) {
      toast({
        title: "Couldn't generate essay",
        description: err instanceof Error ? err.message : undefined,
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard", variant: "success" });
  }

  function downloadAsText() {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
    a.download = `essay-${slug || "draft"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const sampleWordCount = sample.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="container max-w-5xl py-10">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary-soft">
          <PenLine className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Essay writer</h1>
          <p className="mt-1 text-sm text-muted">
            Paste an essay you've written before — we'll match its style and write a new one on your topic.
          </p>
        </div>
      </div>

      <Card className="mt-6 p-6">
        <Label htmlFor="sample">Your previous essay (style reference)</Label>
        <p className="mt-1 text-xs text-muted">
          The longer and more representative, the better the style match. Paste at least 200–300 words.
        </p>
        <Textarea
          id="sample"
          value={sample}
          onChange={(e) => setSample(e.target.value)}
          placeholder="Paste an essay you've previously written…"
          className="mt-3 min-h-[180px]"
        />
        <p className="mt-2 text-xs text-muted">
          {sampleWordCount} words pasted
        </p>
      </Card>

      <Card className="mt-4 p-6">
        <Label htmlFor="topic">Topic for the new essay</Label>
        <Textarea
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. 'The role of social media in modern political discourse' — or even just a few keywords with context."
          className="mt-3 min-h-[90px]"
        />
      </Card>

      <Card className="mt-4 p-6">
        <Label>Word count</Label>
        <div className="mt-3 flex flex-wrap gap-2">
          {WORD_OPTIONS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWords(w)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm transition-colors",
                w === words
                  ? "border-primary bg-primary/15 text-white"
                  : "border-border bg-bg/40 text-muted hover:border-primary/40 hover:text-white",
              )}
            >
              {w} words
            </button>
          ))}
        </div>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button
          size="lg"
          disabled={loading || sample.trim().length < 100 || topic.trim().length < 5}
          onClick={generate}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? "Writing your essay…" : "Generate essay"}
        </Button>
      </div>

      {output && (
        <Card className="mt-8 p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Your essay</h2>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" /> Copy
              </Button>
              <Button variant="secondary" size="sm" onClick={downloadAsText}>
                <Download className="h-4 w-4" /> Download
              </Button>
            </div>
          </div>
          <div className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-white/90">
            {output}
          </div>
        </Card>
      )}

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
}
