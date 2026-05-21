import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { SourceType, StudySetRow } from "@/lib/types";
import {
  Mic,
  FileText,
  FileType2,
  ImageIcon,
  StickyNote,
  Presentation,
  ArrowRight,
} from "lucide-react";

const ICONS: Record<SourceType, React.ComponentType<{ className?: string }>> = {
  audio: Mic,
  pdf: FileText,
  docx: FileType2,
  pptx: Presentation,
  image: ImageIcon,
  text: StickyNote,
};

export function StudySetCard({ set }: { set: StudySetRow }) {
  const sources = Array.from(new Set(set.sources ?? []));
  return (
    <Link
      href={`/dashboard/set/${set.id}`}
      className="group block focus:outline-none"
    >
      <Card className="h-full p-5 transition-all group-hover:border-primary/40 group-hover:bg-cardElevated">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{set.title}</h3>
            <p className="mt-1 text-xs text-muted">{formatDate(set.created_at)}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {sources.length === 0 && (
            <Badge className="border-dashed">No sources</Badge>
          )}
          {sources.map((s) => {
            const Icon = ICONS[s];
            return (
              <Badge key={s} className="gap-1">
                <Icon className="h-3 w-3" />
                {s}
              </Badge>
            );
          })}
          {set.status !== "ready" && (
            <Badge
              className={
                set.status === "processing"
                  ? "border-warning/40 text-warning"
                  : set.status === "error"
                  ? "border-danger/40 text-danger"
                  : ""
              }
            >
              {set.status}
            </Badge>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-1 text-xs text-muted">
          <Tab>Transcript</Tab>
          <Tab>Notes</Tab>
          <Tab>Flashcards</Tab>
          <Tab>Quiz</Tab>
          <Tab>Summary</Tab>
          <Tab>Chat</Tab>
        </div>
      </Card>
    </Link>
  );
}

function Tab({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-border bg-bg/40 px-2 py-0.5">
      {children}
    </span>
  );
}
