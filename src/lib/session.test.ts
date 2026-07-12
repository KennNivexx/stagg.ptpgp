import { describe, it, expect, beforeAll } from "vitest";
import { signSession, verifySession } from "@/lib/session";

beforeAll(() => {
  process.env.SESSION_SECRET ||= "test-secret-for-vitest-only";
});

describe("signSession / verifySession", () => {
  it("round-trips a payload signed with the current secret", async () => {
    const token = await signSession({ id: "u1", role: "hrd", name: "Budi", email: "budi@ptpgp.co.id" });
    const session = await verifySession(token);
    expect(session).not.toBeNull();
    expect(session?.id).toBe("u1");
    expect(session?.role).toBe("hrd");
  });

  it("rejects a token with a tampered payload (signature no longer matches)", async () => {
    const token = await signSession({ id: "u1", role: "employee", name: "Budi", email: "budi@ptpgp.co.id" });
    const [data, sig] = token.split(".");
    // Flip the role client-side without re-signing — this is exactly what a
    // forged "make me superadmin" cookie would look like.
    const decoded = JSON.parse(Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    const tamperedData = Buffer.from(JSON.stringify({ ...decoded, role: "superadmin" }))
      .toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const forged = `${tamperedData}.${sig}`;
    expect(await verifySession(forged)).toBeNull();
  });

  it("rejects a malformed token (missing signature segment)", async () => {
    expect(await verifySession("not-a-real-token")).toBeNull();
  });

  it("rejects an expired session", async () => {
    // signSession always sets exp to now+7d, so an expired token has to be
    // hand-signed here with the exact same base64url+HMAC-SHA256 scheme —
    // this is the only way to exercise verifySession's expiry check for real
    // (a forged exp with a copied signature would just fail on tamper
    // detection instead, testing the wrong code path).
    const payload = {
      id: "u1", role: "hrd", name: "Budi", email: "budi@ptpgp.co.id",
      iat: String(Math.floor(Date.now() / 1000) - 3600),
      exp: String(Math.floor(Date.now() / 1000) - 10),
    };
    const toBase64url = (buf: ArrayBuffer) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const enc = new TextEncoder();
    const data = toBase64url(enc.encode(JSON.stringify(payload)).buffer as ArrayBuffer);
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(process.env.SESSION_SECRET as string), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
    );
    const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(data));
    const expiredToken = `${data}.${toBase64url(sigBuf)}`;

    expect(await verifySession(expiredToken)).toBeNull();
  });
});
