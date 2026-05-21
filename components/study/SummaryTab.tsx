"use client";

import { Card } from "@/components/ui/card";
import type { Summary } from "@/lib/types";
import { Lightbulb, Target, BookOpen } from "lucide-react";

export function SummaryTab({ summary }: { summary: Summary | null }) {
  if (!summary) {
    return <Card className="p-8 text-center text-sm text-muted">No summary yet.</Card>;
  }
  return (
    <div className="space-y-4">
      <Card className="p-6 md:p-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary-soft">
          <Lightbulb className="h-4 w-4" /> TL;DR
        </div>
        <p className="mt-3 text-base leading-7 text-white/90">{summary.tldr}</p>
      </Card>

      <Card className="p-6 md:p-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary-soft">
          <BookOpen className="h-4 w-4" /> Key takeaways
        </div>
        <ul className="mt-4 space-y-2.5 text-sm text-white/90">
          {summary.takeaways.map((t, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-soft" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-6 md:p-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary-soft">
          <Target className="h-4 w-4" /> Likely exam topics
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {summary.exam_topics.map((t, i) => (
            <span
              key={i}
              className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary-soft"
            >
              {t}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
