"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// Highlight academic-feeling keywords (capitalized phrases, terms followed by ":", etc.)
function highlight(text: string, query: string) {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  const lines = text.split(/\n+/);
  lines.forEach((line, li) => {
    let inner: React.ReactNode = line;
    if (query) {
      const re = new RegExp(`(${escapeRe(query)})`, "ig");
      const segs = line.split(re);
      inner = segs.map((s, i) =>
        re.test(s) ? (
          <mark key={`m-${li}-${i}`} className="rounded bg-warning/30 px-0.5 text-white">
            {s}
          </mark>
        ) : (
          <React.Fragment key={`s-${li}-${i}`}>{s}</React.Fragment>
        ),
      );
    } else {
      // auto-highlight likely keywords: TitleCase 2+ word phrases.
      const re = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/g;
      const segs: React.ReactNode[] = [];
      let last = 0;
      let m: RegExpExecArray | null;
      let n = 0;
      while ((m = re.exec(line)) !== null) {
        if (m.index > last) segs.push(line.slice(last, m.index));
        segs.push(
          <span key={`kw-${li}-${n++}`} className="text-primary-soft">
            {m[0]}
          </span>,
        );
        last = re.lastIndex;
      }
      if (last < line.length) segs.push(line.slice(last));
      inner = segs;
    }
    parts.push(
      <p key={`p-${li}`} className="mb-3 leading-7 text-white/90">
        {inner}
      </p>,
    );
  });
  return parts;
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function TranscriptTab({ transcript }: { transcript: string | null }) {
  const [query, setQuery] = React.useState("");

  if (!transcript) {
    return (
      <Card className="p-8 text-center text-sm text-muted">
        No transcript for this set. Add an audio recording or audio file to generate one.
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Search transcript…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      <Card className="p-6">{highlight(transcript, query)}</Card>
    </div>
  );
}
