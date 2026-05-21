"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic, FileText, FileType2, ImageIcon, Presentation, StickyNote, X } from "lucide-react";
import type { SourceType } from "@/lib/types";

const ICONS: Record<SourceType, React.ComponentType<{ className?: string }>> = {
  audio: Mic,
  pdf: FileText,
  docx: FileType2,
  pptx: Presentation,
  image: ImageIcon,
  text: StickyNote,
};

export type Source = {
  id: string;
  type: SourceType;
  label: string;
  text: string;
};

export function SourceList({
  sources,
  onRemove,
}: {
  sources: Source[];
  onRemove: (id: string) => void;
}) {
  if (sources.length === 0) return null;
  const totalChars = sources.reduce((a, s) => a + s.text.length, 0);
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Sources in this set</h3>
        <Badge>{sources.length}</Badge>
      </div>
      <ul className="mt-4 space-y-2">
        {sources.map((s) => {
          const Icon = ICONS[s.type];
          return (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-bg/40 px-3 py-2"
            >
              <Icon className="h-4 w-4 text-primary-soft" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{s.label}</p>
                <p className="text-xs text-muted">
                  {s.text.length.toLocaleString()} characters
                </p>
              </div>
              <button onClick={() => onRemove(s.id)} title="Remove">
                <X className="h-4 w-4 text-muted hover:text-white" />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">
        Combined: {totalChars.toLocaleString()} characters
      </p>
    </Card>
  );
}
