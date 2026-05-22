import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function LockedFeature({
  featureName,
  description,
}: {
  featureName: string;
  description?: string;
}) {
  return (
    <Card className="border-primary/30 bg-primary/5 p-10 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary-soft">
        <Lock className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-2xl font-bold">
        {featureName} is a paid feature
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        {description ??
          "Upgrade your plan to unlock flashcards, quizzes, summaries, the tutor chat, and voice scanning."}
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <Button asChild>
          <Link href="/dashboard/billing">
            <Sparkles className="h-4 w-4" />
            Upgrade your plan
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
      <p className="mt-6 text-xs text-muted">
        Student unlocks everything for €9/month.
      </p>
    </Card>
  );
}
