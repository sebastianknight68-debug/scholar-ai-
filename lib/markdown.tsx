// Tiny markdown renderer — keeps the bundle small for our limited use case.
// Supports: H1/H2/H3, **bold**, *italic*, `code`, > blockquote, - / 1. lists, paragraphs.

import * as React from "react";

type Block =
  | { kind: "h"; level: 1 | 2 | 3; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "quote"; text: string };

function tokenizeInline(text: string, keyBase: string): React.ReactNode[] {
  // Order matters — escape, code, bold, italic.
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let i = 0;
  let match: RegExpExecArray | null;
  let n = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > i) parts.push(text.slice(i, match.index));
    const tok = match[0];
    if (tok.startsWith("**")) {
      parts.push(
        <strong key={`${keyBase}-b-${n++}`} className="font-semibold text-white">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else if (tok.startsWith("`")) {
      parts.push(
        <code
          key={`${keyBase}-c-${n++}`}
          className="rounded bg-cardElevated px-1.5 py-0.5 text-[0.85em] text-primary-soft"
        >
          {tok.slice(1, -1)}
        </code>,
      );
    } else {
      parts.push(
        <em key={`${keyBase}-i-${n++}`}>
          {tok.slice(1, -1)}
        </em>,
      );
    }
    i = regex.lastIndex;
  }
  if (i < text.length) parts.push(text.slice(i));
  return parts;
}

function parse(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      blocks.push({ kind: "h", level: m[1].length as 1 | 2 | 3, text: m[2] });
      i++;
      continue;
    }
    if (line.startsWith("> ")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        buf.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ kind: "quote", text: buf.join(" ") });
      continue;
    }
    if (line.match(/^[-*]\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }
    if (line.match(/^\d+\.\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !lines[i].match(/^(#{1,3}\s|>\s|[-*]\s|\d+\.\s)/)) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "p", text: buf.join(" ") });
  }
  return blocks;
}

export function Markdown({ source }: { source: string }) {
  const blocks = React.useMemo(() => parse(source ?? ""), [source]);
  return (
    <div className="prose-scholar max-w-none space-y-4 text-[15px] leading-7 text-white/90">
      {blocks.map((b, idx) => {
        const k = `b-${idx}`;
        if (b.kind === "h") {
          if (b.level === 1)
            return <h1 key={k} className="mt-6 text-2xl font-bold text-white">{tokenizeInline(b.text, k)}</h1>;
          if (b.level === 2)
            return <h2 key={k} className="mt-6 text-xl font-semibold text-white">{tokenizeInline(b.text, k)}</h2>;
          return <h3 key={k} className="mt-4 text-base font-semibold text-white/95">{tokenizeInline(b.text, k)}</h3>;
        }
        if (b.kind === "p")
          return <p key={k}>{tokenizeInline(b.text, k)}</p>;
        if (b.kind === "ul")
          return (
            <ul key={k} className="list-disc space-y-1.5 pl-6 marker:text-primary-soft">
              {b.items.map((it, j) => (
                <li key={`${k}-${j}`}>{tokenizeInline(it, `${k}-${j}`)}</li>
              ))}
            </ul>
          );
        if (b.kind === "ol")
          return (
            <ol key={k} className="list-decimal space-y-1.5 pl-6 marker:text-primary-soft">
              {b.items.map((it, j) => (
                <li key={`${k}-${j}`}>{tokenizeInline(it, `${k}-${j}`)}</li>
              ))}
            </ol>
          );
        return (
          <blockquote
            key={k}
            className="border-l-2 border-primary/60 bg-primary/5 px-4 py-2 text-white/90"
          >
            {tokenizeInline(b.text, k)}
          </blockquote>
        );
      })}
    </div>
  );
}
