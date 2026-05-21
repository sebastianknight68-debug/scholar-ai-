import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function truncate(str: string, n: number) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n).trimEnd() + "…" : str;
}

export function isMockMode() {
  // If core keys aren't set, run in mock mode so dev still works.
  return (
    !process.env.ANTHROPIC_API_KEY ||
    !process.env.OPENAI_API_KEY ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL
  );
}
