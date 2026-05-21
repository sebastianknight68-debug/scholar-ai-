import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TranscriptTab } from "@/components/study/TranscriptTab";
import { NotesTab } from "@/components/study/NotesTab";
import { FlashcardsTab } from "@/components/study/FlashcardsTab";
import { QuizTab } from "@/components/study/QuizTab";
import { SummaryTab } from "@/components/study/SummaryTab";
import { ChatTab } from "@/components/study/ChatTab";
import {
  ArrowLeft,
  ScrollText,
  BookOpen,
  Brain,
  ListChecks,
  Lightbulb,
  MessagesSquare,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ChatMessage, Flashcard, QuizQuestion, Summary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StudySetPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: set } = await supabase
    .from("study_sets")
    .select("id, title, created_at, sources, status")
    .eq("id", params.id)
    .maybeSingle();
  if (!set) notFound();

  const [matRes, convRes] = await Promise.all([
    supabase
      .from("study_materials")
      .select("transcript, smart_notes, flashcards, quiz, summary")
      .eq("study_set_id", params.id)
      .maybeSingle(),
    supabase
      .from("conversations")
      .select("messages")
      .eq("study_set_id", params.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const mat = matRes.data;
  const initialMessages: ChatMessage[] = (convRes.data?.messages as ChatMessage[]) ?? [];

  return (
    <div className="container max-w-6xl py-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" /> All study sets
        </Link>
      </Button>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{set.title}</h1>
          <p className="mt-1 text-sm text-muted">
            Created {formatDate(set.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(set.sources ?? []).map((s: string) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </div>
      </div>

      {set.status === "processing" && (
        <Card className="mt-6 border-warning/40 bg-warning/5 p-4 text-sm">
          We're still generating this study set — refresh in a moment.
        </Card>
      )}
      {set.status === "error" && (
        <Card className="mt-6 border-danger/40 bg-danger/5 p-4 text-sm">
          Something went wrong while generating this set. Try creating a new one.
        </Card>
      )}

      <Tabs defaultValue="notes" className="mt-6">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="transcript">
            <ScrollText className="h-4 w-4" /> Transcript
          </TabsTrigger>
          <TabsTrigger value="notes">
            <BookOpen className="h-4 w-4" /> Smart notes
          </TabsTrigger>
          <TabsTrigger value="flashcards">
            <Brain className="h-4 w-4" /> Flashcards
          </TabsTrigger>
          <TabsTrigger value="quiz">
            <ListChecks className="h-4 w-4" /> Quiz
          </TabsTrigger>
          <TabsTrigger value="summary">
            <Lightbulb className="h-4 w-4" /> Summary
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessagesSquare className="h-4 w-4" /> Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transcript">
          <TranscriptTab transcript={mat?.transcript ?? null} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab notes={mat?.smart_notes ?? null} title={set.title} />
        </TabsContent>
        <TabsContent value="flashcards">
          <FlashcardsTab cards={(mat?.flashcards as Flashcard[]) ?? null} />
        </TabsContent>
        <TabsContent value="quiz">
          <QuizTab quiz={(mat?.quiz as QuizQuestion[]) ?? null} />
        </TabsContent>
        <TabsContent value="summary">
          <SummaryTab summary={(mat?.summary as Summary) ?? null} />
        </TabsContent>
        <TabsContent value="chat">
          <ChatTab studySetId={set.id} initialMessages={initialMessages} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
