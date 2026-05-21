export type Plan = "free" | "student" | "pro";

export const PLANS: Record<
  Plan,
  {
    name: string;
    price: number;
    monthlyRecordingLimit: number; // Infinity for unlimited
    features: string[];
    cta: string;
    highlight?: boolean;
  }
> = {
  free: {
    name: "Free",
    price: 0,
    monthlyRecordingLimit: 3,
    features: [
      "3 study sets / month",
      "Transcript + smart notes",
      "Flashcards & quiz",
      "Standard processing",
    ],
    cta: "Start free",
  },
  student: {
    name: "Student",
    price: 9,
    monthlyRecordingLimit: Infinity,
    features: [
      "Unlimited study sets",
      "All AI features unlocked",
      "Chat with your lectures",
      "PDF export",
    ],
    cta: "Choose Student",
    highlight: true,
  },
  pro: {
    name: "Pro",
    price: 19,
    monthlyRecordingLimit: Infinity,
    features: [
      "Everything in Student",
      "Team sharing",
      "Priority processing",
      "Early access to new features",
    ],
    cta: "Choose Pro",
  },
};

export function canCreateStudySet(plan: Plan, used: number) {
  const limit = PLANS[plan].monthlyRecordingLimit;
  return used < limit;
}

export function remainingThisMonth(plan: Plan, used: number) {
  const limit = PLANS[plan].monthlyRecordingLimit;
  if (limit === Infinity) return Infinity;
  return Math.max(0, limit - used);
}
