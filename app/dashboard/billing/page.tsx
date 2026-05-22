import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { PLANS, PLAN_KEYS, type Plan } from "@/lib/plans";
import { CheckoutButton } from "@/components/billing/CheckoutButton";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user!.id)
    .maybeSingle();
  const current: Plan = (profile?.plan as Plan) ?? "free";

  return (
    <div className="container max-w-6xl py-10">
      <h1 className="text-3xl font-bold">Billing</h1>
      <p className="mt-1 text-sm text-muted">
        You're currently on the{" "}
        <span className="font-semibold text-white">{PLANS[current].name}</span> plan.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLAN_KEYS.map((key) => {
          const p = PLANS[key];
          const isCurrent = current === key;
          return (
            <Card key={key} className={isCurrent ? "border-primary/40" : ""}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  {isCurrent && <Badge>Current</Badge>}
                  {p.highlight && !isCurrent && (
                    <Badge className="border-primary/40 bg-primary/10 text-primary-soft">
                      <Sparkles className="h-3 w-3" /> Popular
                    </Badge>
                  )}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">€{p.price}</span>
                  <span className="text-sm text-muted">/mo</span>
                </div>
                <ul className="mt-5 space-y-2 text-sm">
                  {p.perks.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {key === "free" ? (
                    <Button className="w-full" variant="secondary" disabled>
                      Free forever
                    </Button>
                  ) : isCurrent ? (
                    <Button className="w-full" variant="secondary" disabled>
                      Your plan
                    </Button>
                  ) : (
                    <CheckoutButton plan={key} />
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
