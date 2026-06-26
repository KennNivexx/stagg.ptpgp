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
  const key = getEncryptionKey();
  if (!key) return JSON.parse(token); // no key = stored as plain JSON (dev fallback)
  const { iv, data, tag } = JSON.parse(token);
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]);
  return JSON.parse(decrypted.toString("utf-8"));
}
