import OpenAI from "openai";

let _client: OpenAI | null = null;
export function getOpenAI() {
  if (_client) return _client;
  _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "missing" });
  return _client;
}

export const hasOpenAI = () => !!process.env.OPENAI_API_KEY;
