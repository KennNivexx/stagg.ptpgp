// Third fallback tier for HRD Copilot, tried only when both Groq and Gemini
// are rate-limited — see src/app/actions/hrd-copilot.ts. OpenRouter speaks
// the same OpenAI-compatible chat-completions + tool-calling protocol Groq
// does, but calling it through the groq-sdk client (just pointed at
// OpenRouter's baseURL) produced garbled responses in testing — plain
// fetch against OpenRouter's REST endpoint verified working correctly, so
// this talks to it directly instead of going through an SDK built for a
// different provider.
export function getOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY belum diatur di .env.local — dapatkan gratis di https://openrouter.ai/keys");
  }
  return apiKey;
}

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Verified free (cost: 0) and tool-call-capable as of testing — OpenRouter's
// free-model roster changes over time, so if this one gets retired, check
// GET https://openrouter.ai/api/v1/models for other `:free` + tool-capable
// entries and swap the id here. OpenRouter's free models have their own
// rate-limit pool separate from both Groq and Google, which is the whole
// point of this tier — Groq/Gemini being exhausted doesn't affect this one.
export const OPENROUTER_COPILOT_MODEL = "openai/gpt-oss-20b:free";
