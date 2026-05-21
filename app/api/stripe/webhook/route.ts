import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { PLAN_PRICE_IDS } from "@/lib/stripe";

export const runtime = "nodejs";
// Stripe needs the raw request body to verify signatures.
export const dynamic = "force-dynamic";

function priceIdToPlan(priceId: string | null | undefined): "student" | "pro" | null {
  if (!priceId) return null;
  if (priceId === PLAN_PRICE_IDS.student) return "student";
  if (priceId === PLAN_PRICE_IDS.pro) return "pro";
  return null;
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 400 },
    );
  }

  const raw = await req.text();
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const supabaseUserId = (session.metadata?.supabase_user_id ?? null) as
          | string
          | null;
        if (supabaseUserId && session.subscription) {
          const subId = String(session.subscription);
          const sub = await stripe.subscriptions.retrieve(subId);
          const priceId = sub.items.data[0]?.price.id ?? null;
          const plan = priceIdToPlan(priceId) ?? "student";
          await admin
            .from("users")
            .update({
              plan,
              stripe_customer_id: String(session.customer ?? ""),
              stripe_subscription_id: subId,
            })
            .eq("id", supabaseUserId);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const supabaseUserId =
          (sub.metadata?.supabase_user_id as string | undefined) ?? null;
        const priceId = sub.items.data[0]?.price.id ?? null;
        const plan = priceIdToPlan(priceId);
        if (supabaseUserId && plan) {
          await admin
            .from("users")
            .update({ plan, stripe_subscription_id: sub.id })
            .eq("id", supabaseUserId);
        } else if (sub.customer) {
          await admin
            .from("users")
            .update({ plan: plan ?? "free", stripe_subscription_id: sub.id })
            .eq("stripe_customer_id", String(sub.customer));
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await admin
          .from("users")
          .update({ plan: "free", stripe_subscription_id: null })
          .eq("stripe_customer_id", String(sub.customer));
        break;
      }
      default:
        // ignore other events
        break;
    }
  } catch (err) {
    console.error("Webhook handler failed", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
