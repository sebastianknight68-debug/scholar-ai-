"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StickyNote, Plus } from "lucide-react";

export function NotesInput({
  onAdd,
}: {
  onAdd: (text: string) => void;
}) {
  const [text, setText] = React.useState("");
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-primary-soft" />
        <h3 className="text-base font-semibold">Paste your notes</h3>
      </div>
      <p className="mt-1 text-xs text-muted">
        Combine typed notes with your recordings and uploads.
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste lecture notes, textbook excerpts, anything…"
        className="mt-4 min-h-[140px]"
      />
      <Button
        className="mt-3"
        variant="secondary"
        disabled={text.trim().length < 5}
        onClick={() => {
          onAdd(text.trim());
          setText("");
        }}
      >
        <Plus className="h-4 w-4" /> Add to this set
      </Button>
    </Card>
  );
}
