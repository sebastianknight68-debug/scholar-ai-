"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, RotateCw, Check, X } from "lucide-react";
import type { Flashcard } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FlashcardsTab({ cards }: { cards: Flashcard[] | null }) {
  const list = cards ?? [];
  const [order, setOrder] = React.useState<number[]>(() => list.map((_, i) => i));
  const [idx, setIdx] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [known, setKnown] = React.useState<Set<number>>(new Set());
  const [reviewed, setReviewed] = React.useState<Set<number>>(new Set());

  React.useEffect(() => {
    setOrder(list.map((_, i) => i));
  }, [list.length]);

  if (list.length === 0) {
    return <Card className="p-8 text-center text-sm text-muted">No flashcards yet.</Card>;
  }

  const realIdx = order[idx];
  const card = list[realIdx];
  const total = list.length;

  function next() {
    setFlipped(false);
    setIdx((i) => Math.min(total - 1, i + 1));
  }
  function prev() {
    setFlipped(false);
    setIdx((i) => Math.max(0, i - 1));
  }
  function markKnown() {
    setReviewed((s) => new Set(s).add(realIdx));
    setKnown((s) => new Set(s).add(realIdx));
    if (idx < total - 1) next();
  }
  function markAgain() {
    setReviewed((s) => new Set(s).add(realIdx));
    setKnown((s) => {
      const n = new Set(s);
      n.delete(realIdx);
      return n;
    });
    if (idx < total - 1) next();
  }
  function reset() {
    setKnown(new Set());
    setReviewed(new Set());
    setIdx(0);
    setFlipped(false);
  }

  const pct = (reviewed.size / total) * 100;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Card {idx + 1} of {total} · {known.size} known
          </span>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>
        <div className="mt-2">
          <Progress value={pct} />
        </div>
      </div>

      <div className="perspective mx-auto">
        <div
          className={cn(
            "flip-card relative mx-auto h-64 max-w-2xl cursor-pointer select-none",
            flipped && "flipped",
          )}
          onClick={() => setFlipped((v) => !v)}
        >
          <Card className="flip-card-face flex items-center justify-center p-8 text-center">
            <p className="text-xl font-medium text-white">{card.front}</p>
          </Card>
          <Card className="flip-card-face back flex items-center justify-center bg-cardElevated p-8 text-center">
            <p className="text-lg text-white/90">{card.back}</p>
          </Card>
        </div>
        <p className="mt-3 text-center text-xs text-muted">Click the card to flip</p>
      </div>

      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
        <Button variant="secondary" onClick={prev} disabled={idx === 0}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAgain}>
            <X className="h-4 w-4" /> Study again
          </Button>
          <Button onClick={markKnown}>
            <Check className="h-4 w-4" /> I knew it
          </Button>
        </div>
        <Button variant="secondary" onClick={next} disabled={idx === total - 1}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted">All cards</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c, i) => (
            <Card key={i} className={cn("p-4", known.has(i) && "border-success/40")}>
              <p className="text-sm font-medium text-white">{c.front}</p>
              <p className="mt-2 text-xs text-muted">{c.back}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
