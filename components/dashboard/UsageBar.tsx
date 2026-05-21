"use client";

import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PLANS, type Plan } from "@/lib/plans";
import { Sparkles } from "lucide-react";

export function UsageBar({
  plan,
  used,
}: {
  plan: Plan;
  used: number;
}) {
  const limit = PLANS[plan].monthlyRecordingLimit;
  const unlimited = limit === Infinity;
  const pct = unlimited ? 100 : Math.min(100, (used / limit) * 100);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            {PLANS[plan].name} plan
            {!unlimited && (
              <span className="ml-2 text-muted">
                — {used} / {limit} study sets this month
              </span>
            )}
            {unlimited && <span className="ml-2 text-muted">— unlimited</span>}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Resets at the start of each calendar month.
          </p>
        </div>
        {plan === "free" && (
          <Button asChild size="sm">
            <Link href="/dashboard/billing">
              <Sparkles className="h-4 w-4" /> Upgrade
            </Link>
          </Button>
        )}
      </div>
      <div className="mt-4">
        <Progress value={pct} />
      </div>
    </Card>
  );
}
