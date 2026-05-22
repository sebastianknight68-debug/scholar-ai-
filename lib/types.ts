export type SourceType = "audio" | "pdf" | "docx" | "pptx" | "image" | "text";

export type Flashcard = { front: string; back: string };

export type QuizQuestion = {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

export type Summary = {
  tldr: string;
  takeaways: string[];
  exam_topics: string[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  ts: number;
};

export type StudySetRow = {
  id: string;
  user_id: string;
  title: string;
  sources: SourceType[];
  status: "draft" | "processing" | "ready" | "error";
  created_at: string;
};

export type UserProfileRow = {
  id: string;
  email: string;
  plan: "free" | "starter" | "pro" | "max";
  file_uploads_used_this_month: number;
  voice_minutes_used_this_month: number;
  recordings_period_start: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
};
