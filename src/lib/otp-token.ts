/**
 * One-time login token utilities.
 * SERVER-ONLY — do not import from client components.
 */
import { createHmac } from "crypto";

function getOtpSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is required. Set it in .env.local");
  }
  return secret;
}

export function generateOneTimeToken(email: string): string {
  const payload = JSON.stringify({ email, exp: Date.now() + 86400000 });
  const data = Buffer.from(payload).toString("base64url");
  const hmac = createHmac("sha256", getOtpSecret()).update(data).digest("base64url");
  return `${data}.${hmac}`;
}

export function verifyOneTimeToken(token: string): { email: string } | null {
  try {
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;
    const expected = createHmac("sha256", getOtpSecret()).update(data).digest("base64url");
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (Date.now() > payload.exp) return null;
    if (!payload.email) return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}
