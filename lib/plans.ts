export type Plan = "free" | "starter" | "pro" | "max";

// Feature flags — which tabs a plan unlocks. Smart Notes is always free.
export type FeatureKey = "notes" | "flashcards" | "quiz" | "summary" | "chat" | "voice";

export const PLANS: Record<
  Plan,
  {
    name: string;
    price: number; // monthly, EUR
    currency: "EUR";
    fileUploadLimit: number;       // study sets per month, Infinity for unlimited
    voiceMinutesLimit: number;     // 1 token = 1 minute, Infinity for unlimited
    features: Record<FeatureKey, boolean>;
    perks: string[];
    cta: string;
    highlight?: boolean;
  }
> = {
  free: {
    name: "Free",
    price: 0,
    currency: "EUR",
    fileUploadLimit: 1,
    voiceMinutesLimit: 0,
    features: {
      notes: true,
      flashcards: false,
      quiz: false,
      summary: false,
      chat: false,
      voice: false,
    },
    perks: [
      "1 file upload / month",
      "Smart Notes only",
      "Try the experience",
    ],
    cta: "Start free",
  },
  starter: {
    name: "Starter",
    price: 10,
    currency: "EUR",
    fileUploadLimit: 10,
    voiceMinutesLimit: 60,
    features: {
      notes: true,
      flashcards: true,
      quiz: true,
      summary: true,
      chat: true,
      voice: true,
    },
    perks: [
      "10 file uploads / month",
      "1 hour of voice scanning",
      "All AI features unlocked",
      "Chat with your lectures",
    ],
    cta: "Choose Starter",
  },
  pro: {
    name: "Pro",
    price: 20,
    currency: "EUR",
    fileUploadLimit: 30,
    voiceMinutesLimit: 300,
    features: {
      notes: true,
      flashcards: true,
      quiz: true,
      summary: true,
      chat: true,
      voice: true,
    },
    perks: [
      "30 file uploads / month",
      "5 hours of voice scanning",
      "All AI features unlocked",
      "Priority processing",
    ],
    cta: "Choose Pro",
    highlight: true,
  },
  max: {
    name: "Max",
    price: 50,
    currency: "EUR",
    fileUploadLimit: 100,
    voiceMinutesLimit: 600,
    features: {
      notes: true,
      flashcards: true,
      quiz: true,
      summary: true,
      chat: true,
      voice: true,
    },
    perks: [
      "100 file uploads / month",
      "10 hours of voice scanning",
      "Everything in Pro",
      "Early access to new features",
    ],
    cta: "Choose Max",
  },
};

export const PLAN_KEYS: Plan[] = ["free", "starter", "pro", "max"];
export const PAID_PLAN_KEYS: Exclude<Plan, "free">[] = ["starter", "pro", "max"];

// ---- formatting helpers ----

export function formatPrice(plan: Plan) {
  const p = PLANS[plan];
  return p.price === 0 ? "€0" : `€${p.price}`;
}

export function formatMinutes(minutes: number) {
  if (minutes === Infinity) return "Unlimited";
  if (minutes === 0) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

// ---- limit checks ----

export function canUploadFile(plan: Plan, used: number) {
  return used < PLANS[plan].fileUploadLimit;
}

export function canRecordMinutes(plan: Plan, used: number, requestMinutes = 1) {
  const limit = PLANS[plan].voiceMinutesLimit;
  if (limit === 0) return false;
  return used + requestMinutes <= limit;
}

export function planHasFeature(plan: Plan, feature: FeatureKey) {
  return PLANS[plan].features[feature];
}

export function remainingUploads(plan: Plan, used: number) {
  const limit = PLANS[plan].fileUploadLimit;
  if (limit === Infinity) return Infinity;
  return Math.max(0, limit - used);
}

export function remainingVoiceMinutes(plan: Plan, used: number) {
  const limit = PLANS[plan].voiceMinutesLimit;
  if (limit === Infinity) return Infinity;
  return Math.max(0, limit - used);
}
