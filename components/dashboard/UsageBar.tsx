"use client";

import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS, type Plan, formatMinutes } from "@/lib/plans";
import { Sparkles, FileText, Mic } from "lucide-react";

export function UsageBar({
  plan,
  filesUsed,
  voiceMinutesUsed,
}: {
  plan: Plan;
  filesUsed: number;
  voiceMinutesUsed: number;
}) {
  const p = PLANS[plan];
  const fileLimit = p.fileUploadLimit;
  const voiceLimit = p.voiceMinutesLimit;

  const filePct =
    fileLimit === Infinity ? 100 : Math.min(100, (filesUsed / fileLimit) * 100);
  const voicePct =
    voiceLimit === Infinity || voiceLimit === 0
      ? voiceLimit === 0
        ? 0
        : 100
      : Math.min(100, (voiceMinutesUsed / voiceLimit) * 100);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="border-primary/40 bg-primary/10 text-primary-soft">
              {p.name} plan
            </Badge>
            {plan === "free" && (
              <span className="text-xs text-muted">
                Limited features — upgrade to unlock
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">
            Resets on the 1st of each month.
          </p>
        </div>
        {plan !== "max" && (
          <Button asChild size="sm">
            <Link href="/dashboard/billing">
              <Sparkles className="h-4 w-4" />
              {plan === "free" ? "Upgrade" : "Upgrade plan"}
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {/* File uploads counter */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-white/90">
              <FileText className="h-3.5 w-3.5 text-primary-soft" />
              File uploads
            </span>
            <span className="font-mono text-xs tabular-nums text-muted">
              {filesUsed} /{" "}
              {fileLimit === Infinity ? "∞" : fileLimit}
            </span>
          </div>
          <Progress value={filePct} />
          <p className="mt-1.5 text-xs text-muted">
            {fileLimit === Infinity
              ? "Unlimited uploads this month"
              : `${Math.max(0, fileLimit - filesUsed)} uploads left this month`}
          </p>
        </div>

        {/* Voice minutes counter */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-white/90">
              <Mic className="h-3.5 w-3.5 text-primary-soft" />
              Voice minutes
            </span>
            <span className="font-mono text-xs tabular-nums text-muted">
              {voiceMinutesUsed} /{" "}
              {voiceLimit === Infinity ? "∞" : voiceLimit}
            </span>
          </div>
          <Progress value={voicePct} />
          <p className="mt-1.5 text-xs text-muted">
            {voiceLimit === 0
              ? "Voice scanning is on paid plans"
              : voiceLimit === Infinity
              ? "Unlimited voice scanning"
              : `${formatMinutes(
                  Math.max(0, voiceLimit - voiceMinutesUsed),
                )} left this month`}
          </p>
        </div>
      </div>
    </Card>
  );
}
