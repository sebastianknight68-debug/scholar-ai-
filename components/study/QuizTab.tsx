"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, X, Trophy, RotateCw } from "lucide-react";
import type { QuizQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

type Answer = { idx: number; correct: boolean } | null;

export function QuizTab({ quiz }: { quiz: QuizQuestion[] | null }) {
  const all = quiz ?? [];
  const [pool, setPool] = React.useState<number[]>(() => all.map((_, i) => i));
  const [i, setI] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, Answer>>({});
  const [revealed, setRevealed] = React.useState(false);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    setPool(all.map((_, k) => k));
    setI(0);
    setAnswers({});
    setRevealed(false);
    setDone(false);
  }, [all.length]);

  if (all.length === 0) {
    return <Card className="p-8 text-center text-sm text-muted">No quiz questions yet.</Card>;
  }

  const realIdx = pool[i];
  const q = all[realIdx];

  function answer(optIdx: number) {
    if (revealed) return;
    const correct = optIdx === q.correct;
    setAnswers((a) => ({ ...a, [realIdx]: { idx: optIdx, correct } }));
    setRevealed(true);
  }

  function next() {
    if (i + 1 >= pool.length) {
      setDone(true);
      return;
    }
    setI(i + 1);
    setRevealed(false);
  }

  function retryMissed() {
    const missed = pool.filter((idx) => answers[idx] && !answers[idx]!.correct);
    if (missed.length === 0) return;
    setPool(missed);
    setI(0);
    setRevealed(false);
    setDone(false);
    const cleared: Record<number, Answer> = {};
    missed.forEach((m) => (cleared[m] = null));
    setAnswers(cleared);
  }

  function restart() {
    setPool(all.map((_, k) => k));
    setI(0);
    setAnswers({});
    setRevealed(false);
    setDone(false);
  }

  if (done) {
    const correctCount = pool.filter((idx) => answers[idx]?.correct).length;
    const total = pool.length;
    const pct = Math.round((correctCount / total) * 100);
    const missedCount = total - correctCount;
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary-soft">
          <Trophy className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-2xl font-bold">
          {correctCount} / {total} correct
        </h2>
        <p className="mt-1 text-sm text-muted">{pct}% on this quiz</p>
        <div className="mt-6 flex justify-center gap-2">
          {missedCount > 0 && (
            <Button onClick={retryMissed}>
              <RotateCw className="h-4 w-4" /> Retry missed ({missedCount})
            </Button>
          )}
          <Button variant="secondary" onClick={restart}>
            Restart quiz
          </Button>
        </div>
      </Card>
    );
  }

  const pct = (i / pool.length) * 100;
  const userAnswer = answers[realIdx];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Question {i + 1} of {pool.length}
          </span>
          <span>
            {Object.values(answers).filter((a) => a?.correct).length} correct so far
          </span>
        </div>
        <div className="mt-2">
          <Progress value={pct} />
        </div>
      </div>

      <Card className="p-6 md:p-8">
        <h3 className="text-lg font-semibold">{q.question}</h3>
        <div className="mt-5 grid gap-2">
          {q.options.map((opt, idx) => {
            const isCorrect = idx === q.correct;
            const isChosen = userAnswer?.idx === idx;
            return (
              <button
                key={idx}
                onClick={() => answer(idx)}
                disabled={revealed}
                className={cn(
                  "flex items-center justify-between rounded-xl border border-border bg-bg/40 px-4 py-3 text-left text-sm transition-all hover:bg-cardElevated",
                  revealed && isCorrect && "border-success/60 bg-success/10",
                  revealed && isChosen && !isCorrect && "border-danger/60 bg-danger/10",
                  !revealed && "hover:border-primary/40",
                )}
              >
                <span>{opt}</span>
                {revealed && isCorrect && <Check className="h-4 w-4 text-success" />}
                {revealed && isChosen && !isCorrect && <X className="h-4 w-4 text-danger" />}
              </button>
            );
          })}
        </div>
        {revealed && (
          <div className="mt-5 rounded-xl border border-border bg-bg/40 p-4 text-sm">
            <p className="font-semibold text-white">Why:</p>
            <p className="mt-1 text-white/85">{q.explanation}</p>
          </div>
        )}
        {revealed && (
          <div className="mt-5 flex justify-end">
            <Button onClick={next}>
              {i + 1 === pool.length ? "See results" : "Next question"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
