import Stripe from "stripe";

let _client: Stripe | null = null;
export function getStripe() {
  if (_client) return _client;
  _client = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
    apiVersion: "2024-09-30.acacia",
  });
  return _client;
}

export const hasStripe = () => !!process.env.STRIPE_SECRET_KEY;

export const PLAN_PRICE_IDS = {
  student: process.env.STRIPE_PRICE_ID_STUDENT ?? "",
  pro: process.env.STRIPE_PRICE_ID_PRO ?? "",
};
