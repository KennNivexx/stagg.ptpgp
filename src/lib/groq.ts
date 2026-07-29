import Groq from "groq-sdk";

// Lazy singleton — constructing the client eagerly at module load would
// throw at build time in any environment where GROQ_API_KEY isn't set yet
// (e.g. CI, or before the user has added their key), even for code paths
// that never actually call the HRD Copilot.
let client: Groq | null = null;

export function getGroqClient(): Groq {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY belum diatur di .env.local — dapatkan gratis di https://console.groq.com/keys");
    }
    client = new Groq({ apiKey });
  }
  return client;
}

// Groq's fastest/cheapest currently-supported model with solid tool-calling
// support — swap here if Groq deprecates it, rather than hunting every call
// site.
export const HRD_COPILOT_MODEL = "llama-3.3-70b-versatile";
