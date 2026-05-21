export type SourceType = "audio" | "pdf" | "docx" | "pptx" | "image" | "text";

export type Flashcard = { front: string; back: string };

export type QuizQuestion = {
  question: string;
  options: string[];
  correct: number; // index of correct answer
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
