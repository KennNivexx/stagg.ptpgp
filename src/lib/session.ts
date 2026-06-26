function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is required. Set it in .env.local");
  }
  return secret;
}

function toBase64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function signSession(payload: Record<string, string>): Promise<string> {
  const sessionPayload = {
    ...payload,
    iat: String(Math.floor(Date.now() / 1000)),
    exp: String(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7),
  };
  const secret = getSecret();
  const enc = new TextEncoder();
  const payloadBytes = enc.encode(JSON.stringify(sessionPayload));
  const data = toBase64url(payloadBytes.buffer as ArrayBuffer);
  const secretBytes = enc.encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes.buffer.slice(secretBytes.byteOffset, secretBytes.byteOffset + secretBytes.byteLength) as ArrayBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data) as BufferSource);
  return `${data}.${toBase64url(sig)}`;
}

async function verifySession(token: string): Promise<Record<string, string> | null> {
  try {
    const secret = getSecret();
    const enc = new TextEncoder();
    const [data, sigB64] = token.split(".");
    if (!data || !sigB64) return null;
    const secretBytes = enc.encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes.buffer.slice(secretBytes.byteOffset, secretBytes.byteOffset + secretBytes.byteLength) as ArrayBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigDecoded = fromBase64url(sigB64);
    const sigBytes = sigDecoded.buffer.slice(sigDecoded.byteOffset, sigDecoded.byteOffset + sigDecoded.byteLength) as ArrayBuffer;
    const dataEncoded = enc.encode(data);
    const dataBytes = dataEncoded.buffer.slice(dataEncoded.byteOffset, dataEncoded.byteOffset + dataEncoded.byteLength) as ArrayBuffer;
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);
    if (!valid) return null;
    const session = JSON.parse(new TextDecoder().decode(fromBase64url(data)));

    if (session.exp) {
      const exp = parseInt(session.exp, 10);
      if (Date.now() / 1000 > exp) return null;
    }

    return session;
  } catch {
    return null;
  }
}

export { signSession, verifySession };
