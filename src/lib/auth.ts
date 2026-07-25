import { randomBytes, randomInt, pbkdf2 } from "crypto";
import { promisify } from "util";

const PBKDF2_ITERATIONS = 100_000;
const pbkdf2Async = promisify(pbkdf2);

// Async (non-blocking) PBKDF2 — pbkdf2Sync ties up Node's single event-loop
// thread for the ~50-100ms the hash takes, so every concurrent request
// (not just other logins) stalls behind it under load. The async variant
// runs on libuv's threadpool instead, so the event loop stays free.
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await pbkdf2Async(password, salt, PBKDF2_ITERATIONS, 64, "sha512")).toString("hex");
  return `${salt}:${hash}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  const verify = (await pbkdf2Async(password, salt, PBKDF2_ITERATIONS, 64, "sha512")).toString("hex");
  return hash === verify;
}

function generateRandomPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;
  const arr = [
    upper[randomInt(upper.length)],
    lower[randomInt(lower.length)],
    digits[randomInt(digits.length)],
    special[randomInt(special.length)],
  ];
  for (let i = 4; i < 12; i++) {
    arr.push(all[randomInt(all.length)]);
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

function generateNumericPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let pw = "";
  for (let i = 0; i < length; i++) {
    pw += chars[randomInt(chars.length)];
  }
  return pw;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, ".")
    .replace(/\.+/g, ".");
}

function generateCompanyEmail(fullName: string): string {
  const domain = "@ptpgp.co.id";
  const slug = slugify(fullName);
  return `${slug}${domain}`;
}

function generateCompanyEmailUnique(
  fullName: string,
  existingEmails: string[]
): string {
  const domain = "@ptpgp.co.id";
  const slug = slugify(fullName);
  const base = `${slug}${domain}`;
  if (!existingEmails.includes(base)) return base;
  let counter = 2;
  while (existingEmails.includes(`${slug}${counter}${domain}`)) {
    counter++;
  }
  return `${slug}${counter}${domain}`;
}

export {
  hashPassword,
  verifyPassword,
  generateRandomPassword,
  generateNumericPassword,
  generateCompanyEmail,
  generateCompanyEmailUnique,
};
