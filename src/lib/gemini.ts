import { GoogleGenerativeAI } from "@google/generative-ai";

// Fallback provider for HRD Copilot when Groq is rate-limited — same
// lazy-singleton pattern as src/lib/groq.ts, for the same reason (don't
// throw at module load for code paths that never call the copilot).
let client: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY belum diatur di .env.local — dapatkan gratis di https://aistudio.google.com/apikey");
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

// Flash tier — fast + generous free quota, matching why Groq was picked as
// primary. Note: the API key format your account uses (starting "AQ.")
// looks different from the usual Google AI Studio key format ("AIzaSy...")
// — if calls fail with an auth error, double-check this was copied from
// https://aistudio.google.com/apikey specifically, not a different Google
// product's credential.
export const GEMINI_COPILOT_MODEL = "gemini-2.0-flash";
