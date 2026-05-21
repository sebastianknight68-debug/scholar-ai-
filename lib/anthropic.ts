import Anthropic from "@anthropic-ai/sdk";

// Use the stable Sonnet 4.5 alias — always points to a valid model in Anthropic's catalog.
export const CLAUDE_MODEL = "claude-sonnet-4-5";

let _client: Anthropic | null = null;
export function getAnthropic() {
  if (_client) return _client;
  _client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY ?? "missing",
  });
  return _client;
}

export const hasAnthropic = () => !!process.env.ANTHROPIC_API_KEY;
