"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { VoiceRecorder } from "@/components/new/VoiceRecorder";
import { FileUploader } from "@/components/new/FileUploader";
import { NotesInput } from "@/components/new/NotesInput";
import { SourceList, type Source } from "@/components/new/SourceList";
import { UpgradeModal } from "@/components/new/UpgradeModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/toast";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function NewStudySetPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [sources, setSources] = React.useState<Source[]>([]);
  const [title, setTitle] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  const [showUpgrade, setShowUpgrade] = React.useState(false);

  function addSource(s: Omit<Source, "id">) {
    if (!s.text || s.text.trim().length < 5) return;
    setSources((prev) => [...prev, { ...s, id: uid() }]);
  }
  function removeSource(id: string) {
    setSources((prev) => prev.filter((s) => s.id !== id));
  }

  async function generate() {
    if (sources.length === 0) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-study-set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || null,
          sources: sources.map(({ id: _id, ...s }) => s),
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setShowUpgrade(true);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      router.push(`/dashboard/set/${data.id}`);
    } catch (err) {
      toast({
        title: "Couldn't generate study set",
        description: err instanceof Error ? err.message : undefined,
        variant: "danger",
      });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="container max-w-6xl py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">New study set</h1>
        <p className="text-sm text-muted">
          Combine a recording, files, and your own notes — then generate everything in one click.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <VoiceRecorder
          onTranscript={(text, filename) =>
            addSource({ type: "audio", text, label: filename })
          }
        />
        <FileUploader
          onParsed={({ type, text, filename }) =>
            addSource({ type, text, label: filename })
          }
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <NotesInput
          onAdd={(text) =>
            addSource({ type: "text", text, label: "Typed notes" })
          }
        />
        <SourceList sources={sources} onRemove={removeSource} />
      </div>

      <Card className="mt-6 p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title (optional)</label>
            <Input
              placeholder="e.g. Biology 101 — Cellular Respiration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-xs text-muted">
              We'll pick one for you if you leave this blank.
            </p>
          </div>
          <Button
            size="lg"
            disabled={sources.length === 0 || generating}
            onClick={generate}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate study set
          </Button>
        </div>
      </Card>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
}
