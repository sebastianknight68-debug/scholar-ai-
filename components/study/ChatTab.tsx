"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Markdown } from "@/lib/markdown";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

const PROMPTS = [
  "Explain this in simpler terms",
  "What are the main differences between the key concepts?",
  "Quiz me on the trickiest material",
  "What's most likely to be on the exam?",
];

export function ChatTab({
  studySetId,
  initialMessages,
}: {
  studySetId: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed, ts: Date.now() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setStreaming(true);

    // optimistic empty assistant message
    const assistantStart: ChatMessage = { role: "assistant", content: "", ts: Date.now() };
    setMessages((m) => [...m, assistantStart]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studySetId, messages: newHistory }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Chat failed");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = { ...next[next.length - 1], content: acc };
          return next;
        });
      }
    } catch (err) {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = {
          role: "assistant",
          content: `_Sorry — ${err instanceof Error ? err.message : "something went wrong"}._`,
          ts: Date.now(),
        };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <Card className="flex h-[70vh] flex-col p-0">
      <div ref={scrollerRef} className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.length === 0 && (
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary-soft">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-lg font-semibold">Ask anything about your lecture</h3>
            <p className="mt-1 text-sm text-muted">
              I have your transcript and notes loaded as context.
            </p>
            <div className="mt-5 grid gap-2 text-left">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-lg border border-border bg-bg/40 px-3 py-2 text-sm text-white/90 hover:border-primary/40 hover:bg-cardElevated"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex w-full",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-fg"
                  : "border border-border bg-bg/40 text-white/90",
              )}
            >
              {m.role === "assistant" ? (
                m.content ? (
                  <Markdown source={m.content} />
                ) : (
                  <div className="flex items-center gap-2 text-muted">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                  </div>
                )
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
      </div>
      <form
        className="flex items-end gap-2 border-t border-border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Input
          placeholder="Ask a question about your lecture…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={streaming}
        />
        <Button type="submit" disabled={streaming || !input.trim()}>
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send
        </Button>
      </form>
    </Card>
  );
}
