/**
 * Face descriptor encryption utilities using AES-256-GCM.
 * SERVER-ONLY — do not import from client components.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function getEncryptionKey(): Buffer | null {
  const hex = process.env.FACE_ENCRYPTION_KEY;
  if (!hex) return null;
  return Buffer.from(hex, "hex");
}

export function encryptDescriptor(descriptor: number[]): string {
  const key = getEncryptionKey();
  if (!key) return JSON.stringify(descriptor); // no key = no encryption (dev fallback)
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const json = JSON.stringify(descriptor);
  const encrypted = Buffer.concat([cipher.update(json, "utf-8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    iv: iv.toString("base64"),
    data: encrypted.toString("base64"),
    tag: tag.toString("base64"),
  });
}

export function decryptDescriptor(token: string): number[] {
  const parsed = JSON.parse(token);
  // Plain descriptors are stored as a JSON array; encrypted ones as a
  // {iv, data, tag} object. This is inherently self-describing — deciding
  // based on whether FACE_ENCRYPTION_KEY happens to be set right now (rather
  // than the token's actual shape) would silently return garbage if the key
  // was added/removed after some descriptors were already stored.
  if (Array.isArray(parsed)) return parsed;

  const key = getEncryptionKey();
  if (!key) {
    throw new Error("Data wajah ini terenkripsi tapi FACE_ENCRYPTION_KEY tidak diset di server.");
  }
  const { iv, data, tag } = parsed;
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]);
  return JSON.parse(decrypted.toString("utf-8"));
}
