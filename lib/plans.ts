export type Plan = "free" | "student" | "pro" | "max";

// Feature flags — which tabs a plan unlocks. Smart Notes is always free.
export type FeatureKey = "notes" | "flashcards" | "quiz" | "summary" | "chat" | "voice";

export const PLANS: Record<
  Plan,
  {
    name: string;
    price: number; // monthly, EUR
    currency: "EUR";
    fileUploadLimit: number;       // generations per month (study set / essay / presentation)
    voiceMinutesLimit: number;     // 1 token = 1 minute
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
    fileUploadLimit: 2,
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
      "2 generations / month",
      "Smart Notes only",
      "Try the experience",
    ],
    cta: "Start free",
  },
  student: {
    name: "Student",
    price: 9,
    currency: "EUR",
    fileUploadLimit: 15,
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
      "15 generations / month",
      "1 hour of voice scanning",
      "All AI features unlocked",
      "Essays + presentations + study sets",
      "Chat with your lectures",
    ],
    cta: "Choose Student",
  },
  pro: {
    name: "Pro",
    price: 19,
    currency: "EUR",
    fileUploadLimit: 40,
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
      "40 generations / month",
      "5 hours of voice scanning",
      "All AI features unlocked",
      "Priority processing",
      "Early access to new features",
    ],
    cta: "Choose Pro",
    highlight: true,
  },
  max: {
    name: "Max",
    price: 39,
    currency: "EUR",
    fileUploadLimit: 120,
    voiceMinutesLimit: 900,
    features: {
      notes: true,
      flashcards: true,
      quiz: true,
      summary: true,
      chat: true,
      voice: true,
    },
    perks: [
      "120 generations / month",
      "15 hours of voice scanning",
      "Everything in Pro",
      "Highest priority queue",
      "Future team sharing",
    ],
    cta: "Choose Max",
  },
};

export const PLAN_KEYS: Plan[] = ["free", "student", "pro", "max"];
export const PAID_PLAN_KEYS: Exclude<Plan, "free">[] = ["student", "pro", "max"];

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
