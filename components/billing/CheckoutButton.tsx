"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function CheckoutButton({ plan }: { plan: "student" | "pro" }) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  async function go() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      toast({
        title: "Could not start checkout",
        description: err instanceof Error ? err.message : "Try again",
        variant: "danger",
      });
      setLoading(false);
    }
  }

  return (
    <Button className="w-full" onClick={go} disabled={loading}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {plan === "student" ? "Upgrade to Student" : "Upgrade to Pro"}
    </Button>
  );
}
