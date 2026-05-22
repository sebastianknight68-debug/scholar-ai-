import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UsageBar } from "@/components/dashboard/UsageBar";
import { StudySetCard } from "@/components/dashboard/StudySetCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Plus, Sparkles } from "lucide-react";
import type { Plan } from "@/lib/plans";
import type { StudySetRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileRes, setsRes] = await Promise.all([
    supabase
      .from("users")
      .select(
        "plan, file_uploads_used_this_month, voice_minutes_used_this_month",
      )
      .eq("id", user!.id)
      .maybeSingle(),
    supabase
      .from("study_sets")
      .select("id, user_id, title, sources, status, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
  ]);

  const plan: Plan = (profileRes.data?.plan as Plan) ?? "free";
  const filesUsed = profileRes.data?.file_uploads_used_this_month ?? 0;
  const voiceUsed = profileRes.data?.voice_minutes_used_this_month ?? 0;
  const sets = (setsRes.data ?? []) as StudySetRow[];

  return (
    <div className="container max-w-6xl py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your study sets</h1>
          <p className="mt-1 text-sm text-muted">
            Upload files or an MP3 voice recording to create a new study set.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/new">
              <Upload className="h-4 w-4" /> New study set
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <UsageBar plan={plan} filesUsed={filesUsed} voiceMinutesUsed={voiceUsed} />
      </div>

      {sets.length === 0 ? (
        <Card className="mt-10 p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary-soft">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">No study sets yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Create your first set — drop in slides, PDFs, MP3 voice recordings,
            or paste notes. We'll turn it into a full study kit in seconds.
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard/new">
              <Plus className="h-4 w-4" /> Create a study set
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((s) => (
            <StudySetCard key={s.id} set={s} />
          ))}
        </div>
      )}
    </div>
  );
}
