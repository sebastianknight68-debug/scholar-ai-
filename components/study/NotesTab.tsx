"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/lib/markdown";
import { Download } from "lucide-react";

export function NotesTab({
  notes,
  title,
}: {
  notes: string | null;
  title: string;
}) {
  function exportPdf() {
    // Open a printable view; users hit "Save as PDF" in the browser dialog.
    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escape(title)} — Notes</title>
<style>
body{font-family:Inter,system-ui,sans-serif;max-width:740px;margin:40px auto;padding:0 24px;color:#0f1024;line-height:1.55}
h1{font-size:22px;margin-bottom:24px;border-bottom:1px solid #ddd;padding-bottom:8px}
h2{font-size:18px;margin-top:24px}
h3{font-size:15px;margin-top:18px}
blockquote{border-left:3px solid #6c63ff;background:#f5f4ff;padding:8px 14px;color:#222}
ul,ol{padding-left:22px}
code{background:#eee;padding:1px 5px;border-radius:4px}
</style></head><body>
<h1>${escape(title)}</h1>
${mdToHtml(notes ?? "")}
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 250);
  }

  if (!notes) {
    return (
      <Card className="p-8 text-center text-sm text-muted">
        Smart notes haven't been generated yet.
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" onClick={exportPdf}>
          <Download className="h-4 w-4" /> Export as PDF
        </Button>
      </div>
      <Card className="p-6 md:p-8">
        <Markdown source={notes} />
      </Card>
    </div>
  );
}

// Quick & dirty md → html for print only.
function mdToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let listOpen: "ul" | "ol" | null = null;
  const closeList = () => {
    if (listOpen) {
      out.push(`</${listOpen}>`);
      listOpen = null;
    }
  };
  const inline = (s: string) =>
    escape(s)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");

  for (const raw of lines) {
    const line = raw;
    if (!line.trim()) {
      closeList();
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      closeList();
      out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
      continue;
    }
    if (line.startsWith("> ")) {
      closeList();
      out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`);
      continue;
    }
    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) {
      if (listOpen !== "ul") {
        closeList();
        out.push("<ul>");
        listOpen = "ul";
      }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      if (listOpen !== "ol") {
        closeList();
        out.push("<ol>");
        listOpen = "ol";
      }
      out.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join("\n");
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  );
}
